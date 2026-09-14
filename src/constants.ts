import { LanguageOption, ToneInfo, AIModelOption } from './types';
import { TRANSLATION_MODELS, formatModelDisplayLabel } from './modelRegistry';

export const AI_MODELS: AIModelOption[] = TRANSLATION_MODELS.map((m) => ({
  id: m.modelId as any,
  name: m.displayName,
  badge: m.badge,
  badgeColor: m.badgeColor,
  speed: m.speed,
  speedFa: m.speedFa,
  speedEn: m.speedEn,
  speedAr: m.speedAr,
  reasoningLevel: m.reasoningLevel,
  descriptionFa: m.descriptionFa,
  descriptionEn: m.descriptionEn,
  descriptionAr: m.descriptionAr,
  isStreaming: m.isStreaming,
  requiresPaidTier: m.requiresPaidTier,
  status: m.status,
  quality: m.quality,
  costTier: m.costTier,
  recommendedUseCase: m.recommendedUseCase,
  displayLabel: formatModelDisplayLabel(m),
}));

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
00:00:00,500 --> 00:00:04,200
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
