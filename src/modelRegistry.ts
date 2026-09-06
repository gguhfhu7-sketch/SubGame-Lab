/**
 * Centralized Model Registry for Google Gemini Models
 * Single Source of Truth for Model IDs, Capabilities, Status, and Translation Suitability
 */

export type ModelStatus = 'stable' | 'preview' | 'deprecated';

export type ModelCapabilityType = 'translation' | 'transcription' | 'specialized';

export type TranslationSuitabilityTier = 
  | 'best_quality' 
  | 'high_quality' 
  | 'fast_volume' 
  | 'advanced_reasoning' 
  | 'realtime_stream';

export interface ModelDefinition {
  modelId: string;
  displayName: string;
  family: string;
  status: ModelStatus;
  capability: ModelCapabilityType;
  recommendedUseCase: string;
  translationSuitability: TranslationSuitabilityTier;
  speed: string;
  speedFa: string;
  speedEn: string;
  speedAr: string;
  quality: string;
  costTier: 'ultra_low' | 'standard' | 'paid_premium';
  badge: string;
  badgeColor: string;
  reasoningLevel: 'standard' | 'high' | 'ultra' | 'realtime';
  descriptionFa: string;
  descriptionEn: string;
  descriptionAr: string;
  isStreaming?: boolean;
  requiresPaidTier?: boolean;
  contextWindow?: string;
  maxOutputTokens?: number;
  structuredOutput: boolean;
  thinkingSupport: boolean;
}

export const ALL_MODELS: ModelDefinition[] = [
  // 1. Best Overall & Highest Quality Flash Translation
  {
    modelId: 'gemini-3.8-flash',
    displayName: 'Gemini 3.8 Flash',
    family: 'Gemini 3 Flash',
    status: 'stable',
    capability: 'translation',
    recommendedUseCase: 'بهترین کیفیت و دقت کلی / Best Overall Quality for Cinematic Subtitles & Game Dialogue',
    translationSuitability: 'best_quality',
    speed: '⚡ ۰.۶s',
    speedFa: '⚡ فوق‌سریع و هوشمندترین فلش (۰.۶ ثانیه)',
    speedEn: '⚡ Best Overall Flash (0.6s)',
    speedAr: '⚡ فائق السرعة والأعلى جودة (0.6 ثانية)',
    quality: '⭐⭐⭐⭐⭐ (عالی‌ترین کیفیت ترجمه)',
    costTier: 'standard',
    badge: 'پیشنهادی / Best Overall',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    reasoningLevel: 'high',
    descriptionFa: 'جدیدترین و باکیفیت‌ترین مدل سری Flash؛ حفظ فوق‌العاده لحن، اصطلاحات محاوره‌ای و ساختار فنی دیالوگ‌ها.',
    descriptionEn: 'Flagship Flash model with superior quality, tone retention, slang translation, and long context.',
    descriptionAr: 'النموذج الأفضل والأحدث لمطابقة السياق، حفظ النبرة، والمصطلحات الدقيقة بأقل زمن استجابة.',
    isStreaming: false,
    requiresPaidTier: false,
    contextWindow: '1M tokens',
    maxOutputTokens: 65536,
    structuredOutput: true,
    thinkingSupport: true,
  },

  // 2. High Quality Flash Translation
  {
    modelId: 'gemini-3.7-flash',
    displayName: 'Gemini 3.7 Flash',
    family: 'Gemini 3 Flash',
    status: 'stable',
    capability: 'translation',
    recommendedUseCase: 'ترجمه دقیق و روان فیلم و سریال / High-Quality General Translation',
    translationSuitability: 'high_quality',
    speed: '⚡ ۰.۷s',
    speedFa: '⚡ سریع و باکیفیت (۰.۷ ثانیه)',
    speedEn: '⚡ Fast & High-Quality (0.7s)',
    speedAr: '⚡ سرعة عالية وجودة متوازنة (0.7 ثانية)',
    quality: '⭐⭐⭐⭐ (کیفیت بالا و روان)',
    costTier: 'standard',
    badge: 'کیفیت بالا / High Quality',
    badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
    reasoningLevel: 'high',
    descriptionFa: 'کیفیت بالا و پیوسته در بازگردانی ساختارهای پیچیده جملات و اصطلاحات سینمایی.',
    descriptionEn: 'High-quality translation with rich vocabulary adaptation and natural dialog fluency.',
    descriptionAr: 'دقة لغوية عالية وترجمة سلسة لحوارات الأفلام والمسلسلات الطويلة.',
    isStreaming: false,
    requiresPaidTier: false,
    contextWindow: '1M tokens',
    maxOutputTokens: 65536,
    structuredOutput: true,
    thinkingSupport: true,
  },

  // 3. Fast & Highly Reliable Subtitles
  {
    modelId: 'gemini-3.6-flash',
    displayName: 'Gemini 3.6 Flash',
    family: 'Gemini 3 Flash',
    status: 'stable',
    capability: 'translation',
    recommendedUseCase: 'سرعت بالا و تعادل توکن / Fast & Token-Efficient Translation',
    translationSuitability: 'high_quality',
    speed: '⚡ ۰.۶s',
    speedFa: '⚡ بسیار سریع و پایدار (۰.۶ ثانیه)',
    speedEn: '⚡ Fast & Reliable (0.6s)',
    speedAr: '⚡ سريع ومستقر جداً (0.6 ثانية)',
    quality: '⭐⭐⭐⭐ (سریع و مطمئن)',
    costTier: 'standard',
    badge: 'سریع و پایدار / Fast',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    reasoningLevel: 'standard',
    descriptionFa: 'تعادل اثبات‌شده بین سرعت پاسخ‌دهی و وفاداری به متن مبدا برای زیرنویس‌های روزمره.',
    descriptionEn: 'Proven balance of speed, accuracy, and rate-limit resilience for bulk subtitle processing.',
    descriptionAr: 'توازن ممتاز بين السرعة والدقة واستهلاك الحصص مع معالجة حزم الترجمة الكبيرة.',
    isStreaming: false,
    requiresPaidTier: false,
    contextWindow: '1M tokens',
    maxOutputTokens: 65536,
    structuredOutput: true,
    thinkingSupport: true,
  },

  // 4. Fast & Low Cost for High Volume
  {
    modelId: 'gemini-3.1-flash-lite',
    displayName: 'Gemini 3.1 Flash Lite',
    family: 'Gemini 3 Flash Lite',
    status: 'stable',
    capability: 'translation',
    recommendedUseCase: 'فایل‌های حجیم و کم‌هزینه / High-Volume & Low-Cost Batch Subtitles',
    translationSuitability: 'fast_volume',
    speed: '🚀 ۰.۳s',
    speedFa: '🚀 فوق‌سریع و اقتصادی (۰.۳ ثانیه)',
    speedEn: '🚀 Ultra-Fast & Low Cost (0.3s)',
    speedAr: '🚀 فائق السرعة واقتصادي جداً (0.3 ثانية)',
    quality: '⭐⭐⭐ (بهینه برای حجم بالا)',
    costTier: 'ultra_low',
    badge: 'اقتصادی و حجیم / Low Cost',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    reasoningLevel: 'standard',
    descriptionFa: 'طراحی‌شده برای پروژه‌های با حجم سطر بسیار زیاد، تاخیر بسیار پایین و حداقل مصرف سهمیه API.',
    descriptionEn: 'Engineered for high-frequency bulk translation, massive subtitle batches, and minimal quota footprint.',
    descriptionAr: 'مصمم خصيصاً للملفات الضخمة وحزم الترجمة ذات التردد العالي باستهلاك رمزي للرصيد.',
    isStreaming: false,
    requiresPaidTier: false,
    contextWindow: '1M tokens',
    maxOutputTokens: 65536,
    structuredOutput: true,
    thinkingSupport: true,
  },

  // 5. Standard Flash
  {
    modelId: 'gemini-3.5-flash',
    displayName: 'Gemini 3.5 Flash',
    family: 'Gemini 3 Flash',
    status: 'stable',
    capability: 'translation',
    recommendedUseCase: 'ترجمه استاندارد با سهمیه بهینه / Standard Efficient Translation',
    translationSuitability: 'high_quality',
    speed: '⚡ ۰.۵s',
    speedFa: '⚡ سریع و سبک (۰.۵ ثانیه)',
    speedEn: '⚡ Fast & Lightweight (0.5s)',
    speedAr: '⚡ سريع وخفيف (0.5 ثانية)',
    quality: '⭐⭐⭐ (استاندارد)',
    costTier: 'standard',
    badge: 'سبک و استاندارد / Standard',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    reasoningLevel: 'standard',
    descriptionFa: 'پاسخ‌دهی سریع با الگوریتم‌های بهینه برای ترجمه‌های معمولی بدون پردازش‌های سنگین.',
    descriptionEn: 'Lightweight and dependable Flash model for standard subtitle translation workloads.',
    descriptionAr: 'نموذج خفيف وموثوق لترجمة النصوص العادية واستهلاك الموارد بأقل قدر.',
    isStreaming: false,
    requiresPaidTier: false,
    contextWindow: '1M tokens',
    maxOutputTokens: 65536,
    structuredOutput: true,
    thinkingSupport: true,
  },

  // 6. Deep Cinematic Reasoning & Complex Lore (Pro Preview)
  {
    modelId: 'gemini-3.1-pro-preview',
    displayName: 'Gemini 3.1 Pro Preview',
    family: 'Gemini 3 Pro',
    status: 'preview',
    capability: 'translation',
    recommendedUseCase: 'استدلال عمیق، متون فانتزی و آرپی‌جی / Advanced Contextual Lore & Game Localization',
    translationSuitability: 'advanced_reasoning',
    speed: '🧠 ۱.۵s',
    speedFa: '🧠 استدلال عمیق سینمایی (۱.۵ ثانیه)',
    speedEn: '🧠 Deep Lore Reasoning (1.5s)',
    speedAr: '🧠 استدلال عميق للألعاب المعقدة (1.5 ثانية)',
    quality: '💎💎💎💎💎 (بالاترین سطح درک و استدلال)',
    costTier: 'paid_premium',
    badge: 'استدلال عمیق / Pro Preview',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    reasoningLevel: 'ultra',
    descriptionFa: 'قدرتمندترین مدل تحلیلی؛ ویژه متون فلسفی، اصطلاحات پیچیده فانتزی/گیمینگ و حفظ کدهای حساس بازی.',
    descriptionEn: 'Advanced Pro engine for heavy narrative scripts, historical lore, slang, and strict game code parsing.',
    descriptionAr: 'أقوى نموذج للاستدلال وفهم نصوص الألعاب المعقدة، والسرد القصصي والأكواد الحساسة.',
    isStreaming: false,
    requiresPaidTier: true,
    contextWindow: '2M tokens',
    maxOutputTokens: 65536,
    structuredOutput: true,
    thinkingSupport: true,
  },

  // 7. Real-Time Streaming Subtitle Translation
  {
    modelId: 'gemini-live-stream',
    displayName: 'Gemini Live Stream',
    family: 'Gemini Stream Pipeline',
    status: 'stable',
    capability: 'translation',
    recommendedUseCase: 'ترجمه جریانی آنی سطر‌به‌سطر / Real-time Progressive Subtitle Streaming',
    translationSuitability: 'realtime_stream',
    speed: '🔴 زنده',
    speedFa: '🔴 پخش جریانی آنی و بدون تاخیر',
    speedEn: '🔴 Real-Time Stream',
    speedAr: '🔴 بث حي فوري',
    quality: '⭐⭐⭐⭐ (پخش بلادرنگ)',
    costTier: 'standard',
    badge: 'پخش زنده / Stream',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    reasoningLevel: 'realtime',
    descriptionFa: 'ترجمه جریانی آنی و زنده سطر‌به‌سطر بدون انتظار برای اتمام کل بسته، مناسب برای نظارت بلادرنگ.',
    descriptionEn: 'Real-time low-latency progressive streaming row-by-row directly into the grid.',
    descriptionAr: 'ترجمة فورية متدفقة حية سطرًا بسطر بدون انتظار انتهاء كامل الحزمة.',
    isStreaming: true,
    requiresPaidTier: false,
    structuredOutput: false,
    thinkingSupport: false,
  },

  // 8. DEDICATED AUDIO TRANSCRIPTION MODEL (Pre-recorded / Static audio via generateContent)
  // Kept separate from translation models!
  {
    modelId: 'gemini-3.5-transcribe',
    displayName: 'Gemini 3.5 Transcribe',
    family: 'Gemini Speech & Audio',
    status: 'stable',
    capability: 'transcription',
    recommendedUseCase: 'تبدیل صوت و ویدیو به زیرنویس SRT / Speech-to-Text Subtitle Timing & Transcription',
    translationSuitability: 'best_quality',
    speed: '⚡ صوت‌سریع',
    speedFa: '⚡ پیاده‌سازی سریع گفتار به متن',
    speedEn: '⚡ Fast Audio-to-SRT',
    speedAr: '⚡ تحويل سريع للصوت إلى نص',
    quality: '⭐⭐⭐⭐⭐ (دقت آوایی بالا)',
    costTier: 'standard',
    badge: 'تبدیل گفتار / Speech-to-Text',
    badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30',
    reasoningLevel: 'high',
    descriptionFa: 'مدل اختصاصی رسمی گوگل برای پیاده‌سازی صوت و ویدیو با تنظیم دقیق تایم‌کدهای SRT.',
    descriptionEn: 'Official dedicated Google Gemini model for speech-to-text audio and video SRT timestamp transcription.',
    descriptionAr: 'النموذج الرسمي المخصص لتحويل الصوت والفيديو إلى نصوص مع توقيت دقيق لملفات SRT.',
    isStreaming: false,
    requiresPaidTier: false,
    structuredOutput: true,
    thinkingSupport: false,
  },
];

/**
 * Filtered list of models strictly for Translation (excluding audio-only, image, TTS models)
 */
export const TRANSLATION_MODELS: ModelDefinition[] = ALL_MODELS.filter(
  (m) => m.capability === 'translation' && m.status !== 'deprecated'
);

/**
 * Filtered list of models strictly for Speech-to-Text Audio Transcription
 */
export const TRANSCRIPTION_MODELS: ModelDefinition[] = ALL_MODELS.filter(
  (m) => m.capability === 'transcription' && m.status !== 'deprecated'
);

export const DEFAULT_TRANSLATION_MODEL_ID = 'gemini-3.8-flash';
export const DEFAULT_TRANSCRIPTION_MODEL_ID = 'gemini-3.5-transcribe';

/**
 * Map of modelId to ModelDefinition for O(1) lookup
 */
export const MODEL_REGISTRY: Record<string, ModelDefinition> = ALL_MODELS.reduce(
  (acc, model) => {
    acc[model.modelId] = model;
    return acc;
  },
  {} as Record<string, ModelDefinition>
);

/**
 * Model ID alias resolver for backward compatibility
 */
export function resolveModelId(inputModel?: string): string {
  if (!inputModel) return DEFAULT_TRANSLATION_MODEL_ID;
  const trimmed = inputModel.trim();

  // Alias mappings
  switch (trimmed) {
    case 'gemini-3.1-pro':
      return 'gemini-3.1-pro-preview';
    case 'gemini-2.5-pro':
      return 'gemini-3.1-pro-preview';
    case 'gemini-2.5-flash':
      return 'gemini-3.8-flash';
    case 'gemini-pro':
      return 'gemini-3.1-pro-preview';
    case 'gemini-flash':
      return 'gemini-3.8-flash';
    case 'gemini-3.8-flash':
    case 'gemini-3.7-flash':
    case 'gemini-3.6-flash':
    case 'gemini-3.5-flash':
    case 'gemini-3.1-flash-lite':
    case 'gemini-3.1-pro-preview':
    case 'gemini-live-stream':
    case 'gemini-3.5-transcribe':
      return trimmed;
    default:
      if (MODEL_REGISTRY[trimmed]) return trimmed;
      return DEFAULT_TRANSLATION_MODEL_ID;
  }
}

/**
 * Returns prioritized fallback chain for a given translation target model
 */
export function getTranslationFallbackChain(primaryModelId: string): string[] {
  const resolved = resolveModelId(primaryModelId);
  const chain: string[] = [];

  if (resolved !== 'gemini-live-stream') {
    chain.push(resolved);
  }

  // Fallback priority: Flagship Flash -> High Flash -> Stable Flash -> Flash Lite -> Pro Preview
  const standardFallbacks = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
  ];

  for (const m of standardFallbacks) {
    if (!chain.includes(m)) {
      chain.push(m);
    }
  }

  return chain;
}

/**
 * Formats a clean, readable display label for dropdowns and selection lists
 */
export function formatModelDisplayLabel(model: ModelDefinition): string {
  switch (model.modelId) {
    case 'gemini-3.8-flash':
      return `${model.displayName} — بهترین کیفیت و دقت (Best Overall)`;
    case 'gemini-3.7-flash':
      return `${model.displayName} — کیفیت بالا و روان (High Quality)`;
    case 'gemini-3.6-flash':
      return `${model.displayName} — پرسرعت و پایدار (Fast)`;
    case 'gemini-3.1-flash-lite':
      return `${model.displayName} — اقتصادی و حجیم (Fast & Low Cost)`;
    case 'gemini-3.5-flash':
      return `${model.displayName} — سبک و استاندارد (Standard)`;
    case 'gemini-3.1-pro-preview':
      return `${model.displayName} — استدلال عمیق و بازی‌ها (Advanced Lore)`;
    case 'gemini-live-stream':
      return `${model.displayName} — پخش جریانی زنده (Real-time Stream)`;
    default:
      return `${model.displayName} — ${model.badge}`;
  }
}
