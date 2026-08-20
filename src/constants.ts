import { LanguageOption, ToneInfo } from './types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'fa', nameFa: 'فارسی (Persian)', nameEn: 'Persian', flag: '🇮🇷' },
  { code: 'en', nameFa: 'انگلیسی (English)', nameEn: 'English', flag: '🇺🇸' },
  { code: 'es', nameFa: 'اسپانیایی (Spanish)', nameEn: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', nameFa: 'فرانسوی (French)', nameEn: 'French', flag: '🇫🇷' },
  { code: 'de', nameFa: 'آلمانی (German)', nameEn: 'German', flag: '🇩🇪' },
  { code: 'ja', nameFa: 'ژاپنی (Japanese)', nameEn: 'Japanese', flag: '🇯🇵' },
  { code: 'ar', nameFa: 'عربی (Arabic)', nameEn: 'Arabic', flag: '🇸🇦' },
  { code: 'tr', nameFa: 'ترکی استانبولی (Turkish)', nameEn: 'Turkish', flag: '🇹🇷' },
  { code: 'ru', nameFa: 'روسی (Russian)', nameEn: 'Russian', flag: '🇷🇺' },
  { code: 'it', nameFa: 'ایتالیایی (Italian)', nameEn: 'Italian', flag: '🇮🇹' },
  { code: 'zh', nameFa: 'چینی ماندراین (Chinese)', nameEn: 'Chinese', flag: '🇨🇳' },
  { code: 'ko', nameFa: 'کره‌ای (Korean)', nameEn: 'Korean', flag: '🇰🇷' },
  { code: 'pt', nameFa: 'پرتغالی (Portuguese)', nameEn: 'Portuguese', flag: '🇵🇹' },
  { code: 'hi', nameFa: 'هندی (Hindi)', nameEn: 'Hindi', flag: '🇮🇳' },
  { code: 'nl', nameFa: 'هلندی (Dutch)', nameEn: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', nameFa: 'لهستانی (Polish)', nameEn: 'Polish', flag: '🇵🇱' },
  { code: 'sv', nameFa: 'سوئدی (Swedish)', nameEn: 'Swedish', flag: '🇸🇪' },
  { code: 'da', nameFa: 'دانمارکی (Danish)', nameEn: 'Danish', flag: '🇩🇰' },
  { code: 'no', nameFa: 'نروژی (Norwegian)', nameEn: 'Norwegian', flag: '🇳🇴' },
  { code: 'fi', nameFa: 'فنلاندی (Finnish)', nameEn: 'Finnish', flag: '🇫🇮' },
  { code: 'el', nameFa: 'یونانی (Greek)', nameEn: 'Greek', flag: '🇬🇷' },
  { code: 'he', nameFa: 'عبری (Hebrew)', nameEn: 'Hebrew', flag: '🇮🇱' },
  { code: 'vi', nameFa: 'ویتنامی (Vietnamese)', nameEn: 'Vietnamese', flag: '🇻🇳' },
  { code: 'th', nameFa: 'تایلندی (Thai)', nameEn: 'Thai', flag: '🇹🇭' },
  { code: 'uk', nameFa: 'اوکراینی (Ukrainian)', nameEn: 'Ukrainian', flag: '🇺🇦' },
  { code: 'cs', nameFa: 'چکی (Czech)', nameEn: 'Czech', flag: '🇨🇿' },
  { code: 'ro', nameFa: 'رومانیایی (Romanian)', nameEn: 'Romanian', flag: '🇷🇴' },
  { code: 'hu', nameFa: 'مجاری (Hungarian)', nameEn: 'Hungarian', flag: '🇭🇺' },
  { code: 'id', nameFa: 'اندونزیایی (Indonesian)', nameEn: 'Indonesian', flag: '🇮🇩' },
  { code: 'ms', nameFa: 'مالایی (Malay)', nameEn: 'Malay', flag: '🇲🇾' },
  { code: 'fil', nameFa: 'فیلیپینی (Filipino)', nameEn: 'Filipino', flag: '🇵🇭' },
  { code: 'ur', nameFa: 'اردو (Urdu)', nameEn: 'Urdu', flag: '🇵🇰' },
  { code: 'bn', nameFa: 'بنگالی (Bengali)', nameEn: 'Bengali', flag: '🇧🇩' },
  { code: 'ta', nameFa: 'تامیلی (Tamil)', nameEn: 'Tamil', flag: '🇮🇳' },
  { code: 'te', nameFa: 'تلوگو (Telugu)', nameEn: 'Telugu', flag: '🇮🇳' },
  { code: 'mr', nameFa: 'مراتی (Marathi)', nameEn: 'Marathi', flag: '🇮🇳' },
  { code: 'pa', nameFa: 'پنجابی (Punjabi)', nameEn: 'Punjabi', flag: '🇮🇳' },
  { code: 'az', nameFa: 'آذربایجانی (Azerbaijani)', nameEn: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'uz', nameFa: 'ازبکی (Uzbek)', nameEn: 'Uzbek', flag: '🇺🇿' },
  { code: 'kk', nameFa: 'قزاقی (Kazakh)', nameEn: 'Kazakh', flag: '🇰🇿' },
  { code: 'hy', nameFa: 'ارمنی (Armenian)', nameEn: 'Armenian', flag: '🇦🇲' },
  { code: 'ka', nameFa: 'گرجی (Georgian)', nameEn: 'Georgian', flag: '🇬🇪' },
  { code: 'hr', nameFa: 'کرواتی (Croatian)', nameEn: 'Croatian', flag: '🇭🇷' },
  { code: 'sr', nameFa: 'صربی (Serbian)', nameEn: 'Serbian', flag: '🇷🇸' },
  { code: 'bg', nameFa: 'بلغاری (Bulgarian)', nameEn: 'Bulgarian', flag: '🇧🇬' },
  { code: 'sk', nameFa: 'اسلواکی (Slovak)', nameEn: 'Slovak', flag: '🇸🇰' },
  { code: 'ca', nameFa: 'کاتالان (Catalan)', nameEn: 'Catalan', flag: '🇪🇸' },
  { code: 'sw', nameFa: 'سواحیلی (Swahili)', nameEn: 'Swahili', flag: '🇰🇪' },
  { code: 'af', nameFa: 'آفریکانس (Afrikaans)', nameEn: 'Afrikaans', flag: '🇿🇦' },
  { code: 'is', nameFa: 'ایسلندی (Icelandic)', nameEn: 'Icelandic', flag: '🇮🇸' },
  { code: 'ga', nameFa: 'ایرلندی (Irish)', nameEn: 'Irish', flag: '🇮🇪' },
  { code: 'cy', nameFa: 'ولزی (Welsh)', nameEn: 'Welsh', flag: '🇬🇧' },
  { code: 'am', nameFa: 'امهاری (Amharic)', nameEn: 'Amharic', flag: '🇪🇹' },
  { code: 'ps', nameFa: 'پشتو (Pashto)', nameEn: 'Pashto', flag: '🇦🇫' },
  { code: 'ku', nameFa: 'کوردی (Kurdish)', nameEn: 'Kurdish', flag: '🇮🇶' },
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
This system uses <b>Gemini 3.6 Flash</b> for lightning-fast translations.

3
00:00:09,100 --> 00:00:13,800
All timestamps and HTML styling tags like <i>italics</i> or <b>bold</b> are strictly preserved.

4
00:00:14,200 --> 00:00:18,900
Choose your target language, pick a tone, and convert between SRT, VTT, and ASS seamlessly!
`;
