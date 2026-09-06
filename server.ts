import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { 
  resolveModelId, 
  getTranslationFallbackChain, 
  DEFAULT_TRANSLATION_MODEL_ID, 
  DEFAULT_TRANSCRIPTION_MODEL_ID 
} from './src/modelRegistry';
import { 
  buildChatCompletionsUrl, 
  validateCustomProviderConfig, 
  sanitizeErrorMessage,
  normalizeOpenAiTranslationResponse,
  extractJsonFromText,
  classifyCustomProviderError
} from './src/lib/customProviderService';

dotenv.config();

// Safe _dirname resolution compatible with both ESM (tsx) and compiled CommonJS (dist/server.cjs)
const _dirname = typeof __dirname !== 'undefined'
  ? __dirname
  : process.cwd();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable CORS and parse JSON/URL-encoded bodies
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-gemini-api-key, x-gemini-api-keys');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initializer for GoogleGenAI
function getGenAIClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('کلید API جمینای تنظیم نشده است. لطفا کلید خود را در منوی "کلید API" بالای صفحه وارد کنید.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Tone descriptions map for prompt engineering
const TONE_PROMPTS: Record<string, string> = {
  cinematic: 'سینمایی و دراماتیک (لحن شیوا، دراماتیک و مناسب دوبله و فیلم‌های سینمایی فاخر)',
  conversational: 'عامیانه و گفتاری (زبان روزمره، صمیمی، روانی مکالمات خیابانی، اصطلاحات روز و ولاگ)',
  formal: 'رسمی، کتابی و دقیق (وفاداری کامل به واژگان با ادبیات معیار)',
  humorous: 'طنز و شوخ‌طبعانه (استفاده طبیعی و بدون سانسور از جوک‌ها، شوخی‌های بزرگسالانه، کنایه‌ها، متلک‌ها و اصطلاحات طنز متناسب با زبان و فرهنگ مقصد)',
  educational: 'آموزشی و علمی (رعایت ترمینولوژی تخصصی، صراحت و دقت مستندهای علمی)',
  epic: 'حماسی و تاریخی (مناسب بازی‌های نقش‌آفرینی RPG، بازی‌های ویدیویی، محتوای تاریخی، افسانه‌ای و فانتزی با لحن حماسی و اساطیری فاخر)',
  custom: 'دستورالعمل و لحن اختصاصی کاربر (پیروی دقیق از قوانین سفارشی و اصطلاحات اختصاصی کاربر)',
};

// Helper function to extract array of client API keys from headers or env
function getClientKeysFromHeader(req: express.Request): string[] {
  const multiKeysHeader = req.headers['x-gemini-api-keys'] as string;
  if (multiKeysHeader) {
    try {
      const parsed = JSON.parse(multiKeysHeader);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((k) => String(k).trim()).filter(Boolean);
      }
    } catch {
      const splitKeys = multiKeysHeader.split(',').map((k) => k.trim()).filter(Boolean);
      if (splitKeys.length > 0) return splitKeys;
    }
  }

  const singleKeyHeader = req.headers['x-gemini-api-key'] as string;
  if (singleKeyHeader && singleKeyHeader.trim()) {
    return [singleKeyHeader.trim()];
  }

  const authHeader = req.headers['authorization'] as string;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const bearerKey = authHeader.substring(7).trim();
    if (bearerKey) {
      if (bearerKey.startsWith('[') && bearerKey.endsWith(']')) {
        try {
          const parsed = JSON.parse(bearerKey);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((k) => String(k).trim()).filter(Boolean);
          }
        } catch {}
      }
      return [bearerKey];
    }
  }

  if (process.env.GEMINI_API_KEY) {
    return [process.env.GEMINI_API_KEY.trim()];
  }

  return [];
}

// Helper function to execute Gemini requests with multi-key rotation, intelligent model fallback, and rate-limit backoff
async function callGeminiWithRetryAndFallback(
  apiKeys: string[],
  generateParams: {
    contents: any;
    config?: any;
  },
  preferredModel?: string
): Promise<{ response: any; modelUsed: string; isFallback: boolean }> {
  const rawKeys = apiKeys.length > 0 ? apiKeys : [];
  const keysToTry: string[] = [];
  rawKeys.forEach((k) => {
    const trimmed = String(k || '').trim();
    if (trimmed && !keysToTry.includes(trimmed)) {
      keysToTry.push(trimmed);
    }
  });

  if (process.env.GEMINI_API_KEY) {
    const envKey = process.env.GEMINI_API_KEY.trim();
    if (envKey && !keysToTry.includes(envKey)) {
      keysToTry.push(envKey);
    }
  }

  if (keysToTry.length === 0) {
    throw new Error('کلید API جمینای تنظیم نشده است. لطفاً کلید API خود را وارد کنید.');
  }

  // Optimized fallback order based on the user's selected model archetype
  let models: string[] = [];
  const targetModel = preferredModel && preferredModel !== 'gemini-live-stream'
    ? resolveModelId(preferredModel)
    : DEFAULT_TRANSLATION_MODEL_ID;

  if (targetModel === 'gemini-3.5-transcribe') {
    models = ['gemini-3.5-transcribe', 'gemini-3.8-flash', 'gemini-3.6-flash'];
  } else {
    models = getTranslationFallbackChain(targetModel);
  }

  let lastError: any = null;

  for (let kIdx = 0; kIdx < keysToTry.length; kIdx++) {
    const currentKey = keysToTry[kIdx];
    if (!currentKey) continue;

    let ai: GoogleGenAI;
    try {
      ai = getGenAIClient(currentKey);
    } catch (e) {
      lastError = e;
      continue;
    }

    for (let mIdx = 0; mIdx < models.length; mIdx++) {
      const modelName = models[mIdx];
      let attempts = 0;
      const maxAttemptsPerModel = 2;

      while (attempts < maxAttemptsPerModel) {
        attempts++;
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: generateParams.contents,
            config: generateParams.config,
          });
          
          const isFallback = Boolean(modelName !== targetModel);
          return { response, modelUsed: modelName, isFallback };
        } catch (err: any) {
          const msg = err?.message || String(err);
          const is404 = msg.includes('404') || msg.toLowerCase().includes('not found');

          if (!is404 || !lastError) {
            lastError = err;
          }

          const isRateLimit =
            msg.includes('429') ||
            msg.toLowerCase().includes('quota') ||
            msg.toLowerCase().includes('resource_exhausted');

          const isAuthError =
            msg.includes('401') ||
            msg.includes('403') ||
            msg.toLowerCase().includes('api_key') ||
            msg.toLowerCase().includes('unauthorized') ||
            msg.toLowerCase().includes('permission_denied') ||
            msg.toLowerCase().includes('invalid api key');

          if (isAuthError) {
            console.warn(`[Gemini Auth Error] Key #${kIdx + 1} is unauthorized or invalid. Skipping remaining models for this key...`);
            mIdx = models.length; // exit inner model loop
            break; // exit attempts loop
          }

          if (isRateLimit) {
            // 1. If we have more API keys, failover to the next key immediately for current model
            if (kIdx < keysToTry.length - 1) {
              console.warn(`[Gemini Rate Limit] Key #${kIdx + 1} exhausted quota for ${modelName}. Switching to Key #${kIdx + 2}...`);
              break; // exit model loop to try next key in outer loop
            }

            // 2. If we have more models to try, failover to the next tier model immediately
            if (mIdx < models.length - 1 && attempts >= 1) {
              console.warn(`[Gemini Rate Limit] Model ${modelName} rate limited. Falling back to ${models[mIdx + 1]}...`);
              break; // exit attempts loop to try next model in inner loop
            }

            // 3. Otherwise wait for requested retry duration or exponential backoff
            let delayMs = 4000;
            const match = msg.match(/retry in ([0-9.]+)s/i);
            if (match && match[1]) {
              const parsedSec = parseFloat(match[1]);
              if (!isNaN(parsedSec) && parsedSec > 0) {
                delayMs = Math.min(Math.ceil(parsedSec * 1000) + 1000, 60000);
              }
            }
            console.warn(`[Gemini Rate Limit] Model: ${modelName}, Key: #${kIdx + 1}, Attempt: ${attempts}/${maxAttemptsPerModel}. Waiting ${Math.round(delayMs / 1000)}s...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          } else {
            // Non-rate-limit error (e.g. 404 or bad syntax), move to next model
            break;
          }
        }
      }
    }
  }

  throw lastError || new Error('خطا در ارتباط با هوش مصنوعی. لطفاً کلید API جمینای خود را در تنظیمات بررسی یا به‌روزرسانی کنید.');
}

// Custom Provider (BYOK) Connection Test
async function testCustomProviderConnection(config: {
  baseUrl: string;
  apiKey: string;
  model: string;
}): Promise<{
  success: boolean;
  error?: string;
  errorType?: string;
  latencyMs?: number;
  modelResponded?: string;
}> {
  const { baseUrl, apiKey, model } = config || {};
  const validation = validateCustomProviderConfig(config);
  if (!validation.valid) {
    return {
      success: false,
      errorType: 'invalid_url',
      error: validation.error || 'تنظیمات سرویس‌دهنده سفارشی نامعتبر است.',
    };
  }

  let targetUrl: string;
  try {
    targetUrl = buildChatCompletionsUrl(baseUrl);
  } catch (err: any) {
    return {
      success: false,
      errorType: 'invalid_url',
      error: sanitizeErrorMessage(err?.message || 'فرمت آدرس نامعتبر است.', apiKey),
    };
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: model.trim(),
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 5,
      }),
      signal: controller.signal,
      redirect: 'error',
    });
    clearTimeout(timeoutTimer);
    const latencyMs = Date.now() - startTime;

    if (response.ok) {
      const data: any = await response.json().catch(() => null);
      if (!data) {
        return {
          success: false,
          errorType: 'invalid_response',
          error: 'سرویس‌دهنده پاسخی خالی یا نامعتبر ارسال کرد.',
          latencyMs,
        };
      }
      return {
        success: true,
        latencyMs,
        modelResponded: data.model || model.trim(),
      };
    }

    // Handle non-200 responses
    const errData: any = await response.json().catch(() => null);
    const rawMsg =
      errData?.error?.message ||
      errData?.message ||
      errData?.error ||
      `HTTP ${response.status} ${response.statusText}`;
    const safeMsg = sanitizeErrorMessage(String(rawMsg), apiKey);

    if (response.status === 401) {
      return {
        success: false,
        errorType: 'invalid_key',
        error: 'Invalid API key / Authentication failed (401). Please check your API key.',
        latencyMs,
      };
    }
    if (response.status === 403) {
      return {
        success: false,
        errorType: 'auth_failed',
        error: `Authentication failed / Access forbidden (403): ${safeMsg}`,
        latencyMs,
      };
    }
    if (response.status === 404) {
      const isModelNotFound = /model/i.test(safeMsg);
      return {
        success: false,
        errorType: isModelNotFound ? 'model_not_found' : 'endpoint_not_found',
        error: isModelNotFound
          ? `Model "${model.trim()}" not found on this provider.`
          : 'Endpoint not found (404). Please verify your Base API URL.',
        latencyMs,
      };
    }
    if (response.status === 429) {
      return {
        success: false,
        errorType: 'rate_limit',
        error: `Rate limit / Quota exceeded (429): ${safeMsg}`,
        latencyMs,
      };
    }
    if (response.status >= 500) {
      return {
        success: false,
        errorType: 'provider_error',
        error: `Provider server error (${response.status}): ${safeMsg}`,
        latencyMs,
      };
    }

    return {
      success: false,
      errorType: 'provider_error',
      error: `Provider returned an error (${response.status}): ${safeMsg}`,
      latencyMs,
    };
  } catch (err: any) {
    clearTimeout(timeoutTimer);
    const latencyMs = Date.now() - startTime;
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      return {
        success: false,
        errorType: 'timeout',
        error: 'Connection timed out after 12 seconds.',
        latencyMs,
      };
    }
    const rawErr = String(err?.message || err);
    return {
      success: false,
      errorType: 'network_error',
      error: `Network error: ${sanitizeErrorMessage(rawErr, apiKey)}`,
      latencyMs,
    };
  }
}

// Concurrency Limiter for Custom Provider Requests (Requirement 11)
class ConcurrencyLimiter {
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(private readonly maxConcurrent: number) {}

  async acquire(): Promise<() => void> {
    if (this.active < this.maxConcurrent) {
      this.active++;
      let released = false;
      return () => {
        if (!released) {
          released = true;
          this.release();
        }
      };
    }

    return new Promise<() => void>((resolve) => {
      this.queue.push(() => {
        this.active++;
        let released = false;
        resolve(() => {
          if (!released) {
            released = true;
            this.release();
          }
        });
      });
    });
  }

  private release() {
    this.active--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }

  get pendingCount() {
    return this.queue.length;
  }

  get activeCount() {
    return this.active;
  }
}

// Global limiter: Limit simultaneous outgoing requests to Custom Providers (e.g. 4 concurrent)
const customProviderLimiter = new ConcurrencyLimiter(4);

// Custom Provider Translation Handler with Full Lifecycle Deadline & Complete Body Stream Reader
async function translateWithCustomProvider(params: {
  customProvider: { baseUrl: string; apiKey: string; model: string };
  items: Array<{ id: number; text: string; key?: string; context?: string }>;
  sourceLanguage?: string;
  targetLanguage: string;
  tone?: string;
  customPrompt?: string;
  mode?: string;
  requestId: string;
  clientSignal?: AbortSignal;
}): Promise<{
  translations: Array<{ id: number; text: string }>;
  detectedSourceLanguage: string;
  modelUsed: string;
  isFallback: boolean;
  timings: any;
  responseBytes: number;
}> {
  const requestStart = Date.now();
  const { customProvider, items, sourceLanguage, targetLanguage, tone, customPrompt, mode, requestId, clientSignal } = params;

  // 1. Configuration Validation
  const validation = validateCustomProviderConfig(customProvider);
  if (!validation.valid) {
    const vErr: any = new Error(validation.error || 'Custom Provider configuration is invalid.');
    vErr.status = 400;
    vErr.errorType = 'invalid_config';
    vErr.retryable = false;
    throw vErr;
  }

  const targetUrl = buildChatCompletionsUrl(customProvider.baseUrl);
  const targetHost = new URL(targetUrl).hostname;
  const toneDescription = (tone && (TONE_PROMPTS as any)[tone]) || TONE_PROMPTS.cinematic;
  const userCustomPrompt = customPrompt?.trim() || '';

  const systemInstruction = `You are an expert translator for ${mode === 'game' ? 'video games' : 'movie & TV subtitles'}.
Translate every input item into ${targetLanguage} (Source language: ${sourceLanguage || 'Auto-detect'}).
Tone: ${toneDescription}
${userCustomPrompt ? `Custom Instruction: "${userCustomPrompt}"` : ''}

CRITICAL LOCALIZATION RULES:
1. Translate ONLY the text fields. Retain all item IDs and ordering.
2. VARIABLE & TAG ISOLATION: Retain tags (<i>, <b>, {\\pos(...)}), system variables ({player_name}, %s, $amount, [TAG]) exactly without translation or modification.
3. OUTPUT FORMAT: Respond ONLY with a valid JSON object matching this schema:
{
  "detectedSourceLanguage": "...",
  "translations": [
    { "id": 1, "text": "..." }
  ]
}
Do NOT return any markdown wrapper, conversational filler, or text outside the JSON.`;

  const userPrompt = `Translate the following ${items.length} items into ${targetLanguage}:\n` +
    JSON.stringify(items.map((i) => ({ id: i.id, text: i.text, key: i.key, context: i.context })), null, 2);

  const requestPayloadObj = {
    model: customProvider.model.trim(),
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
  };

  const requestPayloadString = JSON.stringify(requestPayloadObj);

  // Request Size Check (Requirement 17: Bounded request size, max 2MB)
  if (requestPayloadString.length > 2 * 1024 * 1024) {
    const sizeErr: any = new Error('CUSTOM_PROVIDER_REQUEST_TOO_LARGE: Request payload exceeds 2MB limit.');
    sizeErr.status = 413;
    sizeErr.errorType = 'request_too_large';
    sizeErr.retryable = false;
    throw sizeErr;
  }

  // Requirement 3: Overall Deadline covering DNS, connect, headers, body reading, and JSON parsing
  const DEADLINE_MS = 60000; // 60 seconds hard overall deadline
  const deadlineController = new AbortController();
  let deadlineTimer: NodeJS.Timeout | null = setTimeout(() => {
    deadlineController.abort(new Error('CUSTOM_PROVIDER_TIMEOUT'));
  }, DEADLINE_MS);

  // Combine deadline and client cancellation signal
  const combinedSignal = clientSignal
    ? AbortSignal.any([deadlineController.signal, clientSignal])
    : deadlineController.signal;

  let releaseLock: (() => void) | null = null;
  let fetchStart = 0;
  let headersReceived = 0;
  let bodyStart = 0;
  let bodyComplete = 0;
  let jsonParsed = 0;
  let receivedBytes = 0;

  try {
    // Acquire concurrency slot
    releaseLock = await customProviderLimiter.acquire();

    if (combinedSignal.aborted) {
      throw new Error('Request aborted before dispatch');
    }

    fetchStart = Date.now();

    // Outgoing HTTP request to Custom Provider
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customProvider.apiKey.trim()}`,
      },
      body: requestPayloadString,
      signal: combinedSignal,
      redirect: 'error', // Block automatic redirects (Requirement 14 & SSRF Protection)
    });

    headersReceived = Date.now();

    // Check HTTP Status
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      const errJson = extractJsonFromText(errText);
      const rawMsg = errJson?.error?.message || errJson?.message || errText || `HTTP ${response.status} ${response.statusText}`;
      const safeMsg = sanitizeErrorMessage(rawMsg, customProvider.apiKey);
      const classified = classifyCustomProviderError(new Error(safeMsg), response.status);
      const errObj: any = new Error(classified.message);
      errObj.status = classified.status;
      errObj.errorType = classified.errorType;
      errObj.retryable = classified.retryable;
      throw errObj;
    }

    // Requirement 4 & 16: Safe & Complete Response Body Stream Reader with bounded limit
    bodyStart = Date.now();
    const reader = response.body?.getReader();
    if (!reader) {
      const bodyErr: any = new Error('Custom provider returned an empty response body stream.');
      bodyErr.status = 502;
      bodyErr.errorType = 'truncated_response';
      bodyErr.retryable = true;
      throw bodyErr;
    }

    const MAX_RESPONSE_BYTES = 10 * 1024 * 1024; // 10MB limit (Requirement 16)
    const chunks: Uint8Array[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          receivedBytes += value.length;
          if (receivedBytes > MAX_RESPONSE_BYTES) {
            try { await reader.cancel(); } catch {}
            const tooLargeErr: any = new Error('CUSTOM_PROVIDER_RESPONSE_TOO_LARGE: Response exceeded 10MB limit.');
            tooLargeErr.status = 502;
            tooLargeErr.errorType = 'response_too_large';
            tooLargeErr.retryable = false;
            throw tooLargeErr;
          }
          chunks.push(value);
        }
      }
    } catch (readErr: any) {
      if (combinedSignal.aborted) {
        if (deadlineController.signal.aborted) {
          const timeoutErr: any = new Error('CUSTOM_PROVIDER_TIMEOUT: Overall deadline expired while reading response body.');
          timeoutErr.status = 408;
          timeoutErr.errorType = 'timeout';
          timeoutErr.retryable = true;
          throw timeoutErr;
        }
        const cancelErr: any = new Error('Request was cancelled by client.');
        cancelErr.status = 499;
        cancelErr.errorType = 'cancelled';
        cancelErr.retryable = false;
        throw cancelErr;
      }
      const truncErr: any = new Error(`Connection dropped mid-stream while reading response: ${readErr.message}`);
      truncErr.status = 502;
      truncErr.errorType = 'truncated_response';
      truncErr.retryable = true;
      throw truncErr;
    }

    bodyComplete = Date.now();

    // Check Content-Length header if provided by provider
    const contentLengthHeader = response.headers.get('content-length');
    if (contentLengthHeader) {
      const expected = parseInt(contentLengthHeader, 10);
      if (!isNaN(expected) && expected > 0 && receivedBytes < expected) {
        const truncErr: any = new Error(`CUSTOM_PROVIDER_TRUNCATED_BODY: Received ${receivedBytes} of expected ${expected} bytes.`);
        truncErr.status = 502;
        truncErr.errorType = 'truncated_response';
        truncErr.retryable = true;
        throw truncErr;
      }
    }

    // Requirement 4 & 5: Complete JSON parsing & truncation detection
    const fullText = Buffer.concat(chunks).toString('utf-8');
    if (!fullText || fullText.trim().length === 0) {
      const emptyErr: any = new Error('Custom provider returned an empty response body.');
      emptyErr.status = 502;
      emptyErr.errorType = 'truncated_response';
      emptyErr.retryable = true;
      throw emptyErr;
    }

    let rawJson: any;
    try {
      rawJson = JSON.parse(fullText);
    } catch (jsonErr: any) {
      // Detect partial/truncated JSON (Requirement 5)
      const isPartial = fullText.includes('choices') || fullText.includes('content') || fullText.includes('translations');
      const err: any = new Error(
        isPartial 
          ? 'Custom provider response was truncated in the middle of JSON data (truncated JSON).' 
          : 'Custom provider returned malformed non-JSON output.'
      );
      err.status = 502;
      err.errorType = isPartial ? 'truncated_response' : 'malformed_json';
      err.retryable = true;
      throw err;
    }

    jsonParsed = Date.now();

    // Requirement 24: Strict Normalization and Validation
    const normalized = normalizeOpenAiTranslationResponse(rawJson, items, customProvider.model.trim());

    // Calculate Telemetry timings (Requirement 2)
    const timings = {
      request_start: requestStart,
      provider_fetch_start: fetchStart,
      provider_headers_received: headersReceived,
      provider_body_start: bodyStart,
      provider_body_complete: bodyComplete,
      provider_json_parsed: jsonParsed,
      response_sent: Date.now(),
      request_complete: Date.now(),
      elapsed_ms: Date.now() - requestStart,
      status: response.status,
      response_bytes: receivedBytes,
      provider_host: targetHost,
      model: customProvider.model.trim(),
      batch_size: items.length,
    };

    return {
      ...normalized,
      timings,
      responseBytes: receivedBytes,
    };
  } catch (err: any) {
    if (deadlineTimer) {
      clearTimeout(deadlineTimer);
      deadlineTimer = null;
    }
    if (err?.name === 'AbortError' || combinedSignal.aborted) {
      if (deadlineController.signal.aborted) {
        const timeoutErr: any = new Error('CUSTOM_PROVIDER_TIMEOUT: Overall deadline (60s) expired.');
        timeoutErr.status = 408;
        timeoutErr.errorType = 'timeout';
        timeoutErr.retryable = true;
        throw timeoutErr;
      }
      if (clientSignal?.aborted) {
        const cancelErr: any = new Error('Request was cancelled by client.');
        cancelErr.status = 499;
        cancelErr.errorType = 'cancelled';
        cancelErr.retryable = false;
        throw cancelErr;
      }
      // Upstream socket reset or internal fetch abort
      const netErr: any = new Error(`Connection was reset or aborted by upstream provider: ${err?.message || 'Network error'}`);
      netErr.status = 502;
      netErr.errorType = 'network_error';
      netErr.retryable = true;
      throw netErr;
    }
    throw err;
  } finally {
    if (deadlineTimer) {
      clearTimeout(deadlineTimer);
      deadlineTimer = null;
    }
    if (releaseLock) {
      releaseLock();
    }
  }
}

// API Endpoint: Translate batch of subtitle or game localization items
app.post('/api/translate', async (req, res) => {
  const requestId = 'req_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  const jobId = req.body.jobId || ('job_' + Date.now().toString(36));

  // Client Cancellation Listener (Requirement 9: Real Cancellation)
  // CRITICAL: Must listen to res.on('close'), NOT req.on('close').
  // In Node.js, req.on('close') fires as soon as the POST request payload finishes streaming from client,
  // whereas res.on('close') fires when the connection terminates before res.end() is called.
  const clientAbortController = new AbortController();
  const onClientClose = () => {
    if (!res.writableEnded) {
      clientAbortController.abort();
    }
  };
  res.on('close', onClientClose);
  res.on('finish', () => {
    res.off('close', onClientClose);
  });

  try {
    const { items, sourceLanguage, targetLanguage, tone, customPrompt, mode, model, provider, customProvider } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'آیتمی برای ترجمه ارسال نشده است.',
        errorType: 'invalid_config',
        retryable: false,
        requestId,
        jobId,
      });
    }

    if (provider === 'custom') {
      if (!customProvider) {
        return res.status(400).json({ 
          success: false, 
          error: 'Custom Provider configuration is missing.',
          errorType: 'invalid_config',
          retryable: false,
          requestId,
          jobId,
        });
      }

      try {
        const customResult = await translateWithCustomProvider({
          customProvider,
          items,
          sourceLanguage,
          targetLanguage,
          tone,
          customPrompt,
          mode,
          requestId,
          clientSignal: clientAbortController.signal,
        });

        // Telemetry Logging in Dev/Debug without logging API keys or prompts (Requirement 2)
        const t = customResult.timings;
        const headersDuration = t.provider_headers_received && t.provider_fetch_start ? (t.provider_headers_received - t.provider_fetch_start) : 0;
        const bodyDuration = t.provider_body_complete && t.provider_body_start ? (t.provider_body_complete - t.provider_body_start) : 0;
        const parseDuration = t.provider_json_parsed && t.provider_body_complete ? (t.provider_json_parsed - t.provider_body_complete) : 0;

        console.log(`[CustomProvider Telemetry] requestId=${requestId} jobId=${jobId} host=${t.provider_host} model=${t.model} status=${t.status} bytes=${customResult.responseBytes} batch=${items.length} elapsed=${t.elapsed_ms}ms (headers=${headersDuration}ms, body=${bodyDuration}ms, parse=${parseDuration}ms)`);

        return res.json({
          success: true,
          translations: customResult.translations,
          detectedSourceLanguage: customResult.detectedSourceLanguage,
          modelUsed: customResult.modelUsed,
          isFallback: customResult.isFallback,
          requestId,
          jobId,
          timings: customResult.timings,
        });
      } catch (err: any) {
        const classified = classifyCustomProviderError(err, err.status);
        console.error(`[CustomProvider Error] requestId=${requestId} jobId=${jobId} errorType=${classified.errorType} retryable=${classified.retryable} status=${classified.status} message=${classified.message}`);
        
        return res.status(classified.status).json({
          success: false,
          error: classified.message,
          errorType: classified.errorType,
          retryable: classified.retryable,
          requestId,
          jobId,
        });
      }
    } else {
      // Gemini Default Provider
      const apiKeys = getClientKeysFromHeader(req);
      const toneDescription = TONE_PROMPTS[tone] || TONE_PROMPTS.cinematic;
      const userCustomPrompt = customPrompt?.trim() || '';

      const systemInstruction = `SYSTEM INSTRUCTION FOR LOCALIZATION ENGINE:
You are an expert translator for movies and video games.

[TONE & INSTRUCTIONS]
Apply the selected default tone (${toneDescription}), OR if a custom instruction is provided, follow it strictly:
User Custom Instruction: "${userCustomPrompt || 'None'}"
${mode === 'game' ? 'Operational Mode: Video Game Localization Engine (Dialogue, UI, Quests, Items, Lore)' : 'Operational Mode: Movie & TV Subtitles (Cinema Engine)'}

[CRITICAL CONSTRAINTS - DO NOT VIOLATE]
1. PRESERVE STRUCTURE:
   - For Movies: NEVER alter or omit any timecode, index number, or line spacing.
   - For Games: NEVER alter JSON keys, CSV separators, or structural IDs. Translate ONLY the target text fields.
   - You MUST translate every single input item provided in the array. Do NOT omit, combine, or skip any item IDs. Every item in input MUST have a matching object in the "translations" array.

2. VARIABLE & TAG ISOLATION (STRICT RULE FOR GAMES AND SUBTITLES):
   - You MUST NOT translate, modify, or corrupt any code variables, formatting tags, or placeholders.
   - Retain these EXACTLY as they appear in the source text:
     * System variables: {player_name}, {0}, %s, %d, $amount, {ITEM_ID}, [TAG]
     * Line breaks & control characters: \\n, \\r, \\t
     * Styling tags: <i>, </i>, <b>, </b>, <u>, </u>, <color=#HEX>, </color>, <font=NAME>, </font>
     * ASS/SSA subtitle codes: {\\pos(...)}, {\\c&H...}, {\\i1}, {\\b1}
   - Place translated text around these variables naturally without removing or altering them.

3. ENCODING & OUTPUT FORMAT:
   - Always process and output clean, valid UTF-8 text (or UTF-8 with BOM for CSV exports to ensure Excel compatibility with Persian/RTL characters).
   - Return raw translated content with zero conversational filler, no introductions, and no wrapping markdown unless strictly part of the original format.

4. UNCENSORED & NATURAL TRANSLATION:
   - When 'humorous', 'conversational', or 'epic' tone is active, translate jokes, battle cries, fantasy lore, adult humor, and street slang naturally into authentic target language equivalents without censoring, omitting, sanitizing, or softening any text.

5. JSON RESPONSE FORMAT:
   - You MUST return a JSON object containing an array "translations" where each object has "id" (matching input ID) and "text" (translated string), plus "detectedSourceLanguage" (string describing detected input language).`;

      const promptText = `Translate the following ${items.length} ${mode === 'game' ? 'game strings' : 'subtitle lines'} into ${targetLanguage} (Source language: ${sourceLanguage || 'Auto-detect'}):\n` +
        JSON.stringify(items, null, 2);

      const { response, modelUsed, isFallback } = await callGeminiWithRetryAndFallback(apiKeys, {
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
          ],
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedSourceLanguage: {
                type: Type.STRING,
                description: 'The detected original language (e.g. English, French, Japanese)'
              },
              translations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    text: { type: Type.STRING }
                  },
                  required: ['id', 'text']
                }
              }
            },
            required: ['translations']
          }
        }
      }, model);

      const responseText = response.text || '{}';
      let parsedData: any;
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        return res.status(500).json({ 
          success: false, 
          error: 'خطا در قالب‌بندی پاسخ هوش مصنوعی.',
          errorType: 'malformed_json',
          retryable: true,
          requestId,
          jobId,
        });
      }

      parsedData.modelUsed = modelUsed;
      parsedData.isFallback = isFallback;

      // Strict integrity check: Ensure every input item is mapped to an output translation
      const rawTranslations = Array.isArray(parsedData.translations) ? parsedData.translations : [];
      const translationMap = new Map<number, string>();
      rawTranslations.forEach((t: any) => {
        if (t && typeof t.id === 'number') {
          translationMap.set(t.id, String(t.text ?? ''));
        }
      });

      const missingIds: number[] = [];
      const verifiedTranslations = items.map((inputItem: any) => {
        if (!translationMap.has(inputItem.id)) {
          missingIds.push(inputItem.id);
        }
        return {
          id: inputItem.id,
          text: translationMap.has(inputItem.id) ? translationMap.get(inputItem.id)! : '',
        };
      });

      if (missingIds.length > 0) {
        return res.status(502).json({
          success: false,
          error: `مدل هوش مصنوعی ${missingIds.length} سطر را ترجمه نکرده است.`,
          errorType: 'missing_translations',
          retryable: true,
          requestId,
          jobId,
        });
      }

      parsedData.translations = verifiedTranslations;
      parsedData.success = true;
      parsedData.requestId = requestId;
      parsedData.jobId = jobId;

      return res.json(parsedData);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error during translation';
    console.error('Translation error:', err);

    const isRateLimit = message.includes('429') || message.toLowerCase().includes('quota') || message.toLowerCase().includes('resource_exhausted');
    const isAuthError = message.includes('401') || message.includes('403') || message.toLowerCase().includes('api_key') || message.toLowerCase().includes('unauthorized');

    if (isRateLimit) {
      return res.status(429).json({ 
        success: false, 
        error: 'Rate limit / Quota exceeded. Retrying automatically...', 
        errorType: 'rate_limit',
        retryable: true,
        requestId,
        jobId,
        details: message 
      });
    }
    if (isAuthError) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or unauthorized Gemini API key. Please check your BYOK configuration.', 
        errorType: 'auth_failure',
        retryable: false,
        requestId,
        jobId,
        details: message 
      });
    }

    return res.status(500).json({ 
      success: false, 
      error: message, 
      errorType: 'provider_error',
      retryable: true,
      requestId,
      jobId,
    });
  }
});

// API Endpoint: Live Real-Time Streaming Translation (Server-Sent Events)
app.post('/api/translate-stream', async (req, res) => {
  // Set SSE streaming headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { items, sourceLanguage, targetLanguage, tone, customPrompt, mode, model } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      sendEvent('error', { error: 'آیتمی برای ترجمه ارسال نشده است.' });
      return res.end();
    }

    const apiKeys = getClientKeysFromHeader(req);
    const rawKeys = apiKeys.length > 0 ? apiKeys : [];
    const keysToTry: string[] = [];
    rawKeys.forEach((k) => {
      const trimmed = String(k || '').trim();
      if (trimmed && !keysToTry.includes(trimmed)) {
        keysToTry.push(trimmed);
      }
    });

    if (process.env.GEMINI_API_KEY) {
      const envKey = process.env.GEMINI_API_KEY.trim();
      if (envKey && !keysToTry.includes(envKey)) {
        keysToTry.push(envKey);
      }
    }

    if (keysToTry.length === 0) {
      sendEvent('error', { error: 'کلید API جمینای تنظیم نشده است. لطفاً کلید API خود را وارد کنید.' });
      return res.end();
    }

    const toneDescription = TONE_PROMPTS[tone] || TONE_PROMPTS.cinematic;
    const userCustomPrompt = customPrompt?.trim() || '';

    const systemInstruction = `SYSTEM INSTRUCTION FOR REAL-TIME STREAMING LOCALIZATION ENGINE:
You are an expert real-time translator for movies, TV subtitles, and video games.
Translate each provided line into ${targetLanguage} with extreme fidelity and natural fluency.

[TONE & INSTRUCTIONS]
Tone: ${toneDescription}
Custom Instruction: "${userCustomPrompt || 'None'}"
${mode === 'game' ? 'Operational Mode: Video Game Localization Engine' : 'Operational Mode: Movie & TV Subtitles (Cinema Engine)'}

[STREAMING OUTPUT PROTOCOL - STRICT FORMAT]
For each item in the input list, output in strict sequential order:
ID: <number>
TEXT: <translated string>
---

Example Output for 2 items:
ID: 1
TEXT: سلام، به بازی ما خوش آمدید!
---
ID: 2
TEXT: لطفاً مأموریت جدید را آغاز کنید.
---

[CRITICAL CONSTRAINTS]
1. PRESERVE VARIABLES & TAGS EXACTLY:
   Retain placeholders ({player_name}, {0}, %s, %d, $amount, {ITEM_ID}), line breaks (\\n, \\r, \\t), HTML tags (<i>, <b>, <color=...>), and ASS codes (\\pos, \\c&H) untouched without corruption.
2. TRANSLATE EVERY ITEM:
   Output an "ID: <id>" block for every single input item without skipping, omitting, or merging.
3. NO CONVERSATIONAL FILLER:
   Do NOT output markdown intro text, greetings, code block fences, or explanations. Start immediately with the first ID line.`;

    const promptText = `Translate the following ${items.length} ${mode === 'game' ? 'game strings' : 'subtitle lines'} into ${targetLanguage} (Source language: ${sourceLanguage || 'Auto-detect'}):\n` +
      JSON.stringify(items.map((i: any) => ({ id: i.id, text: i.text, key: i.key, context: i.context })), null, 2);

    const resolvedStreamModel = model && model !== 'gemini-live-stream'
      ? resolveModelId(model)
      : DEFAULT_TRANSLATION_MODEL_ID;
    const models = getTranslationFallbackChain(resolvedStreamModel);

    let streamSuccess = false;
    let lastError: any = null;

    for (let kIdx = 0; kIdx < keysToTry.length; kIdx++) {
      if (streamSuccess) break;
      const currentKey = keysToTry[kIdx];
      let ai: GoogleGenAI;
      try {
        ai = getGenAIClient(currentKey);
      } catch (e) {
        lastError = e;
        continue;
      }

      for (let mIdx = 0; mIdx < models.length; mIdx++) {
        if (streamSuccess) break;
        const modelName = models[mIdx];

        try {
          sendEvent('status', { status: 'streaming_started', model: modelName, keyIndex: kIdx + 1 });

          const responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents: promptText,
            config: {
              systemInstruction,
              safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
              ],
            },
          });

          let accumulatedBuffer = '';

          for await (const chunk of responseStream) {
            const chunkText = chunk.text || '';
            if (!chunkText) continue;

            accumulatedBuffer += chunkText;
            sendEvent('chunk', { rawChunk: chunkText });

            // Progressive parsing of completed "ID: ... TEXT: ... ---" blocks
            const blockSeparatorRegex = /---\s*/g;
            let match;
            let lastIndex = 0;

            while ((match = blockSeparatorRegex.exec(accumulatedBuffer)) !== null) {
              const blockStr = accumulatedBuffer.substring(lastIndex, match.index).trim();
              lastIndex = blockSeparatorRegex.lastIndex;

              if (blockStr) {
                const idMatch = blockStr.match(/ID:\s*(\d+)/i);
                const textMatch = blockStr.match(/TEXT:\s*([\s\S]*)/i);

                if (idMatch && textMatch) {
                  const parsedId = parseInt(idMatch[1], 10);
                  const parsedText = textMatch[1].trim();
                  sendEvent('line_translated', {
                    id: parsedId,
                    text: parsedText,
                    isComplete: true,
                  });
                }
              }
            }

            if (lastIndex > 0) {
              accumulatedBuffer = accumulatedBuffer.substring(lastIndex);
            }
          }

          // Process any trailing block in buffer after stream ends
          if (accumulatedBuffer.trim()) {
            const idMatch = accumulatedBuffer.match(/ID:\s*(\d+)/i);
            const textMatch = accumulatedBuffer.match(/TEXT:\s*([\s\S]*)/i);
            if (idMatch && textMatch) {
              const parsedId = parseInt(idMatch[1], 10);
              const parsedText = textMatch[1].replace(/---.*$/, '').trim();
              sendEvent('line_translated', {
                id: parsedId,
                text: parsedText,
                isComplete: true,
              });
            }
          }

          sendEvent('done', { success: true });
          streamSuccess = true;
          return res.end();
        } catch (streamErr: any) {
          const msg = streamErr?.message || String(streamErr);
          lastError = streamErr;
          console.warn(`[Gemini Stream Error] Key #${kIdx + 1}, Model ${modelName}:`, msg);

          const isRateLimit = msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource_exhausted');
          if (isRateLimit && kIdx < keysToTry.length - 1) {
            sendEvent('status', { status: 'key_failover', nextKeyIndex: kIdx + 2 });
            break; // Try next key
          }
        }
      }
    }

    if (!streamSuccess) {
      const errMsg = lastError?.message || 'خطا در برقراری اتصال زنده با جمینای';
      sendEvent('error', { error: errMsg });
      return res.end();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Streaming endpoint failure';
    console.error('Streaming translation error:', err);
    sendEvent('error', { error: message });
    return res.end();
  }
});

// API Endpoint: Post-translation quality audit & verification pass (REQ_1)
app.post('/api/verify-translation', async (req, res) => {
  try {
    const { items, targetLanguage, tone, customPrompt, mode, provider, customProvider, model } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'آیتمی برای ارزیابی کیفیت ارسال نشده است.' });
    }

    const toneDescription = (tone && (TONE_PROMPTS as any)[tone]) || TONE_PROMPTS.cinematic;
    const userCustomPrompt = customPrompt?.trim() || '';

    const systemInstruction = `SYSTEM INSTRUCTION FOR LOCALIZATION ENGINE - QUALITY AUDITOR:
You are a chief localization editor and QA auditor for movies and video games.
Your job is to perform a post-translation verification pass on translated lines into ${targetLanguage}.

[TONE & INSTRUCTIONS]
Tone: ${toneDescription}
Custom Instruction: "${userCustomPrompt || 'None'}"
${mode === 'game' ? 'Operational Mode: Video Game Localization Engine' : 'Operational Mode: Movie & TV Subtitles Engine'}

AUDIT RULES:
1. LINE COUNT EQUALITY: You MUST return a translation object for EVERY input item ID provided. The output length MUST equal the input length.
2. FIX UNTRANSLATED/MISSING LINES: If any line has empty translated text or remains untranslated in foreign words when it should be in ${targetLanguage}, translate it accurately.
3. REFINE NATURAL PHRASING: Polish literal or unnatural sentences into smooth, native phrasing matching the tone and custom instructions.
4. STRICT VARIABLE & TAG PRESERVATION: Ensure all code variables ({player_name}, {0}, %s, %d, $amount), tags (<b>, <i>, <color>), and line breaks (\\n) are strictly preserved and not corrupted or translated.
5. JSON OUTPUT: Return a JSON object containing "reviewedItems": array of objects { "id": number, "translatedText": string }.`;

    // Process in bounded chunks of 40 items (Finding 34B)
    const VERIFY_CHUNK_SIZE = 40;
    const allReviewedItems: Array<{ id: number; translatedText: string }> = [];
    let modelUsedResult = model || 'gemini';

    if (provider === 'custom') {
      if (!customProvider) {
        return res.status(400).json({ error: 'Custom Provider configuration is missing.' });
      }
      const validation = validateCustomProviderConfig(customProvider);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error || 'Invalid Custom Provider config.' });
      }
      const targetUrl = buildChatCompletionsUrl(customProvider.baseUrl);

      for (let i = 0; i < items.length; i += VERIFY_CHUNK_SIZE) {
        const chunk = items.slice(i, i + VERIFY_CHUNK_SIZE);
        const promptText = `Audit, verify and refine these ${chunk.length} translated lines into ${targetLanguage}:\n` +
          JSON.stringify(chunk.map((it: any) => ({ id: it.id, originalText: it.originalText, translatedText: it.translatedText })), null, 2);

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 45000);
        try {
          const resp = await fetch(targetUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${customProvider.apiKey.trim()}`,
            },
            body: JSON.stringify({
              model: customProvider.model.trim(),
              messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: promptText }
              ],
              temperature: 0.2,
            }),
            signal: controller.signal,
            redirect: 'error',
          });
          clearTimeout(timer);

          if (!resp.ok) {
            const errJson = await resp.json().catch(() => null);
            throw new Error(errJson?.error?.message || `HTTP ${resp.status}`);
          }
          const respJson = await resp.json();
          const parsed = extractJsonFromText(respJson?.choices?.[0]?.message?.content || '');
          const chunkReviewed = parsed?.reviewedItems || [];
          chunk.forEach((orig: any) => {
            const found = chunkReviewed.find((r: any) => r.id === orig.id);
            allReviewedItems.push({
              id: orig.id,
              translatedText: found && typeof found.translatedText === 'string' ? found.translatedText : orig.translatedText,
            });
          });
        } catch (cErr) {
          clearTimeout(timer);
          throw cErr;
        }
      }
      modelUsedResult = customProvider.model.trim();
    } else {
      // Gemini Provider
      const apiKeys = getClientKeysFromHeader(req);

      for (let i = 0; i < items.length; i += VERIFY_CHUNK_SIZE) {
        const chunk = items.slice(i, i + VERIFY_CHUNK_SIZE);
        const promptText = `Audit, verify and refine these ${chunk.length} translated lines into ${targetLanguage}:\n` +
          JSON.stringify(
            chunk.map((it: any) => ({
              id: it.id,
              originalText: it.originalText,
              translatedText: it.translatedText,
            })),
            null,
            2
          );

        const { response, modelUsed } = await callGeminiWithRetryAndFallback(apiKeys, {
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reviewedItems: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.INTEGER },
                      translatedText: { type: Type.STRING },
                    },
                    required: ['id', 'translatedText'],
                  },
                },
              },
              required: ['reviewedItems'],
            },
          },
        }, model);

        modelUsedResult = modelUsed;
        const parsedData = JSON.parse(response.text || '{}');
        const chunkReviewed = parsedData.reviewedItems || [];
        chunk.forEach((orig: any) => {
          const found = chunkReviewed.find((r: any) => r.id === orig.id);
          allReviewedItems.push({
            id: orig.id,
            translatedText: found && typeof found.translatedText === 'string' ? found.translatedText : orig.translatedText,
          });
        });
      }
    }

    let refinedCount = 0;
    let untranslatedFixedCount = 0;

    allReviewedItems.forEach((rev: any) => {
      const orig = items.find((i: any) => i.id === rev.id);
      if (orig) {
        if (!orig.translatedText.trim() && rev.translatedText.trim()) {
          untranslatedFixedCount++;
        } else if (orig.translatedText.trim() !== rev.translatedText.trim()) {
          refinedCount++;
        }
      }
    });

    return res.json({
      reviewedItems: allReviewedItems,
      lineCountMatch: allReviewedItems.length === items.length,
      refinedCount,
      untranslatedFixedCount,
      modelUsed: modelUsedResult,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error during translation quality audit.';
    console.error('Verify translation error:', err);
    return res.status(500).json({ error: message });
  }
});

// API Endpoint: Detect source language of text sample
app.post('/api/detect-language', async (req, res) => {
  try {
    const rawText = req.body.sampleText || req.body.text;
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return res.status(400).json({ error: 'متن نمونه ارسال نشده است.' });
    }
    const sampleText = rawText.trim();

    const apiKeys = getClientKeysFromHeader(req);
    const { response } = await callGeminiWithRetryAndFallback(apiKeys, {
      contents: `Identify the primary language of this subtitle snippet. Return a JSON object with keys "language" (English name e.g. "English", "French", "Japanese") and "languageFa" (Persian name e.g. "انگلیسی", "فرانسوی", "ژاپنی").\n\nSnippet:\n${sampleText.slice(0, 1000)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            language: { type: Type.STRING },
            languageFa: { type: Type.STRING }
          },
          required: ['language', 'languageFa']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    parsed.detectedLanguage = parsed.languageFa || parsed.language;
    return res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطا در تشخیص زبان';
    return res.status(500).json({ error: message });
  }
});

// API Endpoint: Transcribe audio to SRT subtitles
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType, targetLanguage, highAccuracyMode } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'داده صوتی ارسال نشده است.' });
    }

    const apiKeys = getClientKeysFromHeader(req);

    const highAccuracyInstruction = highAccuracyMode
      ? `\nHIGH ACCURACY MULTI-PASS RE-EVALUATION MODE:
- Perform deep phonetic analysis on low-volume, fast-paced, background-noisy, or heavily accented dialogue.
- Cross-verify homophones, slang, technical jargon, and ambiguous vocal pronunciations against semantic context.
- Ensure strict accuracy for subtle speech pauses and spoken phrasing.`
      : '';

    const systemInstruction = `You are a world-class speech-to-text subtitle transcription AI.
Your task is to transcribe speech from the provided audio file into a clean, precise, professional SRT subtitle format.${highAccuracyInstruction}

CRITICAL INSTRUCTIONS:
1. TIMESTAMPS: Every block MUST have valid SRT timestamps formatted as "HH:MM:SS,mmm --> HH:MM:SS,mmm" (e.g., "00:00:01,250 --> 00:00:04,100").
2. ACCURACY & NATURAL BREAKS: Break subtitle lines naturally at natural speech pauses, clauses, or sentences. Avoid overly long subtitle blocks.
3. OUTPUT FORMAT: Return a JSON object with keys "srtText" (string containing full, valid SRT content) and "detectedLanguage" (string describing spoken language).`;

    const promptText = highAccuracyMode
      ? `[HIGH ACCURACY PHONETIC RE-EVALUATION] Transcribe the speech with meticulous attention to phonetic detail, accents, and context into SRT format. ${targetLanguage ? `Translate or write transcript in ${targetLanguage}.` : 'Keep transcript in original spoken language.'}`
      : `Transcribe the audio speech into precise SRT subtitle format. ${targetLanguage ? `Translate or write transcript in ${targetLanguage}.` : 'Keep transcript in original spoken language.'}`;

    const { response } = await callGeminiWithRetryAndFallback(apiKeys, {
      contents: [
        {
          inlineData: {
            data: audioBase64,
            mimeType: mimeType || 'audio/wav',
          },
        },
        promptText,
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: { type: Type.STRING },
            srtText: { type: Type.STRING },
          },
          required: ['srtText'],
        },
      },
    }, DEFAULT_TRANSCRIPTION_MODEL_ID);

    const parsedData = JSON.parse(response.text || '{}');
    return res.json(parsedData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error transcribing audio';
    console.error('Audio transcription error:', err);
    return res.status(500).json({ error: message });
  }
});

// Helper to parse and categorize Gemini API errors into user-friendly diagnostic messages
function parseGeminiDiagnosticError(err: any): string {
  if (!err) return 'ارتباط برقرار نشد: خطای نامشخص در سرویس هوش مصنوعی.';
  const msg = typeof err === 'string' ? err : err.message || String(err);
  const lowerMsg = msg.toLowerCase();

  if (
    lowerMsg.includes('429') ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('resource_exhausted') ||
    lowerMsg.includes('limit')
  ) {
    return 'محدودیت تعداد درخواست (Quota/Rate Limit): سهمیه مجاز این کلید به پایان رسیده است یا باید چند لحظه صبر کنید.';
  }

  if (
    lowerMsg.includes('401') ||
    lowerMsg.includes('403') ||
    lowerMsg.includes('api_key') ||
    lowerMsg.includes('unauthorized') ||
    lowerMsg.includes('invalid') ||
    lowerMsg.includes('permission_denied')
  ) {
    return 'کلید API خرابه یا نامعتبر است: کلید وارد شده اشتباه است، یا دسترسی آن از سوی گوگل مسدود گردیده.';
  }

  if (
    lowerMsg.includes('econnrefused') ||
    lowerMsg.includes('enotfound') ||
    lowerMsg.includes('fetch failed') ||
    lowerMsg.includes('network') ||
    lowerMsg.includes('timeout')
  ) {
    return 'ارتباط برقرار نشد: خطای شبکه یا عدم دسترسی به سرورهای گوگل.';
  }

  return `ارتباط برقرار نشد: ${msg}`;
}

// Helper to perform a fast, direct test on a single Gemini API key without retry delays
async function testSingleGeminiKey(keyStr: string): Promise<{ success: boolean; error?: string }> {
  const cleanKey = String(keyStr || '').trim();
  if (!cleanKey) {
    return { success: false, error: 'کلید API خالی است.' };
  }

  let ai: GoogleGenAI;
  try {
    ai = getGenAIClient(cleanKey);
  } catch (err: any) {
    return { success: false, error: parseGeminiDiagnosticError(err) };
  }

  const modelsToTest = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];
  let lastErr: any = null;

  for (const modelName of modelsToTest) {
    try {
      await ai.models.generateContent({
        model: modelName,
        contents: 'Respond with OK',
      });
      return { success: true };
    } catch (err: any) {
      lastErr = err;
      const msg = err?.message || String(err);
      const is404 = msg.includes('404') || msg.toLowerCase().includes('not found');
      if (is404) continue; // Try fallback model if 404
      break; // For rate limit, auth errors, etc., stop immediately for diagnostic speed
    }
  }

  return { success: false, error: parseGeminiDiagnosticError(lastErr) };
}

// API Endpoint: Test single or batch Gemini API key validity
app.post('/api/test-key', async (req, res) => {
  try {
    const { apiKey, apiKeys } = req.body || {};

    if (Array.isArray(apiKeys) && apiKeys.length > 0) {
      const results = await Promise.all(
        apiKeys.map(async (k: string) => {
          const resObj = await testSingleGeminiKey(k);
          return { key: k, success: resObj.success, error: resObj.error };
        })
      );
      return res.json({ success: true, results });
    }

    const customKey = String(apiKey || req.headers['x-gemini-api-key'] || '').trim();
    if (!customKey) {
      return res.status(400).json({ success: false, error: 'کلید API وارد نشده است.' });
    }

    const result = await testSingleGeminiKey(customKey);
    if (result.success) {
      return res.json({ success: true, message: 'ارتباط برقرار شد و کلید API معتبر است.' });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (err: unknown) {
    const errorMsg = parseGeminiDiagnosticError(err);
    console.error('API key test error:', err);
    return res.status(400).json({ success: false, error: errorMsg });
  }
});

// API Endpoint: Test Custom Provider (BYOK) Connection
app.post('/api/custom-provider/test', async (req, res) => {
  try {
    const { baseUrl, apiKey, model } = req.body || {};
    const result = await testCustomProviderConnection({ baseUrl, apiKey, model });
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (err: any) {
    const safeError = sanitizeErrorMessage(err?.message || 'Server error during connection test.');
    return res.status(500).json({
      success: false,
      errorType: 'provider_error',
      error: safeError,
    });
  }
});


// Health check route
app.get('/api/health', (req, res) => {
  const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  res.json({
    status: 'ok',
    hasServerKey,
    time: new Date().toISOString()
  });
});

// Helper to reliably locate the dist directory with index.html
function locateDistDirectory(): string {
  const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const candidates = [
    currentDir, // If server.cjs is in dist/, currentDir already contains index.html
    path.join(process.cwd(), 'dist'),
    path.join(currentDir, 'dist'),
    path.join(currentDir, '..', 'dist'),
    process.cwd(),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate;
    }
  }

  return path.join(process.cwd(), 'dist');
}

// Setup Vite development server or serve static assets in production
async function startServer() {
  const isCjsBundle = typeof __filename !== 'undefined' && typeof __filename === 'string' && __filename.endsWith('.cjs');
  const isProduction = process.env.NODE_ENV === 'production' || isCjsBundle;

  if (!isProduction) {
    console.log('[Server] Starting in DEVELOPMENT mode with Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = locateDistDirectory();
    console.log(`[Server] Starting in PRODUCTION mode. Serving assets from: ${distDir}`);
    app.use(express.static(distDir));

    // SPA fallback: Return index.html for non-API routes
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }

      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(500).send(`Application build files (index.html) not found in: ${distDir}. Please ensure "npm run build" has finished.`);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on http://0.0.0.0:${PORT} (PID: ${process.pid})`);
  });
}

startServer();
