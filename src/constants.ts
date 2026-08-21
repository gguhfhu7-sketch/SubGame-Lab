import { LanguageOption, ToneInfo, AIModelOption } from './types';

export const AI_MODELS: AIModelOption[] = [
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    badge: 'پیشنهادی / Default',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    speed: '⚡ 0.7s',
    speedFa: '⚡ فوق‌سریع (۰.۷ ثانیه)',
    speedEn: '⚡ Ultra Fast (0.7s)',
    speedAr: '⚡ فائق السرعة (0.7 ثانية)',
    reasoningLevel: 'standard',
    descriptionFa: 'بهترین تعادل سرعت بالا و کیفیت ترجمه، مصرف بهینه سهمیه API برای انواع زیرنویس و دیالوگ‌ها.',
    descriptionEn: 'Default model with optimal speed, high accuracy, and low token cost for most subtitles.',
    descriptionAr: 'النموذج الافتراضي المتوازن بين السرعة الفائقة والدقة العالية مع استهلاك أمثل لواجهة API.',
    isStreaming: false,
  },
  {
    id: 'gemini-live-stream',
    name: 'Gemini Live Translate',
    badge: 'پخش زنده / Stream',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    speed: '🔴 زنده',
    speedFa: '🔴 پخش جریانی آنی',
    speedEn: '🔴 Real-time Stream',
    speedAr: '🔴 بث حي فوري',
    reasoningLevel: 'realtime',
    descriptionFa: 'ترجمه جریانی آنی و زنده (Low-Latency Stream) سطر‌به‌سطر بدون انتظار برای اتمام کل بسته.',
    descriptionEn: 'Real-time low latency progressive streaming row-by-row directly into the grid.',
    descriptionAr: 'ترجمة فورية متدفقة حية سطرًا بسطر بدون انتظار انتهاء كامل الحزمة.',
    isStreaming: true,
  },
  {
    id: 'gemini-3.1-pro',
    name: 'Gemini 3.1 Pro',
    badge: 'استدلال بالا / Deep Reasoning',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    speed: '🧠 ۲.۱s',
    speedFa: '🧠 استدلال عمیق (۲.۱ ثانیه)',
    speedEn: '🧠 Deep Reasoning (2.1s)',
    speedAr: '🧠 استدلال عميق (2.1 ثانية)',
    reasoningLevel: 'ultra',
    descriptionFa: 'بالاترین قدرت درک متون پیچیده فانتزی/گیمینگ، حفظ لحن‌های چندلایه و کدهای حساس بازی‌ها.',
    descriptionEn: 'High-reasoning model best suited for complex fantasy lore, nuanced slang, and deep game scripts.',
    descriptionAr: 'أقوى نموذج للاستدلال وفهم نصوص الألعاب المعقدة، والسرد القصصي والأكواد الحساسة.',
    isStreaming: false,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    badge: 'دقت بالا / Advanced',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    speed: '💎 ۱.۸s',
    speedFa: '💎 دقت ادبی (۱.۸ ثانیه)',
    speedEn: '💎 High Accuracy (1.8s)',
    speedAr: '💎 دقة لغوية عالية (1.8 ثانية)',
    reasoningLevel: 'high',
    descriptionFa: 'مدل حرفه‌ای پرو برای بازنویسی دیالوگ‌های سنگین، اصطلاحات تاریخی و سناریوهای طولانی.',
    descriptionEn: 'Advanced Pro engine for heavy narrative scripts, historical lore, and strict formatting.',
    descriptionAr: 'نموذج احترافي عالي الدقة للنصوص الروائية الطويلة والمصطلحات التاريخية المعقدة.',
    isStreaming: false,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'حجم بالا / Bulk Fast',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    speed: '🚀 ۰.۵s',
    speedFa: '🚀 فوق‌سریع سبک (۰.۵ ثانیه)',
    speedEn: '🚀 Ultra-fast Bulk (0.5s)',
    speedAr: '🚀 خفيف وفائق السرعة (0.5 ثانية)',
    reasoningLevel: 'standard',
    descriptionFa: 'موتور سریع پشتیبان مناسب برای ترجمه‌های حجیم زیرنویس و جایگزینی پرسرعت.',
    descriptionEn: 'Ultra-fast fallback engine for bulk subtitles and lightweight translation jobs.',
    descriptionAr: 'محرك احتياطي فائق السرعة مناسب للترجمات الضخمة للملفات البسيطة.',
    isStreaming: false,
  },
];

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'fa', nameFa: 'فارسی (Persian)', nameEn: 'Persian', nameAr: 'الفارسية (Persian)', flag: '🇮🇷' },
  { code: 'en', nameFa: 'انگلیسی (English)', nameEn: 'English', nameAr: 'الإنجليزية (English)', flag: '🇺🇸' },
  { code: 'es', nameFa: 'اسپانیایی (Spanish)', nameEn: 'Spanish', nameAr: 'الإسبانية (Spanish)', flag: '🇪🇸' },
  { code: 'fr', nameFa: 'فرانسوی (French)', nameEn: 'French', nameAr: 'الفرنسية (French)', flag: '🇫🇷' },
  { code: 'de', nameFa: 'آلمانی (German)', nameEn: 'German', nameAr: 'الألمانية (German)', flag: '🇩🇪' },
  { code: 'ja', nameFa: 'ژاپنی (Japanese)', nameEn: 'Japanese', nameAr: 'اليابانية (Japanese)', flag: '🇯🇵' },
  { code: 'ar', nameFa: 'عربی (Arabic)', nameEn: 'Arabic', nameAr: 'العربية (Arabic)', flag: '🇸🇦' },
  { code: 'tr', nameFa: 'ترکی استانبولی (Turkish)', nameEn: 'Turkish', nameAr: 'التركية (Turkish)', flag: '🇹🇷' },
  { code: 'ru', nameFa: 'روسی (Russian)', nameEn: 'Russian', nameAr: 'الروسية (Russian)', flag: '🇷🇺' },
  { code: 'it', nameFa: 'ایتالیایی (Italian)', nameEn: 'Italian', nameAr: 'الإيطالية (Italian)', flag: '🇮🇹' },
  { code: 'zh', nameFa: 'چینی ماندراین (Chinese)', nameEn: 'Chinese', nameAr: 'الصينية (Chinese)', flag: '🇨🇳' },
  { code: 'ko', nameFa: 'کره‌ای (Korean)', nameEn: 'Korean', nameAr: 'الكورية (Korean)', flag: '🇰🇷' },
  { code: 'pt', nameFa: 'پرتغالی (Portuguese)', nameEn: 'Portuguese', nameAr: 'البرتغالية (Portuguese)', flag: '🇵🇹' },
  { code: 'hi', nameFa: 'هندی (Hindi)', nameEn: 'Hindi', nameAr: 'الهندية (Hindi)', flag: '🇮🇳' },
  { code: 'nl', nameFa: 'هلندی (Dutch)', nameEn: 'Dutch', nameAr: 'الهولندية (Dutch)', flag: '🇳🇱' },
  { code: 'pl', nameFa: 'لهستانی (Polish)', nameEn: 'Polish', nameAr: 'البولندية (Polish)', flag: '🇵🇱' },
  { code: 'sv', nameFa: 'سوئدی (Swedish)', nameEn: 'Swedish', nameAr: 'السويدية (Swedish)', flag: '🇸🇪' },
  { code: 'da', nameFa: 'دانمارکی (Danish)', nameEn: 'Danish', nameAr: 'الدانماركية (Danish)', flag: '🇩🇰' },
  { code: 'no', nameFa: 'نروژی (Norwegian)', nameEn: 'Norwegian', nameAr: 'النرويجية (Norwegian)', flag: '🇳🇴' },
  { code: 'fi', nameFa: 'فنلاندی (Finnish)', nameEn: 'Finnish', nameAr: 'الفنلندية (Finnish)', flag: '🇫🇮' },
  { code: 'el', nameFa: 'یونانی (Greek)', nameEn: 'Greek', nameAr: 'اليونانية (Greek)', flag: '🇬🇷' },
  { code: 'he', nameFa: 'عبری (Hebrew)', nameEn: 'Hebrew', nameAr: 'العبرية (Hebrew)', flag: '🇮🇱' },
  { code: 'vi', nameFa: 'ویتنامی (Vietnamese)', nameEn: 'Vietnamese', nameAr: 'الفيتنامية (Vietnamese)', flag: '🇻🇳' },
  { code: 'th', nameFa: 'تایلندی (Thai)', nameEn: 'Thai', nameAr: 'التايلاندية (Thai)', flag: '🇹🇭' },
  { code: 'uk', nameFa: 'اوکراینی (Ukrainian)', nameEn: 'Ukrainian', nameAr: 'الأوكرانية (Ukrainian)', flag: '🇺🇦' },
  { code: 'cs', nameFa: 'چکی (Czech)', nameEn: 'Czech', nameAr: 'التشيكية (Czech)', flag: '🇨🇿' },
  { code: 'ro', nameFa: 'رومانیایی (Romanian)', nameEn: 'Romanian', nameAr: 'الرومانية (Romanian)', flag: '🇷🇴' },
  { code: 'hu', nameFa: 'مجاری (Hungarian)', nameEn: 'Hungarian', nameAr: 'المجرية (Hungarian)', flag: '🇭🇺' },
  { code: 'id', nameFa: 'اندونزیایی (Indonesian)', nameEn: 'Indonesian', nameAr: 'الإندونيسية (Indonesian)', flag: '🇮🇩' },
  { code: 'ms', nameFa: 'مالایی (Malay)', nameEn: 'Malay', nameAr: 'الماليزية (Malay)', flag: '🇲🇾' },
  { code: 'fil', nameFa: 'فیلیپینی (Filipino)', nameEn: 'Filipino', nameAr: 'الفلبينية (Filipino)', flag: '🇵🇭' },
  { code: 'ur', nameFa: 'اردو (Urdu)', nameEn: 'Urdu', nameAr: 'الأردية (Urdu)', flag: '🇵🇰' },
  { code: 'bn', nameFa: 'بنگالی (Bengali)', nameEn: 'Bengali', nameAr: 'البنغالية (Bengali)', flag: '🇧🇩' },
  { code: 'ta', nameFa: 'تامیلی (Tamil)', nameEn: 'Tamil', nameAr: 'التاميلية (Tamil)', flag: '🇮🇳' },
  { code: 'te', nameFa: 'تلوگو (Telugu)', nameEn: 'Telugu', nameAr: 'التيلوغوية (Telugu)', flag: '🇮🇳' },
  { code: 'mr', nameFa: 'مراتی (Marathi)', nameEn: 'Marathi', nameAr: 'الماراثية (Marathi)', flag: '🇮🇳' },
  { code: 'pa', nameFa: 'پنجابی (Punjabi)', nameEn: 'Punjabi', nameAr: 'البنجابية (Punjabi)', flag: '🇮🇳' },
  { code: 'az', nameFa: 'آذربایجانی (Azerbaijani)', nameEn: 'Azerbaijani', nameAr: 'الأذربيجانية (Azerbaijani)', flag: '🇦🇿' },
  { code: 'uz', nameFa: 'ازبکی (Uzbek)', nameEn: 'Uzbek', nameAr: 'الأوزبكية (Uzbek)', flag: '🇺🇿' },
  { code: 'kk', nameFa: 'قزاقی (Kazakh)', nameEn: 'Kazakh', nameAr: 'الكازاخية (Kazakh)', flag: '🇰🇿' },
  { code: 'hy', nameFa: 'ارمنی (Armenian)', nameEn: 'Armenian', nameAr: 'الأرمنية (Armenian)', flag: '🇦🇲' },
  { code: 'ka', nameFa: 'گرجی (Georgian)', nameEn: 'Georgian', nameAr: 'الجورجية (Georgian)', flag: '🇬🇪' },
  { code: 'hr', nameFa: 'کرواتی (Croatian)', nameEn: 'Croatian', nameAr: 'الكرواتية (Croatian)', flag: '🇭🇷' },
  { code: 'sr', nameFa: 'صربی (Serbian)', nameEn: 'Serbian', nameAr: 'الصربية (Serbian)', flag: '🇷🇸' },
  { code: 'bg', nameFa: 'بلغاری (Bulgarian)', nameEn: 'Bulgarian', nameAr: 'البلغارية (Bulgarian)', flag: '🇧🇬' },
  { code: 'sk', nameFa: 'اسلواکی (Slovak)', nameEn: 'Slovak', nameAr: 'السلوفاكية (Slovak)', flag: '🇸🇰' },
  { code: 'ca', nameFa: 'کاتالان (Catalan)', nameEn: 'Catalan', nameAr: 'الكتالونية (Catalan)', flag: '🇪🇸' },
  { code: 'sw', nameFa: 'سواحیلی (Swahili)', nameEn: 'Swahili', nameAr: 'السواحلية (Swahili)', flag: '🇰🇪' },
  { code: 'af', nameFa: 'آفریکانس (Afrikaans)', nameEn: 'Afrikaans', nameAr: 'الأفريكانية (Afrikaans)', flag: '🇿🇦' },
  { code: 'is', nameFa: 'ایسلندی (Icelandic)', nameEn: 'Icelandic', nameAr: 'الآيسلندية (Icelandic)', flag: '🇮🇸' },
  { code: 'ga', nameFa: 'ایرلندی (Irish)', nameEn: 'Irish', nameAr: 'الأيرلندية (Irish)', flag: '🇮🇪' },
  { code: 'cy', nameFa: 'ولزی (Welsh)', nameEn: 'Welsh', nameAr: 'الويلزية (Welsh)', flag: '🇬🇧' },
  { code: 'am', nameFa: 'امهاری (Amharic)', nameEn: 'Amharic', nameAr: 'الأمهرية (Amharic)', flag: '🇪🇹' },
  { code: 'ps', nameFa: 'پشتو (Pashto)', nameEn: 'Pashto', nameAr: 'البشتوية (Pashto)', flag: '🇦🇫' },
  { code: 'ku', nameFa: 'کوردی (Kurdish)', nameEn: 'Kurdish', nameAr: 'الكردية (Kurdish)', flag: '🇮🇶' },
];

export const TONE_OPTIONS: ToneInfo[] = [
  {
    id: 'cinematic',
    labelFa: 'سینمایی و دراماتیک',
    labelEn: 'Cinematic & Dramatic',
    descriptionFa: 'ترجمه روان و شیوای دوبله فیلم‌های بزرگ سینمایی',
    iconName: 'Film',
  },
  {
    id: 'conversational',
    labelFa: 'عامیانه و گفتاری',
    labelEn: 'Conversational / Casual',
    descriptionFa: 'اصطلاحات روزمره و صمیمی مناسب سریال‌ها و ولاگ‌ها',
    iconName: 'MessageSquare',
  },
  {
    id: 'formal',
    labelFa: 'رسمی و دقیق',
    labelEn: 'Formal & Literal',
    descriptionFa: 'وفاداری به متن اصلی با ادبیات کتابی و دقیق',
    iconName: 'BookOpen',
  },
  {
    id: 'humorous',
    labelFa: 'طنز و شوخ‌طبعانه',
    labelEn: 'Humorous & Funny',
    descriptionFa: 'استفاده از شوخی‌ها و جوک‌های بدون سانسور متناسب زبان مقصد',
    iconName: 'Smile',
  },
  {
    id: 'educational',
    labelFa: 'آموزشی و علمی',
    labelEn: 'Educational & Informative',
    descriptionFa: 'رعایت اصطلاحات تخصصی، علمی و مستندها',
    iconName: 'GraduationCap',
  },
  {
    id: 'epic',
    labelFa: 'حماسی و تاریخی (Epic / Historical)',
    labelEn: 'Epic / Historical',
    descriptionFa: 'مناسب بازی‌های نقش‌آفرینی (RPG)، بازی‌های ویدیویی، محتوای تاریخی و داستان‌های فانتزی',
    iconName: 'Swords',
  },
  {
    id: 'custom',
    labelFa: 'لحن و دستورالعمل اختصاصی (Custom Prompt)',
    labelEn: 'Custom Prompt / Tone',
    descriptionFa: 'دستورالعمل‌های دلخواه، قوانین واژه‌نامه اختصاصی و اصطلاحات شخصی‌سازی شده',
    iconName: 'Wand2',
  },
];

export const SAMPLE_GAME_CSV_CONTENT = `string_id,speaker,source_text,translation,category
QUEST_INTRO_01,Eldrin the Mage,"Greetings, {player_name}! The kingdom is in dire peril.",,Quest
QUEST_OBJECTIVE_01,Narrator,"Collect %d enchanted crystals from the <color=#3B82F6>Azure Ruins</color>.",,Objective
ITEM_POTION_HEAL,System,"Restores $amount health points immediately.\\nCooldown: %s seconds.",,Item
NPC_BLACKSMITH_01,Goran Ironforge,"Need your blade sharpened? It will cost %d gold.",,Dialogue
UI_MENU_RESUME,UI,"Resume Adventure",,UI
UI_GAME_OVER,System,"<b>YOU HAVE DIED</b>\\nPress [SPACE] to respawn.",,UI`;

export const SAMPLE_GAME_JSON_CONTENT = JSON.stringify(
  {
    menu: {
      new_game: "Start New Quest",
      load_game: "Load Saved Realm",
      settings: "Game Options",
      quit: "Exit to Desktop"
    },
    dialogues: {
      hero_intro: "I am ready, King {king_name}. The prophecy shall be fulfilled.",
      quest_reward: "You received %d XP and {item_reward}!",
      warning_boss: "<color=#EF4444>Warning:</color> Dragon Lord approaches! Health: %d/%d"
    }
  },
  null,
  2
);

export const SAMPLE_GAME_CSV_DATA = SAMPLE_GAME_CSV_CONTENT;
export const SAMPLE_GAME_JSON_DATA = SAMPLE_GAME_JSON_CONTENT;

export const SAMPLE_SRT_CONTENT = `1
Welcome to the <i>Universal Subtitle Translator</i>!

2
00:00:05,000 --> 00:00:08,200
This system uses <b>Gemini AI Engine</b> for lightning-fast translations.

3
00:00:09,100 --> 00:00:13,800
All timestamps and HTML styling tags like <i>italics</i> or <b>bold</b> are strictly preserved.

4
00:00:14,200 --> 00:00:18,900
Choose your target language, pick a tone, and convert between SRT, VTT, and ASS seamlessly!
`;
