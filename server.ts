import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

// Safe _dirname resolution compatible with both ESM and compiled CommonJS (dist/server.cjs)
const _dirname = typeof __dirname !== 'undefined'
  ? __dirname
  : (import.meta && import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd());

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

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

// Helper function to execute Gemini requests with multi-key rotation, model fallback, and rate-limit backoff
async function callGeminiWithRetryAndFallback(
  apiKeys: string[],
  generateParams: {
    contents: any;
    config?: any;
  },
  preferredModel?: string
) {
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

  // Base fallback models list
  const defaultModels = ['gemini-3.6-flash', 'gemini-3.1-pro', 'gemini-2.5-pro', 'gemini-2.5-flash'];
  const models: string[] = [];

  if (preferredModel && preferredModel !== 'gemini-live-stream') {
    models.push(preferredModel);
  }
  defaultModels.forEach((m) => {
    if (!models.includes(m)) {
      models.push(m);
    }
  });

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
          return response;
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

          if (isRateLimit) {
            // 1. If we have more API keys, failover to the next key immediately
            if (kIdx < keysToTry.length - 1) {
              console.warn(`[Gemini Rate Limit] Key #${kIdx + 1} exhausted quota. Switching to Key #${kIdx + 2}...`);
              break; // exit model loop to try next key in outer loop
            }

            // 2. If we have more models to try, failover to the next model immediately
            if (mIdx < models.length - 1 && attempts >= 1) {
              console.warn(`[Gemini Rate Limit] Model ${modelName} rate limited. Falling back to ${models[mIdx + 1]}...`);
              break; // exit attempts loop to try next model in inner loop
            }

            // 3. Otherwise wait for requested retry duration or exponential backoff
            let delayMs = 5000;
            const match = msg.match(/retry in ([0-9.]+)s/i);
            if (match && match[1]) {
              const parsedSec = parseFloat(match[1]);
              if (!isNaN(parsedSec) && parsedSec > 0) {
                delayMs = Math.min(Math.ceil(parsedSec * 1000) + 1000, 65000);
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

// API Endpoint: Translate batch of subtitle or game localization items
app.post('/api/translate', async (req, res) => {
  try {
    const { items, sourceLanguage, targetLanguage, tone, customPrompt, mode, model } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'آیتمی برای ترجمه ارسال نشده است.' });
    }

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

    const response = await callGeminiWithRetryAndFallback(apiKeys, {
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
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      return res.status(500).json({ error: 'خطا در قالب‌بندی پاسخ هوش مصنوعی.' });
    }

    return res.json(parsedData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error during translation';
    console.error('Translation error:', err);

    const isRateLimit = message.includes('429') || message.toLowerCase().includes('quota') || message.toLowerCase().includes('resource_exhausted');
    const isAuthError = message.includes('401') || message.includes('403') || message.toLowerCase().includes('api_key') || message.toLowerCase().includes('unauthorized');

    if (isRateLimit) {
      return res.status(429).json({ error: 'Rate limit / Quota exceeded. Retrying automatically...', details: message });
    }
    if (isAuthError) {
      return res.status(401).json({ error: 'Invalid or unauthorized Gemini API key. Please check your BYOK configuration.', details: message });
    }

    return res.status(500).json({ error: message });
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

    const streamFallbackModels = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-3.1-pro', 'gemini-2.5-pro'];
    const models: string[] = [];
    if (model && model !== 'gemini-live-stream') {
      models.push(model);
    }
    streamFallbackModels.forEach((m) => {
      if (!models.includes(m)) {
        models.push(m);
      }
    });

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
    const { items, targetLanguage, tone, customPrompt, mode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'آیتمی برای ارزیابی کیفیت ارسال نشده است.' });
    }

    const apiKeys = getClientKeysFromHeader(req);
    const toneDescription = TONE_PROMPTS[tone] || TONE_PROMPTS.cinematic;
    const userCustomPrompt = customPrompt?.trim() || '';

    const systemInstruction = `SYSTEM INSTRUCTION FOR LOCALIZATION ENGINE - QUALITY AUDITOR:
You are a chief localization editor and QA auditor for movies and video games.
Your job is to perform a post-translation verification pass on translated lines into ${targetLanguage}.

[TONE & INSTRUCTIONS]
Tone: ${toneDescription}
Custom Instruction: "${userCustomPrompt || 'None'}"
${mode === 'game' ? 'Operational Mode: Video Game Localization Engine' : 'Operational Mode: Movie & TV Subtitles Engine'}

AUDIT RULES:
1. LINE COUNT EQUALITY: You MUST return a translation object for EVERY input item ID provided. The output length MUST equal ${items.length}.
2. FIX UNTRANSLATED/MISSING LINES: If any line has empty translated text or remains untranslated in foreign words when it should be in ${targetLanguage}, translate it accurately.
3. REFINE NATURAL PHRASING: Polish literal or unnatural sentences into smooth, native phrasing matching the tone and custom instructions.
4. STRICT VARIABLE & TAG PRESERVATION: Ensure all code variables ({player_name}, {0}, %s, %d, $amount), tags (<b>, <i>, <color>), and line breaks (\\n) are strictly preserved and not corrupted or translated.
5. JSON OUTPUT: Return a JSON object containing "reviewedItems": array of objects { "id": number, "translatedText": string }.`;

    const promptText = `Audit, verify and refine these ${items.length} translated lines into ${targetLanguage}:\n` +
      JSON.stringify(
        items.map((i: any) => ({
          id: i.id,
          originalText: i.originalText,
          translatedText: i.translatedText,
        })),
        null,
        2
      );

    const response = await callGeminiWithRetryAndFallback(apiKeys, {
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
    });

    const parsedData = JSON.parse(response.text || '{}');
    const reviewedItems = parsedData.reviewedItems || [];

    let refinedCount = 0;
    let untranslatedFixedCount = 0;

    reviewedItems.forEach((rev: any) => {
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
      reviewedItems,
      lineCountMatch: reviewedItems.length === items.length,
      refinedCount,
      untranslatedFixedCount,
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
    const { sampleText } = req.body;
    if (!sampleText || typeof sampleText !== 'string') {
      return res.status(400).json({ error: 'متن نمونه ارسال نشده است.' });
    }

    const apiKeys = getClientKeysFromHeader(req);
    const response = await callGeminiWithRetryAndFallback(apiKeys, {
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

    const response = await callGeminiWithRetryAndFallback(apiKeys, {
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
    });

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

  const modelsToTest = ['gemini-3.6-flash', 'gemini-2.5-flash'];
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


// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Setup Vite development server or serve static assets in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    let distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      distPath = path.join(_dirname, 'dist');
    }
    if (!fs.existsSync(distPath)) {
      distPath = path.join(_dirname, '../dist');
    }
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
