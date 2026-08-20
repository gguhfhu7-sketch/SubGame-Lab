import React from 'react';
import { UILanguage, TRANSLATIONS } from '../lib/i18n';
import { SUBGAME_LAB_LOGO } from '../assets/logo';
import { 
  HelpCircle, 
  X, 
  Key, 
  Upload, 
  Sliders, 
  Download, 
  ShieldAlert, 
  Clock, 
  Sparkles,
  Video,
  Palette,
  Wand2,
  Languages,
  Send,
  Gamepad2,
  Cpu,
  Layers,
  FileSpreadsheet,
  BellRing,
  Github
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  uiLang,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[uiLang];

  const getHelpContent = () => {
    if (uiLang === 'en') {
      return {
        title: 'SubGame Lab | User Guide & New Features',
        subtitle: 'Complete guide for Cinema Subtitles (SRT, VTT, ASS), Game Localization (CSV, JSON, XLSX, TXT), AI Speech Extraction & Bilingual Subtitles',
        steps: [
          {
            stepNum: '1',
            icon: Key,
            title: 'Gemini API Key Setup & Multi-Key Failover',
            desc: 'Click "API Key" in the top bar. Enter one or multiple Google AI Studio keys (separated by lines). The system automatically rotates keys if rate limits (429) occur with zero server storage.',
            tag: 'Multi-Key Rotation',
          },
          {
            stepNum: '2',
            icon: Layers,
            title: 'Dual Engine Architecture: Cinema vs. Game Localization',
            desc: 'Switch between 🎬 Cinema Engine (for movie subtitles with millisecond timecode preservation) and 🎮 Game Localization Engine (for game dialogue files in CSV, JSON, XLSX, and TXT with custom column mapping and variable preservation like {0}, %s, $player).',
            tag: 'Dual-Engine Mode',
          },
          {
            stepNum: '3',
            icon: Cpu,
            title: 'Ultra-Fast Virtualized Grid (50,000+ Lines)',
            desc: 'Powered by TanStack Virtual rendering, SubGame Lab can effortlessly open and edit massive game localization scripts and multi-hour cinema subtitles with zero lag, instant search, and real-time pagination.',
            tag: 'High-Performance Grid',
          },
          {
            stepNum: '4',
            icon: Wand2,
            title: 'Auto-Generate Subtitles from Raw Video',
            desc: 'Upload any raw video file without subtitles in any spoken language. Click "Generate Subtitles from Video" for 1-click AI speech recognition and timing generation before translating.',
            tag: 'AI Video-to-Subtitle',
          },
          {
            stepNum: '5',
            icon: Languages,
            title: 'Bilingual Subtitle Generator (Dual-Language)',
            desc: 'Create dual-language subtitles merging the original file text and translated text. Customize the position order (Original on Top or Translated on Top), custom line separators, secondary font colors, bracket enclosures, and export in SRT, VTT, or ASS format.',
            tag: 'Bilingual Subtitles',
          },
          {
            stepNum: '6',
            icon: Video,
            title: 'Real-time Video Preview & Subtitle Sync',
            desc: 'Upload or attach a video file to play it alongside your translated or bilingual subtitles in real-time with instant line highlighting, timeline seeking, and customizable visual font styling.',
            tag: 'Live Sync Player',
          },
          {
            stepNum: '7',
            icon: Sliders,
            title: 'Smart Translation, Tone & Custom Glossary',
            desc: 'Choose from 50+ languages, set translation tone (Cinematic, Formal, Conversational, Gaming Lore, Humorous), and define custom Glossary terms to enforce consistent naming across dialogues.',
            tag: 'AI Custom Glossary',
          },
          {
            stepNum: '8',
            icon: Clock,
            title: 'Interactive Editor, Time-Shift & RTL Fix',
            desc: 'Inline line editing, bulk time-shifting (+/- milliseconds), Undo/Redo history, and automated punctuation fix for RTL Persian and Arabic scripts.',
            tag: 'Advanced Tools',
          },
          {
            stepNum: '9',
            icon: Download,
            title: 'Multi-Format Export (SRT, VTT, ASS, CSV, JSON, XLSX)',
            desc: 'Download your translated or bilingual files in standard subtitle formats or export game localization files directly back to Excel XLSX, JSON, CSV, or TXT formats.',
            tag: 'Multi-Format Export',
          },
        ],
        networkNoticeTitle: 'Rate Limits & Network Guidance',
        networkNoticeDesc: 'Free-tier Gemini API keys have rate limits. The app features intelligent failovers:',
        networkNoticePoints: [
          'Add multiple API keys to prevent translation pauses on 429 quota exhaustion',
          'Automated fallback between Gemini 3.6 Flash and Gemini 2.5 Flash',
          'If in restricted network regions, use a VPN with TUN Mode or anti-sanction DNS',
          'Translation progress is saved line-by-line; click Resume if a batch pauses',
        ],
        telegramTitle: 'SaeedLab Official Channel (@MySaeedLab)',
        telegramCaption: 'Join our official Telegram channel for the latest releases, feature announcements, tutorials, test datasets, and direct support!',
        telegramBtn: 'Telegram Channel',
      };
    }

    if (uiLang === 'ar') {
      return {
        title: 'مختبر SubGame Lab | دليل الاستخدام والميزات الجديدة',
        subtitle: 'دليل شامل لترجمة الأفلام (SRT, VTT, ASS)، تعريب الألعاب (CSV, JSON, XLSX, TXT)، استخراج النصوص من الفيديو والترجمة المزدوجة',
        steps: [
          {
            stepNum: '١',
            icon: Key,
            title: 'إعداد مفتاح Gemini API والتدوير التلقائي',
            desc: 'انقر على "مفتاح API". أدخل مفتاحاً واحداً أو مفاتيح متعددة (كل مفتاح في سطر). يقوم النظام بتدوير المفاتيح تلقائياً عند الوصول للحد الأقصى (429) دون أي تخزين في السيرفر.',
            tag: 'تدوير المفاتيح',
          },
          {
            stepNum: '٢',
            icon: Layers,
            title: 'محرك مزدوج: ترجمة سينمائية مقابل تعريب الألعاب',
            desc: 'التبديل بين 🎬 المحرك السينمائي (مع الحفاظ الدقيق على التوقيت بالملي ثانية) و 🎮 محرك تعريب الألعاب (لملفات CSV, JSON, XLSX, TXT مع الحفاظ التام على المتغيرات {0} و %s و $var).',
            tag: 'محرك مزدوج متطور',
          },
          {
            stepNum: '٣',
            icon: Cpu,
            title: 'جدول افتراضي فائق السرعة (+50,000 سطر)',
            desc: 'باستخدام تقنية TanStack Virtual، يمكن للبرنامج فتح وتعديل ملفات الألعاب الضخمة والترجمات الطويلة بسلاسة تامة بسرعة 60 إطاراً في الثانية دون أي بطء.',
            tag: 'أداء فائق السرعة',
          },
          {
            stepNum: '٤',
            icon: Wand2,
            title: 'توليد تلقائي للترجمة من الفيديو الخام',
            desc: 'قم برفع أي فيديو خام بدون ترجمة بأي لغة. بنقرة واحدة على "توليد الترجمة من الفيديو"، يستخرج الذكاء الاصطناعي الكلام ويحدد التوقيت بدقة قبل ترجمته.',
            tag: 'الذكاء الاصطناعي للفيديو',
          },
          {
            stepNum: '٥',
            icon: Languages,
            title: 'إنشاء ترجمة مزدوجة اللغات (Bilingual Subtitles)',
            desc: 'دمج النص الأصلي والترجمة في ملف واحد مع إمكانية تحديد الترتيب (الأصل في الأعلى أو الأسفل)، لون النص الثانوي، الفواصل، والأقواس مع تصدير فوري.',
            tag: 'ترجمة دوزبانه',
          },
          {
            stepNum: '٦',
            icon: Video,
            title: 'معاينة الفيديو المباشرة ومزامنة النص',
            desc: 'ارفق ملف الفيديو لمشاهدته بالتزامن مع الترجمة المترجمة مباشرة مع التمييز التلقائي للسطر الحالي وتخصيص الخط والأنماط.',
            tag: 'مشغل المعاينة المباشر',
          },
          {
            stepNum: '٧',
            icon: Sliders,
            title: 'الترجمة الذكية، النبرة والمصطلحات المخصصة',
            desc: 'اختر من بين أكثر من 50 لغة، حدد نبرة الترجمة (سينمائية، رسمية، ألعاب، إبداعية) وأضف قاموس مصطلحات مخصص لتوحيد الأسماء والمصطلحات.',
            tag: 'محرك ترجمة مخصص',
          },
          {
            stepNum: '٨',
            icon: Clock,
            title: 'محرر تفاعلي، ضبط التوقيت وإصلاح علامات الترقيم',
            desc: 'تعديل مباشر للنصوص والتوقيت، تقديم/تأخير الزمن (+/- ملي ثانية)، سجل التراجع، وإصلاح تلقائي لعلامات الترقيم والأقواس للنصوص العربية.',
            tag: 'أدوات تحرير متقدمة',
          },
          {
            stepNum: '٩',
            icon: Download,
            title: 'تصدير بصيغ متعددة (SRT, VTT, ASS, CSV, JSON, XLSX)',
            desc: 'قم بتحميل ملف الترجمة الفردية أو المزدوجة بالصيغة المفضلة لديك أو تصدير ملفات الألعاب مباشرة إلى ملفات Excel أو JSON أو CSV.',
            tag: 'تصدير متعدد الصيغ',
          },
        ],
        networkNoticeTitle: 'إرشادات حدود API والشبكة',
        networkNoticeDesc: 'تتمتع المفاتيح المجانية بحد أقصى للطلبات. يحتوي التطبيق على نظام استعادة تلقائي:',
        networkNoticePoints: [
          'أضف أكثر من مفتاح API لتفادي توقف الترجمة عند نفاد الحصة',
          'تحويل تلقائي سلس بين طرازی Gemini 3.6 Flash و Gemini 2.5 Flash',
          'تأكد من استقرار الاتصال أو تفعيل VPN مناسب في حال وجود قيود شبكة',
          'يتم حفظ تقدم الترجمة تلقائياً خطوة بخطوة ويمكنك الاستئناف في أي وقت',
        ],
        telegramTitle: 'SaeedLab Official Channel (@MySaeedLab)',
        telegramCaption: 'انضم إلى قناتنا الرسمية على تيليجرام لمتابعة آخر التحديثات، الميزات الجديدة، الشروحات التقنية والدعم المباشر!',
        telegramBtn: 'Telegram Channel',
      };
    }

    // Default Persian (fa)
    return {
      title: 'راهنمای جامع و قابلیت‌های جدید SubGame Lab',
      subtitle: 'راهنمای کامل ترجمه زیرنویس فیلم (SRT, VTT, ASS)، بومی‌سازی بازی‌ها (CSV, JSON, XLSX, TXT)، تولید زیرنویس از ویدیو و زیرنویس دوزبانه',
      steps: [
        {
          stepNum: '۱',
          icon: Key,
          title: 'تنظیم کلید API و چرخش خودکار چند کلید (Multi-Key Rotation)',
          desc: 'از بالای صفحه روی «کلید API» کلیک کنید. امکان وارد کردن چند کلید Gemini در خطوط مجزا وجود دارد تا در صورت اتمام سهمیه (خطای ۴۲۹)، سیستم بلافاصله روی کلید بعدی سوییچ کند و ترجمه متوقف نشود.',
          tag: 'چرخش هوشمند کلیدها',
        },
        {
          stepNum: '۲',
          icon: Layers,
          title: 'معماری دوگانه: موتور سینمایی در برابر موتور بازی',
          desc: 'جابجایی میان 🎬 موتور سینمایی (ترجمه دقیق SRT, VTT, ASS با حفظ میلی‌ثانیه‌ای تایم‌کدها) و 🎮 موتور بومی‌سازی بازی (پشتیبانی از CSV, JSON, XLSX, TXT با مپینگ ستون‌ها و محافظت هوشمند از متغیرهای بازی مثل {0}, %s, $player).',
          tag: 'حالت دوگانه پیشرفته',
        },
        {
          stepNum: '۳',
          icon: Cpu,
          title: 'جدول مجازی‌سازی فوق‌سریع (+۵۰,۰۰۰ خط بدون لگ)',
          desc: 'با فناوری TanStack Virtual، اکنون می‌توانید فایل‌های متنی حجیم بازی‌ها و زیرنویس‌های چندساعته را با سرعت ۶۰ فریم بر ثانیه، اسکرول روان و جستجوی لحظه‌ای بدون افت فریم مشاهده و ویرایش کنید.',
          tag: 'مجازی‌سازی پرسرعت',
        },
        {
          stepNum: '۴',
          icon: Wand2,
          title: 'تولید هوشمند زیرنویس از روی ویدیو خام (بدون زیرنویس)',
          desc: 'فایل ویدیوی خام (به هر زبانی) را بارگذاری کنید. با یک کلیک روی «تولید زیرنویس از ویدیو»، هوش مصنوعی گفتار را تحلیل کرده و زیرنویس زمانبندی‌شده دقیقی می‌سازد تا آن را به هر زبانی ترجمه کنید.',
          tag: 'تولید زیرنویس با AI',
        },
        {
          stepNum: '۵',
          icon: Languages,
          title: 'ساخت زیرنویس دوزبانه با تنظیمات سفارشی (Bilingual)',
          desc: 'با کلیک روی «زیرنویس دوزبانه» می‌توانید زیرنویس ترکیبی بسازید؛ شامل تنظیم اولویت متن (زبان اصلی در بالا یا پایین)، نوع جداکننده خطوط، قراردادن پرانتز یا کروشه دور خط دوم، انتخاب رنگ متمایز خط دوم و خروجی با فرمت‌های SRT, VTT, ASS.',
          tag: 'زیرنویس دوزبانه',
        },
        {
          stepNum: '۶',
          icon: Video,
          title: 'پیش‌نمایش زنده ویدیو و هماهنگ‌سازی با زیرنویس',
          desc: 'ویدیو را همزمان با زیرنویس ترجمه‌شده یا دوزبانه پخش کنید؛ همراه با هایلایت خط فعال، پرش به زمان‌های مختلف و تنظیم کامل فونت، رنگ، پس‌زمینه و موقعیت قرارگیری روی تصویر.',
          tag: 'پلیر پیش‌نمایش زنده',
        },
        {
          stepNum: '۷',
          icon: Sliders,
          title: 'ترجمه هوشمند، تنظیم لحن و واژه‌نامه اختصاصی (Glossary)',
          desc: 'انتخاب از میان ۵۰+ زبان، تعیین لحن ترجمه (سینمایی، محاوره‌ای، اصطلاحات گیمینگ، رسمی، طنز) و تعریف واژه‌نامه اختصاصی برای ترجمه یکدست اسامی خاص بازی و فیلم.',
          tag: 'موتور هوشمند Gemini',
        },
        {
          stepNum: '۸',
          icon: Clock,
          title: 'ویرایشگر پیشرفته، تنظیم تایمینگ و اصلاح علائم راست‌به‌چپ',
          desc: 'ویرایش مستقیم متن و زمانبندی، عقب/جلو بردن زمان زیرنویس (میلی‌ثانیه)، تاریخچه Undo/Redo و اصلاح هوشمند علائم نگارشی و پرانتزهای فارسی/عربی.',
          tag: 'ابزارهای تخصصی',
        },
        {
          stepNum: '۹',
          icon: Download,
          title: 'خروجی چندفرمت (SRT, VTT, ASS, CSV, JSON, XLSX)',
          desc: 'دانلود فایل‌های ترجمه‌شده تک‌زبانه یا دوزبانه در فرمت‌های استاندارد زیرنویس و خروجی مستقیم فایل‌های بازی به فرمت اکسل (XLSX)، JSON، CSV یا TXT.',
          tag: 'خروجی چندفرمت',
        },
      ],
      networkNoticeTitle: '⚠️ راهنمای مدیریت محدودیت API و شبکه',
      networkNoticeDesc: 'کلیدهای رایگان گوگل Gemini دارای محدودیت تعداد درخواست (Rate Limit) هستند. برنامه به امکانات زیر مجهز است:',
      networkNoticePoints: [
        'افزایش سرعت با وارد کردن چند کلید API مجزا (سیستم خودکار کلید بعدی را جایگزین می‌کند)',
        'جایگزینی هوشمند میان جدیدترین مدل‌ها: Gemini 3.6 Flash (اصلی) و Gemini 2.5 Flash (پشتیبان)',
        'در صورت خطای شبکه در ایران، حتماً از VPN با TUN Mode یا DNS ضدتحریم استفاده کنید',
        'پیشرفت ترجمه خط‌به‌خط ذخیره می‌شود؛ در صورت توقف می‌توانید با دکمه «ادامه» فرایند را تکمیل کنید',
      ],
      telegramTitle: 'SaeedLab Official Channel (@MySaeedLab)',
      telegramCaption: 'جهت اطلاع‌رسانی آخرین آپدیت‌ها، قابلیت‌های جدید، آموزش‌های تخصصی، فایل‌های تست بازی/زیرنویس و پشتیبانی مستقیم به کانال تلگرام ما بپیوندید!',
      telegramBtn: 'Telegram Channel',
    };
  };

  const content = getHelpContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-3xl w-full shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden border border-indigo-500/30 p-0.5 shadow-md shrink-0">
              <img
                src={SUBGAME_LAB_LOGO}
                alt="SubGame Lab"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {content.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {content.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telegram Community Channel Callout (Top Highlight) */}
        <div className="bg-gradient-to-r from-sky-500/15 via-sky-500/10 to-indigo-500/15 border border-sky-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sky-950 dark:text-sky-100 shadow-sm">
          <div className="flex items-start gap-3.5 w-full sm:w-auto">
            <div className="w-11 h-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/30 mt-0.5">
              <Send className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-bold font-sans tracking-wide text-sky-950 dark:text-white flex items-center gap-1.5">
                  <BellRing className="w-4 h-4 text-sky-500" />
                  {content.telegramTitle}
                </h4>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                  Official Community
                </span>
              </div>
              <p className="text-xs text-sky-800 dark:text-sky-200/90 leading-relaxed max-w-xl">
                {content.telegramCaption}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
            <a
              href="https://t.me/MySaeedLab"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-sky-500/30 flex items-center justify-center gap-2 active:scale-95 text-center shrink-0 group font-sans tracking-wide"
            >
              <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              <span>Telegram</span>
            </a>
            <a
              href="https://github.com/gguhfhu7-sketch/SubGame-Lab"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md border border-slate-700 flex items-center justify-center gap-2 active:scale-95 text-center shrink-0 group font-sans tracking-wide"
            >
              <Github className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>GitHub</span>
            </a>
          </div>
        </div>

        {/* Steps List */}
        <div className="grid grid-cols-1 gap-3.5">
          {content.steps.map((step) => {
            const IconComp = step.icon;
            return (
              <div
                key={step.stepNum}
                className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-start gap-3.5 transition-all hover:border-indigo-500/40"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold font-mono text-sm flex items-center justify-center shrink-0 shadow-sm">
                  {step.stepNum}
                </div>
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <IconComp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {step.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                      {step.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Network & Rate Limit Warning */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-2 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{content.networkNoticeTitle}</span>
          </div>
          <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/90">
            {content.networkNoticeDesc}
          </p>
          <ul className="list-disc list-inside text-xs space-y-1 font-medium text-amber-900/90 dark:text-amber-200/90 mt-1">
            {content.networkNoticePoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Powered by Gemini 3.6 Flash & 2.5 Flash
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
