import { CustomProviderConfig, CustomProviderErrorType } from '../types';

/**
 * Normalizes a base API URL by trimming whitespace and removing trailing slashes.
 */
export function normalizeBaseUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  trimmed = trimmed.replace(/\/+$/, '');
  return trimmed;
}

/**
 * Validates if an IP address or hostname belongs to private, loopback, link-local,
 * or cloud metadata ranges (SSRF Protection - Finding 31B).
 */
export function isPrivateOrBlockedHost(hostname: string): boolean {
  if (!hostname) return true;
  const host = hostname.trim().toLowerCase().replace(/^\[|\]$/g, '');

  // 1. Literal hostnames
  const blockedHosts = [
    'localhost',
    'metadata.google.internal',
    'metadata',
    'instance-data',
    '169.254.169.254',
    '0.0.0.0',
    '::',
    '::1',
  ];
  if (blockedHosts.includes(host) || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true;
  }

  // 2. Check for numeric integer representation (e.g. 2130706433 or 0x7f000001)
  if (/^\d+$/.test(host)) {
    const num = parseInt(host, 10);
    // 127.0.0.1 is 2130706433
    if (num >= 2130706432 && num <= 2147483647) return true; // 127.0.0.0/8
    if (num >= 167772160 && num <= 184549375) return true;   // 10.0.0.0/8
    if (num >= 2886729728 && num <= 2887778303) return true; // 172.16.0.0/12
    if (num >= 3232235520 && num <= 3232301055) return true; // 192.168.0.0/16
    if (num >= 2851995648 && num <= 2852061183) return true; // 169.254.0.0/16
    return true; // Disallow arbitrary numeric IP formats
  }

  // 3. IPv4 pattern check
  const ipv4Parts = host.split('.');
  if (ipv4Parts.length === 4 && ipv4Parts.every((p) => /^\d+$/.test(p))) {
    const [b0, b1, b2, b3] = ipv4Parts.map((p) => parseInt(p, 10));
    if ([b0, b1, b2, b3].some((b) => b < 0 || b > 255)) return true;

    // Loopback: 127.0.0.0/8
    if (b0 === 127) return true;

    // Zero / Current network: 0.0.0.0/8
    if (b0 === 0) return true;

    // Private network: 10.0.0.0/8
    if (b0 === 10) return true;

    // Private network: 172.16.0.0/12
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;

    // Private network: 192.168.0.0/16
    if (b0 === 192 && b1 === 168) return true;

    // Link-local / Cloud metadata: 169.254.0.0/16
    if (b0 === 169 && b1 === 254) return true;

    // Carrier Grade NAT: 100.64.0.0/10
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;

    // Documentation / Test nets: 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24
    if (b0 === 192 && b1 === 0 && b2 === 2) return true;
    if (b0 === 198 && b1 === 51 && b2 === 100) return true;
    if (b0 === 203 && b1 === 0 && b2 === 113) return true;

    // Broadcast / Multicast / Reserved: 224.0.0.0/4, 240.0.0.0/4
    if (b0 >= 224) return true;
  }

  // 4. IPv6 check
  if (host.includes(':')) {
    // Loopback ::1 or unspecified ::
    if (host === '::1' || host === '::') return true;
    // IPv4-mapped IPv6 ::ffff:127.0.0.1
    if (host.startsWith('::ffff:')) {
      const mappedIpv4 = host.substring(7);
      return isPrivateOrBlockedHost(mappedIpv4);
    }
    // Unique local address fc00::/7 (fc00:: to fdff::)
    if (host.startsWith('fc') || host.startsWith('fd')) return true;
    // Link-local unicast fe80::/10 (fe80:: to febf::)
    if (host.startsWith('fe8') || host.startsWith('fe9') || host.startsWith('fea') || host.startsWith('feb')) return true;
  }

  return false;
}

/**
 * Deterministically constructs the OpenAI-compatible /chat/completions endpoint.
 * Validates protocol (http: or https:) and protects against SSRF.
 */
export function buildChatCompletionsUrl(baseUrl: string): string {
  const normalized = normalizeBaseUrl(baseUrl);
  if (!normalized) {
    throw new Error('Base API URL is required');
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch (err: any) {
    throw new Error(`Invalid URL format: ${err?.message || 'Malformed URL'}`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Base API URL must start with http:// or https://');
  }

  // SSRF Protection Check
  if (isPrivateOrBlockedHost(parsed.hostname)) {
    throw new Error('Access to local, private, or metadata network addresses is strictly forbidden.');
  }

  if (normalized.endsWith('/chat/completions')) {
    return normalized;
  }

  return `${normalized}/chat/completions`;
}

/**
 * Validates a Custom Provider configuration before sending.
 */
export function validateCustomProviderConfig(config: Partial<CustomProviderConfig>): { valid: boolean; error?: string } {
  if (!config) {
    return { valid: false, error: 'Configuration is missing.' };
  }

  const baseUrl = normalizeBaseUrl(config.baseUrl || '');
  if (!baseUrl) {
    return { valid: false, error: 'Base API URL is required.' };
  }

  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Base API URL must start with http:// or https://' };
    }
    if (isPrivateOrBlockedHost(parsed.hostname)) {
      return { valid: false, error: 'Access to local, private, or cloud metadata network addresses is prohibited for security.' };
    }
  } catch {
    return { valid: false, error: 'Base API URL has an invalid format.' };
  }

  if (!config.apiKey || !config.apiKey.trim()) {
    return { valid: false, error: 'API Key is required.' };
  }

  if (!config.model || !config.model.trim()) {
    return { valid: false, error: 'Model ID is required.' };
  }

  return { valid: true };
}

/**
 * Cleans any sensitive API keys or auth tokens from error messages so they are never leaked.
 */
export function sanitizeErrorMessage(msg: string, secretKey?: string): string {
  let clean = String(msg || '');
  if (secretKey && secretKey.trim().length > 3) {
    const key = secretKey.trim();
    clean = clean.split(key).join('[REDACTED_API_KEY]');
  }
  clean = clean.replace(/Bearer\s+[A-Za-z0-9_\-\.]{6,}/gi, 'Bearer [REDACTED_AUTH_TOKEN]');
  clean = clean.replace(/AIzaSy[A-Za-z0-9_\-]{33}/g, '[REDACTED_GEMINI_KEY]');
  clean = clean.replace(/sk-[A-Za-z0-9_\-]{15,}/g, '[REDACTED_API_KEY]');
  return clean;
}

/**
 * Extracts and parses JSON from raw LLM output, handling markdown blocks and raw strings.
 */
export function extractJsonFromText(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') return null;
  const trimmed = rawText.trim();

  // 1. Direct JSON parse
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Markdown block ```json ... ``` or ``` ... ```
  const jsonBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    try {
      return JSON.parse(jsonBlockMatch[1].trim());
    } catch {}
  }

  // 3. Find outermost { ... }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
    } catch {}
  }

  return null;
}

/**
 * Classifies an error into structured error type, user-facing message, and retryable flag.
 */
export function classifyCustomProviderError(
  err: any,
  status?: number
): {
  errorType: CustomProviderErrorType;
  message: string;
  retryable: boolean;
  status: number;
} {
  const httpStatus = status || err?.status || 500;
  const rawMsg = err?.message || String(err || '');

  // 1. Cancellation / Abort
  if (err?.name === 'AbortError' || rawMsg.includes('aborted') || rawMsg.includes('cancelled')) {
    if (rawMsg.includes('timed out') || rawMsg.includes('deadline')) {
      return {
        errorType: 'timeout',
        message: 'مهلت پاسخگویی سرویس‌دهنده سفارشی به پایان رسید (CUSTOM_PROVIDER_TIMEOUT).',
        retryable: true,
        status: 408,
      };
    }
    return {
      errorType: 'cancelled',
      message: 'عملیات توسط کاربر یا سیستم لغو شد.',
      retryable: false,
      status: 499,
    };
  }

  // 2. HTTP Status Code Checks
  if (httpStatus === 401 || httpStatus === 403) {
    return {
      errorType: 'auth_failure',
      message: 'کلید API سرویس‌دهنده سفارشی نامعتبر یا فاقد دسترسی است (401/403).',
      retryable: false,
      status: httpStatus,
    };
  }

  if (httpStatus === 404) {
    return {
      errorType: 'model_not_found',
      message: 'مدل انتخابی یا آدرس اندپوینت در سرویس‌دهنده سفارشی یافت نشد (404).',
      retryable: false,
      status: 404,
    };
  }

  if (httpStatus === 429) {
    return {
      errorType: 'rate_limit',
      message: 'محدودیت نرخ درخواست سرویس‌دهنده سفارشی (HTTP 429 Rate Limit).',
      retryable: true,
      status: 429,
    };
  }

  if (httpStatus === 413 || err?.errorType === 'request_too_large') {
    return {
      errorType: 'request_too_large',
      message: 'حجم درخواست ارسالی بیش از حد مجاز است (413 Payload Too Large).',
      retryable: false,
      status: 413,
    };
  }

  if (err?.errorType === 'response_too_large') {
    return {
      errorType: 'response_too_large',
      message: 'حجم پاسخ دریافتی از سرویس‌دهنده از حد مجاز عبور کرد (CUSTOM_PROVIDER_RESPONSE_TOO_LARGE).',
      retryable: false,
      status: 502,
    };
  }

  if (err?.errorType === 'truncated_response' || rawMsg.includes('CUSTOM_PROVIDER_TRUNCATED_BODY') || rawMsg.includes('truncated')) {
    return {
      errorType: 'truncated_response',
      message: 'پاسخ دریافتی ناقص یا ارتباط در میانه انتقال قطع شد (CUSTOM_PROVIDER_TRUNCATED_BODY).',
      retryable: true,
      status: 502,
    };
  }

  if (err?.errorType === 'malformed_json') {
    return {
      errorType: 'malformed_json',
      message: 'قالب خروجی سرویس‌دهنده JSON معتبر نیست یا محتوا قطع شده است.',
      retryable: true,
      status: 502,
    };
  }

  if (err?.errorType === 'missing_translations') {
    return {
      errorType: 'missing_translations',
      message: err.message || 'بخشی از سطرهای درخواستی در پاسخ مدل حذف یا جا افتاده است.',
      retryable: true,
      status: 502,
    };
  }

  if (httpStatus === 400) {
    return {
      errorType: 'invalid_config',
      message: err?.message || 'پارامترهای درخواست ارسالی به سرویس‌دهنده نامعتبر است (400 Bad Request).',
      retryable: false,
      status: 400,
    };
  }

  if (httpStatus === 503) {
    return {
      errorType: 'service_unavailable',
      message: `سرویس‌دهنده موقتاً در دسترس نیست (503 Service Unavailable).`,
      retryable: true,
      status: 503,
    };
  }

  if (httpStatus === 504) {
    return {
      errorType: 'gateway_timeout',
      message: `مهلت زمان دروازه ارتباطی سرویس‌دهنده پایان یافت (504 Gateway Timeout).`,
      retryable: true,
      status: 504,
    };
  }

  if (httpStatus === 502) {
    return {
      errorType: 'provider_error',
      message: `پاسخ نامعتبر از سرور واسط سرویس‌دهنده (502 Bad Gateway).`,
      retryable: true,
      status: 502,
    };
  }

  // Network / Connection Failures
  if (
    rawMsg.includes('ECONNRESET') ||
    rawMsg.includes('ETIMEDOUT') ||
    rawMsg.includes('fetch failed') ||
    rawMsg.includes('ENOTFOUND')
  ) {
    return {
      errorType: 'network_error',
      message: 'خطای برقراری ارتباط با شبکه یا سرور سرویس‌دهنده سفارشی.',
      retryable: true,
      status: 503,
    };
  }

  return {
    errorType: 'provider_error',
    message: rawMsg || 'خطای ناشناخته در پردازش سرویس‌دهنده سفارشی.',
    retryable: true,
    status: httpStatus,
  };
}

/**
 * Normalizes OpenAI-compatible chat completion responses into the SubGame Lab internal format.
 * Validates complete structural and ID integrity (Requirement 24).
 */
export function normalizeOpenAiTranslationResponse(
  data: any,
  originalItems: Array<{ id: number; text: string }>,
  modelUsed: string = 'custom-model'
): {
  translations: Array<{ id: number; text: string }>;
  detectedSourceLanguage: string;
  modelUsed: string;
  isFallback: boolean;
} {
  let content = '';

  if (data?.choices && Array.isArray(data.choices) && data.choices.length > 0) {
    const choice = data.choices[0];
    if (choice.finish_reason === 'length') {
      const lenErr: any = new Error('Custom provider truncated output because max_tokens was reached.');
      lenErr.errorType = 'truncated_response';
      lenErr.retryable = true;
      lenErr.status = 502;
      throw lenErr;
    }
    if (choice.message?.content) {
      content = choice.message.content;
    } else if (typeof choice.text === 'string') {
      content = choice.text;
    }
  } else if (typeof data === 'string') {
    content = data;
  } else if (data?.translations && Array.isArray(data.translations)) {
    content = JSON.stringify(data);
  } else {
    const formatErr: any = new Error('Custom provider returned an empty or invalid choices array.');
    formatErr.errorType = 'malformed_json';
    formatErr.retryable = true;
    formatErr.status = 502;
    throw formatErr;
  }

  const parsed = extractJsonFromText(content);
  if (!parsed || !parsed.translations || !Array.isArray(parsed.translations)) {
    const jsonErr: any = new Error('Custom provider returned an unparseable translation format (JSON structure missing).');
    jsonErr.errorType = 'malformed_json';
    jsonErr.retryable = true;
    jsonErr.status = 502;
    throw jsonErr;
  }

  const rawTranslations = parsed.translations;
  const translationMap = new Map<number, string>();
  const duplicateIds = new Set<number>();

  rawTranslations.forEach((t: any) => {
    if (t && (typeof t.id === 'number' || typeof t.id === 'string')) {
      const numId = Number(t.id);
      if (!isNaN(numId)) {
        if (translationMap.has(numId)) {
          duplicateIds.add(numId);
        }
        translationMap.set(numId, String(t.text ?? ''));
      }
    }
  });

  // Strict Completeness Audit (Rule 24):
  // Check if any original items are missing from the provider response
  const missingItemIds: number[] = [];
  const emptyTranslatedItemIds: number[] = [];

  const verifiedTranslations = originalItems.map((item) => {
    if (!translationMap.has(item.id)) {
      missingItemIds.push(item.id);
      return { id: item.id, text: '' };
    }
    const translatedStr = translationMap.get(item.id)!;
    // Check if input was non-empty but translation returned blank
    if (item.text && item.text.trim().length > 0 && (!translatedStr || translatedStr.trim().length === 0)) {
      emptyTranslatedItemIds.push(item.id);
    }
    return {
      id: item.id,
      text: translatedStr,
    };
  });

  // If items are missing from the provider response, do NOT pretend it succeeded!
  if (missingItemIds.length > 0) {
    const missingErr: any = new Error(
      `Custom provider omitted ${missingItemIds.length} of ${originalItems.length} items (IDs: ${missingItemIds.slice(0, 5).join(', ')}${missingItemIds.length > 5 ? '...' : ''}).`
    );
    missingErr.errorType = 'missing_translations';
    missingErr.retryable = true;
    missingErr.status = 502;
    throw missingErr;
  }

  return {
    translations: verifiedTranslations,
    detectedSourceLanguage: parsed.detectedSourceLanguage || 'Auto-detect',
    modelUsed,
    isFallback: false,
  };
}
