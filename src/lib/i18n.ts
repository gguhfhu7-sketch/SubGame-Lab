export type UILanguage = 'fa' | 'en' | 'ar';

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  modeCinema: string;
  modeCinemaDesc: string;
  modeGame: string;
  modeGameDesc: string;
  loadGameSample: string;
  loadSubtitleSample: string;
  apiKey: string;
  customKeyActive: string;
  defaultKeyActive: string;
  downloadSubtitle: string;
  downloadDisabled: string;
  processing: string;
  uploadTitle: string;
  uploadSubtitle: string;
  uploadGameTitle: string;
  uploadGameSubtitle: string;
  dragDropOrClick: string;
  encoding: string;
  autoDetect: string;
  linesCount: string;
  sourceLang: string;
  targetLang: string;
  translationTone: string;
  startTranslation: string;
  translatingProgress: string;
  pause: string;
  resume: string;
  cancel: string;
  retryAttempt: string;
  batch: string;
  of: string;
  searchLanguagePlaceholder: string;
  noLanguageFound: string;
  subtitlesList: string;
  gameStringsList: string;
  line: string;
  originalText: string;
  translatedText: string;
  actions: string;
  retranslateLine: string;
  deleteLine: string;
  findAndReplace: string;
  findPlaceholder: string;
  replacePlaceholder: string;
  replace: string;
  replaceWords: string;
  applyReplace: string;
  fillEmptyWithOriginal: string;
  fillEmptyLines: string;
  apiKeyModalTitle: string;
  apiKeyModalDesc: string;
  enterApiKeyPlaceholder: string;
  saveKey: string;
  clearKey: string;
  keySavedSuccess: string;
  keyClearedSuccess: string;
  close: string;
  toneCinematic: string;
  toneConversational: string;
  toneFormal: string;
  toneHumorous: string;
  toneEducational: string;
  toneEpic: string;
  toneCustom: string;
  toneDescCinematic: string;
  toneDescConversational: string;
  toneDescFormal: string;
  toneDescHumorous: string;
  toneDescEducational: string;
  toneDescEpic: string;
  toneDescCustom: string;
  customPromptLabel: string;
  customPromptPlaceholder: string;
  customPromptPresetGlossary: string;
  customPromptPresetRpg: string;
  customPromptPresetMilitary: string;
  customPromptPresetNoCensor: string;
  gameMappingTitle: string;
  sourceColumn: string;
  targetColumn: string;
  keyColumn: string;
  contextColumn: string;
  variablesDetected: string;
  testKey: string;
  testingKey: string;
  keyValid: string;
  keyInvalid: string;
  swapLanguages: string;
  outputFormat: string;
  subtitleSettings: string;
  gameSettings: string;
  autoDetectedSource: string;
  filterAll: string;
  filterUntranslated: string;
  filterTranslated: string;
  filterModified: string;
  searchEditorPlaceholder: string;
  itemsPerPage: string;
  page: string;
  previous: string;
  next: string;
  copiedToClipboard: string;
  lineUpdated: string;
  lineDeleted: string;
  replacedCount: string;
  filledEmptyCount: string;
  newFileLoaded: string;
  previewLiveSubtitle: string;
  originalTextLabel: string;
  translatedTextLabel: string;
  completedLine: string;
  copyText: string;
  restoreOriginal: string;
  noSubtitlesToTranslate: string;
  userCancelled: string;
  translationFinished: string;
  singleLineTranslated: string;
  noFileLoaded: string;
  bilingualSubtitles: string;
  bilingualModalTitle: string;
  bilingualModalDesc: string;
  bilingualOrder: string;
  originalTop: string;
  translatedTop: string;
  bilingualSeparator: string;
  sepNewline: string;
  sepDash: string;
  sepSlash: string;
  sepPipe: string;
  sepDot: string;
  wrapSecondary: string;
  wrapNone: string;
  wrapParentheses: string;
  wrapBrackets: string;
  wrapCurly: string;
  secondaryColor: string;
  secondarySize: string;
  applyBilingualToEditor: string;
  exportBilingualFile: string;
  bilingualAppliedSuccess: string;
  restoreSingleLang: string;
  bilingualActive: string;
  previewBilingual: string;
  bilingualQuickToggle: string;
  bilingualPresets: string;
  presetCinema: string;
  presetLearner: string;
  presetModern: string;
  presetSingleLine: string;
  toggleRowBilingualPreview: string;
  batchSize: string;
  batchSizeDesc: string;
  skipCodeOnly: string;
  skipCodeOnlyDesc: string;
  appendRTLMarkers: string;
  appendRTLMarkersDesc: string;
  fullscreen: string;
  exitFullscreen: string;
  virtualizedStats: string;
  advancedGameOptions: string;
  advancedSubtitleOptions: string;
  aiModelSelector: string;
  aiModelGuide: string;
  modelGuideTitle: string;
  modelGuideDesc: string;
  modelLiveBadge: string;
  streamingLive: string;
  downloadGameFiles: string;
  modeMovie: string;
  modeMovieTitle: string;
  modeGameTitle: string;
  modeCinemaShort: string;
  modeGameShort: string;
  copyrightText: string;
}

export const TRANSLATIONS: Record<UILanguage, Translations> = {
  fa: {
    appTitle: 'SubGame Lab',
    appSubtitle: 'موتور نسل جدید ترجمه زیرنویس فیلم و ویدیو',
    modeCinema: '🎬 زیرنویس فیلم و سریال',
    modeCinemaDesc: 'موتور سینمایی برای SRT, VTT, ASS با حفظ دقیق تایم‌کدها و همگام‌سازی ویدیو',
    modeGame: '🎮 بومی‌سازی و ترجمه بازی',
    modeGameDesc: 'موتور بازی برای CSV, JSON, TXT, XLSX با نگاشت ستون‌ها، حفظ کلیدها و ایزولاسیون متغیرها',
    loadGameSample: 'بارگذاری نمونه رشته‌های بازی (RPG Strings)',
    loadSubtitleSample: 'بارگذاری نمونه زیرنویس (SRT)',
    apiKey: 'کلید API',
    customKeyActive: 'کلید اختصاصی',
    defaultKeyActive: 'کلید پیش‌فرض',
    downloadSubtitle: 'دانلود فایل ترجمه',
    downloadDisabled: 'دانلود غیرفعال',
    processing: 'در حال پردازش',
    uploadTitle: 'بارگذاری فایل زیرنویس',
    uploadSubtitle: 'پشتیبانی کامل از فرمت‌های SRT, VTT, ASS, SSA, SUB',
    uploadGameTitle: 'بارگذاری فایل بازی (Localization Data)',
    uploadGameSubtitle: 'پشتیبانی کامل از فرمت‌های CSV, JSON, TXT, XLSX',
    dragDropOrClick: 'فایل را اینجا رها کنید یا برای انتخاب کلیک نمایید',
    encoding: 'انکودینگ فایل',
    autoDetect: 'تشخیص خودکار',
    linesCount: 'سطر / ردیف',
    sourceLang: 'زبان مبدأ',
    targetLang: 'زبان مقصد',
    translationTone: 'لحن و سبک ترجمه',
    startTranslation: 'شروع ترجمه هوشمند',
    translatingProgress: 'در حال ترجمه با Gemini 3.6 Flash',
    pause: 'توقف موقت',
    resume: 'ادامه',
    cancel: 'لغو',
    retryAttempt: 'تلاش مجدد',
    batch: 'بسته',
    of: 'از',
    searchLanguagePlaceholder: 'جستجوی زبان...',
    noLanguageFound: 'زبانی یافت نشد',
    subtitlesList: 'ویرایشگر خط به خط زیرنویس',
    gameStringsList: 'میز کار بومی‌سازی بازی (Game Strings & Keys)',
    line: 'ردیف',
    originalText: 'متن اصلی',
    translatedText: 'متن ترجمه‌شده',
    actions: 'عملیات',
    retranslateLine: 'ترجمه مجدد این مورد',
    deleteLine: 'حذف سطر',
    findAndReplace: 'جستجو و جایگزینی همزمان',
    findPlaceholder: 'واژه قدیمی...',
    replacePlaceholder: 'واژه جدید...',
    replace: 'جایگزینی',
    replaceWords: 'جستجو و جایگزینی کلمات',
    applyReplace: 'جایگزینی همه',
    fillEmptyWithOriginal: 'پرکردن موارد خالی با متن اصلی',
    fillEmptyLines: 'تکمیل خطوط خالی',
    apiKeyModalTitle: 'تنظیم کلید اختصاصی Gemini API (BYOK)',
    apiKeyModalDesc: 'می‌توانید کلید شخصی خود را از Google AI Studio وارد کنید تا محدودیتی در ترجمه نداشته باشید. کلید در مرورگر شما ذخیره می‌شود.',
    enterApiKeyPlaceholder: 'کلید API خود را وارد کنید (AIzaSy...)',
    saveKey: 'ذخیره کلید',
    clearKey: 'پاکسازی کلید',
    keySavedSuccess: 'کلید API شخصی با موفقیت ذخیره شد.',
    keyClearedSuccess: 'کلید API شخصی پاک شد و سیستم به کلید پیش‌فرض برگشت.',
    close: 'بستن',
    toneCinematic: 'سینمایی و دراماتیک',
    toneConversational: 'عامیانه و گفتاری',
    toneFormal: 'رسمی و دقیق',
    toneHumorous: 'طنز و شوخ‌طبعانه (بدون سانسور)',
    toneEducational: 'آموزشی و علمی',
    toneEpic: 'حماسی و تاریخی (Epic / RPG)',
    toneCustom: 'لحن و دستورالعمل اختصاصی (Custom Prompt)',
    toneDescCinematic: 'لحن شیوا و مناسب دوبله فیلم‌های سینمایی فاخر',
    toneDescConversational: 'زبان روزمره، صمیمی و روانی مکالمات خیابانی',
    toneDescFormal: 'وفاداری کامل به واژگان با ادبیات معیار و رسمی',
    toneDescHumorous: 'ترجمه شوخی‌ها، جوک‌ها و متلک‌ها به صورت روان و بدون سانسور',
    toneDescEducational: 'رعایت ترمینولوژی تخصصی و صراحت مستندهای علمی',
    toneDescEpic: 'مناسب بازی‌های نقش‌آفرینی (RPG)، دیالوگ‌های حماسی، اسطوره‌ای و تاریخی',
    toneDescCustom: 'تعریف قوانین سفارشی، واژه‌نامه اختصاصی و سبک شخصی‌سازی شده',
    customPromptLabel: 'دستورالعمل و پرامپت اختصاصی برای هوش مصنوعی:',
    customPromptPlaceholder: 'دستورات دلخواه، اصطلاحات اختصاصی یا گلاسری را بنویسید (مثال: واژه‌های خاص را این‌گونه ترجمه کن: Mana = مانا, Quest = مأموریت. لحن بازی حماسی باشد و اسامی خاص را ترجمه نکن).',
    customPromptPresetGlossary: 'واژه‌نامه RPG: Mana=مانا | HP=سلامتی | Quest=مأموریت',
    customPromptPresetRpg: 'لحن حماسی فانتزی قرون وسطایی با گفتگوی کهن',
    customPromptPresetMilitary: 'بازی اکشن نظامی با اصطلاحات تاکتیکی و بی‌سیم',
    customPromptPresetNoCensor: 'ترجمه عامیانه خیابانی و تند بدون سانسور',
    gameMappingTitle: 'نگاشت ستون‌های فایل (Column Mapping)',
    sourceColumn: 'ستون متن اصلی (Source Text)',
    targetColumn: 'ستون ترجمه (Target Translation)',
    keyColumn: 'ستون شناسه یا کلید (Key / ID Column)',
    contextColumn: 'ستون گوینده یا دسته‌بندی (Context / Speaker)',
    variablesDetected: 'متغیرها و کدهای محافظت‌شده:',
    testKey: 'تست ارتباط کلید',
    testingKey: 'در حال بررسی کلید...',
    keyValid: 'کلید API معتبر و فعال است!',
    keyInvalid: 'خطا در تست کلید API:',
    swapLanguages: 'تعویض زبان مبدأ و مقصد',
    outputFormat: 'فرمت خروجی:',
    subtitleSettings: 'تنظیمات ترجمه زیرنویس',
    gameSettings: 'تنظیمات بومی‌سازی بازی',
    autoDetectedSource: 'تشخیص هوشمند:',
    filterAll: 'همه موارد',
    filterUntranslated: 'ترجمه‌نشده',
    filterTranslated: 'ترجمه‌شده',
    filterModified: 'ویرایش‌شده',
    searchEditorPlaceholder: 'جستجو در متن اصلی یا ترجمه...',
    itemsPerPage: 'تعداد در صفحه:',
    page: 'صفحه',
    previous: 'قبلی',
    next: 'بعدی',
    copiedToClipboard: 'در حافظه کپی شد!',
    lineUpdated: 'سطر با موفقیت به‌روزرسانی شد.',
    lineDeleted: 'سطر حذف شد.',
    replacedCount: 'تعداد {count} مورد جایگزین شد.',
    filledEmptyCount: 'تعداد {count} مورد خالی با متن اصلی پر شد.',
    newFileLoaded: 'فایل جدید با موفقیت بارگذاری شد.',
    previewLiveSubtitle: 'پیش‌نمایش زنده',
    originalTextLabel: 'متن اصلی',
    translatedTextLabel: 'متن ترجمه‌شده',
    completedLine: 'تکمیل‌شده',
    copyText: 'کپی متن',
    restoreOriginal: 'بازگردانی متن اصلی',
    noSubtitlesToTranslate: 'هیچ داده‌ای برای ترجمه وجود ندارد.',
    userCancelled: 'ترجمه توسط کاربر لغو شد.',
    translationFinished: 'ترجمه با موفقیت به پایان رسید!',
    singleLineTranslated: 'سطر با موفقیت ترجمه شد.',
    noFileLoaded: 'هیچ فایلی بارگذاری نشده است.',
    bilingualSubtitles: 'زیرنویس دوزبانه',
    bilingualModalTitle: 'تنظیمات و ایجاد زیرنویس دوزبانه',
    bilingualModalDesc: 'نمایش و خروجی همزمان زیرنویس اصلی و ترجمه‌شده با تفکیک خطوط، رنگ‌بندی مجزا و بدون دستکاری یا تخریب متن ترجمه.',
    bilingualOrder: 'ترتیب قرارگیری زبان‌ها',
    originalTop: 'زبان اصلی بالا 🔼 | ترجمه پایین 🔽',
    translatedTop: 'ترجمه بالا 🔼 | زبان اصلی پایین 🔽',
    bilingualSeparator: 'فاصله و جداکننده دو خط',
    sepNewline: 'سطر جدید (دو خط کاملاً جداگانه)',
    sepDash: 'خط تیره ( - )',
    sepSlash: 'اسلش ( / )',
    sepPipe: 'خط عمودی ( | )',
    sepDot: 'نقطه جداکننده ( • )',
    wrapSecondary: 'نشانه‌گذاری و فرمت زبان دوم',
    wrapNone: 'بدون علامت (ساده)',
    wrapParentheses: 'پرانتز ( ... )',
    wrapBrackets: 'کروشه [ ... ]',
    wrapCurly: 'آکولاد { ... }',
    secondaryColor: 'رنگ زبان دوم (پیش‌نمایش و ASS)',
    secondarySize: 'مقیاس اندازه زبان دوم',
    applyBilingualToEditor: 'ذخیره و فعال‌سازی حالت دوزبانه',
    exportBilingualFile: 'دانلود مستقیم زیرنویس دوزبانه',
    bilingualAppliedSuccess: 'زیرنویس‌ها با موفقیت به حالت دوزبانه تبدیل شدند!',
    restoreSingleLang: 'بازگردانی به تک‌زبانه',
    bilingualActive: 'دوزبانه فعال',
    previewBilingual: 'پیش‌نمایش زنده دوزبانه',
    bilingualQuickToggle: 'نمایش دوزبانه در پلیر ویدئو',
    bilingualPresets: 'الگوهای سریع دوزبانه',
    presetCinema: 'سینمایی استاندارد (اصلی بالا + ترجمه زرد)',
    presetLearner: 'یادگیری زبان (ترجمه بالا + اصلی در پرانتز)',
    presetModern: 'مدرن و فیروزه‌ای (اصلی بالا + فیروزه‌ای ۸۵٪)',
    presetSingleLine: 'تک‌خطی فشرده (جداکننده خط عمودی | )',
    toggleRowBilingualPreview: 'پیش‌نمایش خروجی دوزبانه در سطرها',
    batchSize: 'اندازه دسته‌های ترجمه (Batch Size)',
    batchSizeDesc: 'تعداد سطرهای ارسالی در هر درخواست به هوش مصنوعی',
    skipCodeOnly: 'رد کردن سطرهای بدون متن / کد خالص',
    skipCodeOnlyDesc: 'صرفه‌جویی در مصرف توکن با رد خودکار سطرها، متغیرهای منفرد و اعداد',
    appendRTLMarkers: 'افزودن نشانه‌های مخفی راست‌به‌چپ (RTL Mark \u200F)',
    appendRTLMarkersDesc: 'تضمین نمایش صحیح علائم نگارشی و پرانتزها در موتورهای بازی (Unity/Unreal)',
    fullscreen: 'تمام‌صفحه / نمای متمرکز',
    exitFullscreen: 'خروج از تمام‌صفحه',
    virtualizedStats: 'رندرینگ فوق‌سریع مجازی (DOM Virtualization فعال است)',
    advancedGameOptions: 'تنظیمات پیشرفته موتور بازی',
    advancedSubtitleOptions: 'تنظیمات پیشرفته ترجمه زیرنویس',
    aiModelSelector: 'مدل هوش مصنوعی:',
    aiModelGuide: 'راهنمای مدل‌ها',
    modelGuideTitle: 'راهنمای جامع انتخاب مدل‌های هوش مصنوعی',
    modelGuideDesc: 'توضیحات و کاربرد بهینه هر یک از مدل‌های Gemini برای ترجمه زیرنویس و اسکریپت‌های بازی.',
    modelLiveBadge: 'پخش زنده آنی (Live Stream)',
    streamingLive: 'در حال دریافت زنده و جریانی ترجمه...',
    downloadGameFiles: 'دانلود فایل‌های بومی‌سازی بازی',
    modeMovie: 'فیلم و ویدیو',
    modeMovieTitle: 'حالت ترجمه زیرنویس فیلم و سریال',
    modeGameTitle: 'حالت ترجمه و محلی‌سازی بازی',
    modeCinemaShort: 'فیلم',
    modeGameShort: 'بازی',
    copyrightText: 'ساخته شده توسط سعید صفاری © تمامی حقوق محفوظ است',
  },
  en: {
    appTitle: 'SubGame Lab',
    appSubtitle: 'Next-Gen Movie & Video Subtitle Translation Engine',
    modeCinema: '🎬 Movies & TV Subtitles',
    modeCinemaDesc: 'Cinema Engine for SRT, VTT, ASS with exact millisecond timecode preservation & player sync',
    modeGame: '🎮 Game Localization',
    modeGameDesc: 'Game Engine for CSV, JSON, TXT, XLSX with column mapping, key preservation & variable isolation',
    loadGameSample: 'Load Sample Game Strings (RPG Data)',
    loadSubtitleSample: 'Load Sample Subtitle (SRT)',
    apiKey: 'API Key',
    customKeyActive: 'Custom Key',
    defaultKeyActive: 'Default Key',
    downloadSubtitle: 'Download Translated File',
    downloadDisabled: 'Download Locked',
    processing: 'Processing',
    uploadTitle: 'Upload Subtitle File',
    uploadSubtitle: 'Full support for SRT, VTT, ASS, SSA, SUB formats',
    uploadGameTitle: 'Upload Game Localization File',
    uploadGameSubtitle: 'Full support for CSV, JSON, TXT, XLSX formats',
    dragDropOrClick: 'Drag & drop file here or click to browse',
    encoding: 'File Encoding',
    autoDetect: 'Auto Detect',
    linesCount: 'items',
    sourceLang: 'Source Language',
    targetLang: 'Target Language',
    translationTone: 'Translation Tone & Style',
    startTranslation: 'Start AI Translation',
    translatingProgress: 'Translating with Gemini 3.6 Flash',
    pause: 'Pause',
    resume: 'Resume',
    cancel: 'Cancel',
    retryAttempt: 'Retry Attempt',
    batch: 'Batch',
    of: 'of',
    searchLanguagePlaceholder: 'Search language...',
    noLanguageFound: 'No language found',
    subtitlesList: 'Line-by-Line Subtitle Editor',
    gameStringsList: 'Game Localization Workspace & String Matrix',
    line: 'Row',
    originalText: 'Original Text',
    translatedText: 'Translated Text',
    actions: 'Actions',
    retranslateLine: 'Re-translate item',
    deleteLine: 'Delete row',
    findAndReplace: 'Find & Batch Replace',
    findPlaceholder: 'Find word...',
    replacePlaceholder: 'Replace with...',
    replace: 'Replace All',
    replaceWords: 'Find & Replace Words',
    applyReplace: 'Replace All',
    fillEmptyWithOriginal: 'Fill empty items with original text',
    fillEmptyLines: 'Fill Empty Items',
    apiKeyModalTitle: 'Custom Gemini API Key Settings (BYOK)',
    apiKeyModalDesc: 'Enter your personal Google AI Studio Gemini API key to bypass default usage limits. Stored securely in your browser.',
    enterApiKeyPlaceholder: 'Paste your Gemini API Key (AIzaSy...)',
    saveKey: 'Save Key',
    clearKey: 'Clear Key',
    keySavedSuccess: 'Custom API key saved successfully.',
    keyClearedSuccess: 'Custom API key removed. Restored default server key.',
    close: 'Close',
    toneCinematic: 'Cinematic & Dramatic',
    toneConversational: 'Casual & Conversational',
    toneFormal: 'Formal & Precise',
    toneHumorous: 'Humorous & Uncensored',
    toneEducational: 'Educational & Technical',
    toneEpic: 'Epic / Historical (RPG)',
    toneCustom: 'Custom Prompt / Instructions',
    toneDescCinematic: 'Expressive, epic, cinematic and movie-dubbing style',
    toneDescConversational: 'Casual spoken language, friendly banter and everyday idioms',
    toneDescFormal: 'Strict literary accuracy, standard formal grammar and vocabulary',
    toneDescHumorous: 'Natural jokes, street slang & comedy translated without censorship',
    toneDescEducational: 'Precise scientific terminology & clear educational clarity',
    toneDescEpic: 'Perfect for RPG video games, ancient/mythological dialogue & fantasy lore',
    toneDescCustom: 'Your custom prompt, tailored glossary rules and specific translation style',
    customPromptLabel: 'Custom Instructions & Glossary for AI Engine:',
    customPromptPlaceholder: 'Define your custom translation instructions or glossary rules (e.g. Mana = مانا, Quest = مأموریت. Keep medieval fantasy tone and do not translate character names).',
    customPromptPresetGlossary: 'RPG Glossary: Mana=مانا | HP=سلامتی | Quest=مأموریت',
    customPromptPresetRpg: 'Medieval high-fantasy RPG tone with archaic dialogue',
    customPromptPresetMilitary: 'Military FPS action with tactical radio terminology',
    customPromptPresetNoCensor: 'Fast-paced street slang without censorship',
    gameMappingTitle: 'File Column Mapping Configuration',
    sourceColumn: 'Source Text Column',
    targetColumn: 'Target Translation Column',
    keyColumn: 'Key / String ID Column',
    contextColumn: 'Context / Speaker Column',
    variablesDetected: 'Protected code tokens & tags:',
    testKey: 'Test Connection',
    testingKey: 'Testing key...',
    keyValid: 'API Key is valid and active!',
    keyInvalid: 'API Key test failed:',
    swapLanguages: 'Swap source and target languages',
    outputFormat: 'Output Format:',
    subtitleSettings: 'Subtitle Translation Settings',
    gameSettings: 'Game Localization Settings',
    autoDetectedSource: 'Auto-detected:',
    filterAll: 'All Items',
    filterUntranslated: 'Untranslated',
    filterTranslated: 'Translated',
    filterModified: 'Modified',
    searchEditorPlaceholder: 'Search in original or translated strings...',
    itemsPerPage: 'Items per page:',
    page: 'Page',
    previous: 'Previous',
    next: 'Next',
    copiedToClipboard: 'Copied to clipboard!',
    lineUpdated: 'Row updated successfully.',
    lineDeleted: 'Row deleted.',
    replacedCount: 'Replaced {count} occurrence(s).',
    filledEmptyCount: 'Filled {count} empty item(s) with original text.',
    newFileLoaded: 'New file loaded successfully.',
    previewLiveSubtitle: 'Live Preview',
    originalTextLabel: 'Original Text',
    translatedTextLabel: 'Translated Text',
    completedLine: 'Completed',
    copyText: 'Copy Text',
    restoreOriginal: 'Restore Original',
    noSubtitlesToTranslate: 'No items available to translate.',
    userCancelled: 'Translation cancelled by user.',
    translationFinished: 'Translation completed successfully!',
    singleLineTranslated: 'Item translated successfully.',
    noFileLoaded: 'No file loaded.',
    bilingualSubtitles: 'Bilingual Subtitles',
    bilingualModalTitle: 'Bilingual Subtitles Settings & Generator',
    bilingualModalDesc: 'Combine original and translated lines into a single dual-language subtitle with custom position, separators, and colors.',
    bilingualOrder: 'Language Order',
    originalTop: 'Original on Top 🔼 | Translated on Bottom 🔽',
    translatedTop: 'Translated on Top 🔼 | Original on Bottom 🔽',
    bilingualSeparator: 'Line Separator',
    sepNewline: 'New Line (Stacked)',
    sepDash: 'Dash ( - )',
    sepSlash: 'Slash ( / )',
    sepPipe: 'Pipe ( | )',
    sepDot: 'Bullet Dot ( • )',
    wrapSecondary: 'Secondary Language Enclosure',
    wrapNone: 'None (Plain)',
    wrapParentheses: 'Parentheses ( ... )',
    wrapBrackets: 'Square Brackets [ ... ]',
    wrapCurly: 'Curly Braces { ... }',
    secondaryColor: 'Secondary Text Color (Preview & ASS)',
    secondarySize: 'Secondary Font Scale',
    applyBilingualToEditor: 'Save & Enable Dual-Language Mode',
    exportBilingualFile: 'Download Bilingual File',
    bilingualAppliedSuccess: 'Subtitles successfully merged into bilingual mode!',
    restoreSingleLang: 'Restore Single Language',
    bilingualActive: 'Bilingual Active',
    previewBilingual: 'Live Bilingual Preview',
    bilingualQuickToggle: 'Dual-Language Subtitles in Player',
    bilingualPresets: 'Quick Bilingual Presets',
    presetCinema: 'Cinema Standard (Original Top + Yellow Bottom)',
    presetLearner: 'Language Learner (Translation Top + (Original))',
    presetModern: 'Modern Cyan (Original Top + 85% Cyan)',
    presetSingleLine: 'Compact Single-Line (Separated by | )',
    toggleRowBilingualPreview: 'Row Dual-Language Previews',
    batchSize: 'Batch Processing Size',
    batchSizeDesc: 'Number of rows sent per Gemini API call',
    skipCodeOnly: 'Skip Code-Only / Non-Text Rows',
    skipCodeOnlyDesc: 'Save API quota by auto-bypassing numbers, symbols, and isolated tokens',
    appendRTLMarkers: 'Append Hidden RTL Markers (\\u200f)',
    appendRTLMarkersDesc: 'Enforces correct punctuation formatting in game engines (Unity/Unreal/Godot)',
    fullscreen: 'Full-Screen Workspace',
    exitFullscreen: 'Exit Full-Screen',
    virtualizedStats: 'Ultra-Fast DOM Virtualization (Active)',
    advancedGameOptions: 'Advanced Game Localization Settings',
    advancedSubtitleOptions: 'Advanced Subtitle Settings',
    aiModelSelector: 'AI Translation Model:',
    aiModelGuide: 'Model Guide',
    modelGuideTitle: 'AI Models Guide & Selection',
    modelGuideDesc: 'Detailed recommendations for choosing the best Gemini model for your subtitle or game files.',
    modelLiveBadge: 'Live Streaming',
    streamingLive: 'Receiving live stream translation...',
    downloadGameFiles: 'Download Game Localization Files',
    modeMovie: 'Movies & Video',
    modeMovieTitle: 'Movie & Subtitle Translation Mode',
    modeGameTitle: 'Game Localization Mode',
    modeCinemaShort: 'Cinema',
    modeGameShort: 'Game',
    copyrightText: 'Created by Saeed Saffari © All rights reserved',
  },
  ar: {
    appTitle: 'SubGame Lab',
    appSubtitle: 'المحرك المتطور لترجمة ترجمات الأفلام والفيديو',
    modeCinema: '🎬 ترجمة الأفلام والمسلسلات',
    modeCinemaDesc: 'محرك سينمائي لصيغ SRT, VTT, ASS مع الحفاظ الدقيق على التوقيت الزمني',
    modeGame: '🎮 تعريب وترجمة الألعاب',
    modeGameDesc: 'محرك الألعاب لصيغ CSV, JSON, TXT, XLSX مع عزل المتغيرات وحفظ المفاتيح',
    loadGameSample: 'تحميل نموذج نصوص الألعاب (RPG)',
    loadSubtitleSample: 'تحميل نموذج الترجمة (SRT)',
    apiKey: 'مفتاح API',
    customKeyActive: 'مفتاح خاص',
    defaultKeyActive: 'المفتاح الافتراضي',
    downloadSubtitle: 'تحميل الملف المترجم',
    downloadDisabled: 'التحميل معطل',
    processing: 'جاري المعالجة',
    uploadTitle: 'رفع ملف الترجمة',
    uploadSubtitle: 'دعم كامل لصيغ SRT, VTT, ASS, SSA, SUB',
    uploadGameTitle: 'رفع ملف تعريب اللعبة',
    uploadGameSubtitle: 'دعم كامل لصيغ CSV, JSON, TXT, XLSX',
    dragDropOrClick: 'اسحب الملف هنا أو انقر للاختيار',
    encoding: 'ترميز الملف',
    autoDetect: 'كشف تلقائي',
    linesCount: 'عنصر / سطر',
    sourceLang: 'اللغة المصدر',
    targetLang: 'اللغة الهدف',
    translationTone: 'أسلوب ونبرة الترجمة',
    startTranslation: 'بدء الترجمة الذكية',
    translatingProgress: 'جاري الترجمة بواسطة Gemini 3.6 Flash',
    pause: 'إيقاف مؤقت',
    resume: 'استئناف',
    cancel: 'إلغاء',
    retryAttempt: 'إعادة المحاولة',
    batch: 'دفعة',
    of: 'من',
    searchLanguagePlaceholder: 'البحث عن لغة...',
    noLanguageFound: 'لم يتم العثور على لغة',
    subtitlesList: 'محرر الترجمة سطرًا بسطر',
    gameStringsList: 'محرر ومصفوفة نصوص اللعبة',
    line: 'سطر',
    originalText: 'النص الأصلي',
    translatedText: 'النص المترجم',
    actions: 'إجراءات',
    retranslateLine: 'إعادة ترجمة هذا السطر',
    deleteLine: 'حذف السطر',
    findAndReplace: 'البحث والاستبدال الجماعي',
    findPlaceholder: 'الكلمة القديمة...',
    replacePlaceholder: 'الكلمة الجديدة...',
    replace: 'استبدال الكل',
    replaceWords: 'البحث واستبدال الكلمات',
    applyReplace: 'استبدال الكل',
    fillEmptyWithOriginal: 'ملء الأسطر الفارغة بالنص الأصلي',
    fillEmptyLines: 'ملء الأسطر الفارغة',
    apiKeyModalTitle: 'إعداد مفتاح Gemini API الخاص (BYOK)',
    apiKeyModalDesc: 'أدخل مفتاح API الخاص بك من Google AI Studio لتجاوز قيود الاستخدام الافتراضية. يحفظ بأمان في متصفحك.',
    enterApiKeyPlaceholder: 'أدخل مفتاح API الخاص بك (AIzaSy...)',
    saveKey: 'حفظ المفتاح',
    clearKey: 'مسح المفتاح',
    keySavedSuccess: 'تم حفظ مفتاح API بنجاح.',
    keyClearedSuccess: 'تمت إزالة المفتاح الخاص والعودة للمفتاح الافتراضي.',
    close: 'إغلاق',
    toneCinematic: 'سينمائي ودرامي',
    toneConversational: 'عامي وحواري',
    toneFormal: 'رسمي ودقيق',
    toneHumorous: 'فكاهي وبدون رقابة',
    toneEducational: 'تعليمي وعلمي',
    toneEpic: 'ملحمي وتاريخي (Epic / RPG)',
    toneCustom: 'تعليمات وأسلوب مخصص (Custom Prompt)',
    toneDescCinematic: 'أسلوب درامي وشيق مناسب للأفلام والمسلسلات',
    toneDescConversational: 'لغة عامية وحوارات يومية طبيعية',
    toneDescFormal: 'دقة لغوية رسمية وأسلوب أدبي قياسي',
    toneDescHumorous: 'ترجمة الفكاهة والنكات بدون سانسور وبشكل طبيعي',
    toneDescEducational: 'دقة علمية ومصطلحات متخصصة للمستندات',
    toneDescEpic: 'مناسب لألعاب تقمص الأدوار (RPG) والنصوص الأسطورية والتاريخية',
    toneDescCustom: 'توجيهات مخصصة وقاموس مصطلحات خاص بك',
    customPromptLabel: 'التعليمات المخصصة للذكاء الاصطناعي:',
    customPromptPlaceholder: 'اكتب قواعدك الخاصة أو قاموس المصطلحات (مثال: Mana = مانا, Quest = مهمة).',
    customPromptPresetGlossary: 'قاموس RPG: Mana=مانا | HP=نقاط الحياة | Quest=مهمة',
    customPromptPresetRpg: 'نبرة خيالية ملحمية من العصور الوسطى',
    customPromptPresetMilitary: 'لعبة أكشن عسكرية مع مصطلحات تكتيكية',
    customPromptPresetNoCensor: 'ترجمة عامية واقعية بدون رقابة',
    gameMappingTitle: 'تحديد وتعيين أعمدة الملف',
    sourceColumn: 'عمود النص الأصلي',
    targetColumn: 'عمود الترجمة',
    keyColumn: 'عمود المعرف أو المفتاح (Key ID)',
    contextColumn: 'عمود المتحدث أو الفئة (Speaker)',
    variablesDetected: 'المتغيرات والوسوم المحمية:',
    testKey: 'اختبار الاتصال',
    testingKey: 'جاري اختبار المفتاح...',
    keyValid: 'مفتاح API صالح ونشط!',
    keyInvalid: 'فشل اختبار مفتاح API:',
    swapLanguages: 'تبديل اللغة المصدر والهدف',
    outputFormat: 'صيغة المخرجات:',
    subtitleSettings: 'إعدادات ترجمة النصوص',
    gameSettings: 'إعدادات تعريب الألعاب',
    autoDetectedSource: 'الكشف التلقائي:',
    filterAll: 'كل الأسطر',
    filterUntranslated: 'غير مترجم',
    filterTranslated: 'مترجم',
    filterModified: 'معدل',
    searchEditorPlaceholder: 'البحث في النصوص الأصلية أو المترجمة...',
    itemsPerPage: 'العناصر في الصفحة:',
    page: 'صفحة',
    previous: 'السابق',
    next: 'التالي',
    copiedToClipboard: 'تم النسخ إلى الحافظة!',
    lineUpdated: 'تم تحديث السطر بنجاح.',
    lineDeleted: 'تم حذف السطر.',
    replacedCount: 'تم استبدال {count} عنصر.',
    filledEmptyCount: 'تم ملء {count} سطر فارغ بالنص الأصلي.',
    newFileLoaded: 'تم تحميل الملف بنجاح.',
    previewLiveSubtitle: 'معاينة الترجمة الحية',
    originalTextLabel: 'النص الأصلي',
    translatedTextLabel: 'النص المترجم',
    completedLine: 'مكتمل',
    copyText: 'نسخ النص',
    restoreOriginal: 'استعادة الأصلي',
    noSubtitlesToTranslate: 'لا توجد بيانات متاحة للترجمة.',
    userCancelled: 'تم إلغاء الترجمة بواسطة المستخدم.',
    translationFinished: 'تمت الترجمة بنجاح!',
    singleLineTranslated: 'تمت ترجمة العنصر بنجاح.',
    noFileLoaded: 'لم يتم تحميل أي ملف.',
    bilingualSubtitles: 'ترجمة ثنائية اللغة',
    bilingualModalTitle: 'إعدادات وتوليد الترجمة ثنائية اللغة',
    bilingualModalDesc: 'دمج النص الأصلي والمترجم في ملف واحد مع إمكانية تخصيص الترتيب والألوان والفواصل.',
    bilingualOrder: 'ترتيب اللغات',
    originalTop: 'الأصل في الأعلى 🔼 | الترجمة في الأسفل 🔽',
    translatedTop: 'الترجمة في الأعلى 🔼 | الأصل في الأسفل 🔽',
    bilingualSeparator: 'فاصل السطور',
    sepNewline: 'سطر جديد (منفصل)',
    sepDash: 'شرطة ( - )',
    sepSlash: 'مائل ( / )',
    sepPipe: 'شريط عمودي ( | )',
    sepDot: 'نقطه ( • )',
    wrapSecondary: 'تمييز اللغة الثانوية',
    wrapNone: 'بدون تمييز (عادي)',
    wrapParentheses: 'أقواس هلالية ( ... )',
    wrapBrackets: 'أقواس معقوفة [ ... ]',
    wrapCurly: 'أقواس مزخرفة { ... }',
    secondaryColor: 'لون النص الثانوي (معاينة و ASS)',
    secondarySize: 'حجم الخط الثانوي',
    applyBilingualToEditor: 'حفظ وتفعيل الترجمة ثنائية اللغة',
    exportBilingualFile: 'تحميل ملف ثنائي اللغة',
    bilingualAppliedSuccess: 'تم دمج الترجمة إلى الوضع ثنائي اللغة بنجاح!',
    restoreSingleLang: 'استعادة لغة واحدة',
    bilingualActive: 'ثنائي اللغة مفعّل',
    previewBilingual: 'معاينة حية ثنائية اللغة',
    bilingualQuickToggle: 'عرض ثنائي في مشغل الفيديو',
    bilingualPresets: 'أنماط ثنائية جاهزة',
    presetCinema: 'سينمائي قياسي (الأصل بالأعلى + ترجمة صفراء)',
    presetLearner: 'تعليم اللغات (الترجمة بالأعلى + الأصل بين قوسين)',
    presetModern: 'عصري فيروزي (الأصل بالأعلى + فيروزي 85%)',
    presetSingleLine: 'سطر واحد مدمج (فاصل شريط عمودي | )',
    toggleRowBilingualPreview: 'معاينة الترجمة المزدوجة بالسطور',
    batchSize: 'حجم حزمة المعالجة (Batch Size)',
    batchSizeDesc: 'عدد الأسطر المرسلة في كل طلب للذكاء الاصطناعي',
    skipCodeOnly: 'تخطي الأسطر الخالية من النصوص / الكود فقط',
    skipCodeOnlyDesc: 'توفير الحصة بتخطي الأرقام والرموز والمتغيرات المعزولة تلقائيًا',
    appendRTLMarkers: 'إضافة علامات الاتجاه المخفية (RTL Mark \u200F)',
    appendRTLMarkersDesc: 'ضمان التنسيق الصحيح لعلامات الترقيم في محركات الألعاب (Unity/Unreal)',
    fullscreen: 'ملء الشاشة / وضع التركيز',
    exitFullscreen: 'الخروج من ملء الشاشة',
    virtualizedStats: 'عرض افتراضي فائق السرعة (DOM Virtualization مفعّل)',
    advancedGameOptions: 'إعدادات متقدمة لمحرك الألعاب',
    advancedSubtitleOptions: 'إعدادات متقدمة لترجمة النصوص والأفلام',
    aiModelSelector: 'نموذج الذكاء الاصطناعي:',
    aiModelGuide: 'دليل النماذج',
    modelGuideTitle: 'دليل اختيار نماذج الذكاء الاصطناعي',
    modelGuideDesc: 'توصيات تفصيلية لاختيار أفضل نموذج Gemini لملفات الترجمة أو الألعاب الخاصة بك.',
    modelLiveBadge: 'البث المباشر الفوري',
    streamingLive: 'جاري استلام البث المباشر للترجمة...',
    downloadGameFiles: 'تحميل ملفات تعريب اللعبة',
    modeMovie: 'أفلام وفيديو',
    modeMovieTitle: 'وضع ترجمة الأفلام والمسلسلات',
    modeGameTitle: 'وضع تعريب وترجمة الألعاب',
    modeCinemaShort: 'أفلام',
    modeGameShort: 'ألعاب',
    copyrightText: 'تم التطوير بواسطة سعيد صفاري © جميع الحقوق محفوظة',
  },
};
