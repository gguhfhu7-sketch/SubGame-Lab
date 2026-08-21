import React, { useState } from 'react';
import { UILanguage, TRANSLATIONS } from '../lib/i18n';
import { SUBGAME_LAB_LOGO } from '../assets/logo';
import { 
  X, 
  Key, 
  Sparkles,
  Video,
  Wand2,
  Languages,
  Send,
  Gamepad2,
  Cpu,
  Layers,
  FileSpreadsheet,
  ShieldAlert,
  Clock,
  Download,
  Film,
  Github,
  CheckCircle2,
  ArrowRight,
  Sliders,
  FileCode2,
  TableProperties
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
}

type GuideTab = 'quickstart' | 'cinema' | 'game' | 'api';

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  uiLang,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('quickstart');

  if (!isOpen) return null;

  const t = TRANSLATIONS[uiLang];

  const tabsConfig = [
    {
      id: 'quickstart' as GuideTab,
      labelFa: 'شروع سریع',
      labelEn: 'Quick Start',
      labelAr: 'البداية السريعة',
      icon: Sparkles,
    },
    {
      id: 'cinema' as GuideTab,
      labelFa: 'سینما و فیلم',
      labelEn: 'Cinema & Video',
      labelAr: 'الأفلام والترجمة',
      icon: Film,
    },
    {
      id: 'game' as GuideTab,
      labelFa: 'بومی‌سازی بازی',
      labelEn: 'Game Localization',
      labelAr: 'تعريب الألعاب',
      icon: Gamepad2,
    },
    {
      id: 'api' as GuideTab,
      labelFa: 'کلید API و شبکه',
      labelEn: 'API & Network',
      labelAr: 'المفاتيح والشبكة',
      icon: Key,
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900 dark:text-slate-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-indigo-500/30 p-0.5 shadow-sm shrink-0">
              <img
                src={SUBGAME_LAB_LOGO}
                alt="SubGame Lab"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {uiLang === 'en' ? 'SubGame Lab Guide' : uiLang === 'ar' ? 'دليل SubGame Lab' : 'راهنمای کار با نرم‌افزار SubGame Lab'}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {uiLang === 'en' 
                  ? 'Cinema Subtitles & Game Localization Studio' 
                  : uiLang === 'ar' 
                  ? 'استوديو ترجمة الأفلام وتعريب الألعاب بالذكاء الاصطناعي' 
                  : 'موتور هوشمند ترجمه زیرنویس فیلم و بومی‌سازی بازی‌ها'}
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 overflow-x-auto">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const label = uiLang === 'en' ? tab.labelEn : uiLang === 'ar' ? tab.labelAr : tab.labelFa;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: QUICK START */}
          {activeTab === 'quickstart' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Step 1 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                      1
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {uiLang === 'en' ? 'Select Mode' : uiLang === 'ar' ? 'اختر النمط' : 'انتخاب حالت (فیلم یا بازی)'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {uiLang === 'en' 
                      ? 'Switch between Cinema Mode (SRT, VTT, ASS) and Game Mode (CSV, JSON, XLSX) from the top bar.' 
                      : uiLang === 'ar' 
                      ? 'اختر بين نمط الأفلام (SRT, VTT, ASS) أو نمط الألعاب (CSV, JSON, XLSX) من شريط الأدوات العلوي.' 
                      : 'از بالای صفحه حالت مورد نظر را انتخاب کنید: حالت فیلم برای زیرنویس‌ها و حالت بازی برای فایل‌های اکسل/CSV/JSON.'}
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                      2
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {uiLang === 'en' ? 'Upload or Drop File' : uiLang === 'ar' ? 'رفع أو سحب الملف' : 'آپلود فایل زیرنویس یا بازی'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {uiLang === 'en' 
                      ? 'Drag and drop your subtitle or game dialogue file. You can also load built-in sample datasets.' 
                      : uiLang === 'ar' 
                      ? 'قم بسحب وإفلات ملف الترجمة أو نصوص اللعبة، أو جرب الملفات التجريبية الجاهزة بنقرة واحدة.' 
                      : 'فایل را در کادر آپلود بکشید یا برای تست از دکمه بارگذاری نمونه‌های آماده زیرنویس/بازی استفاده کنید.'}
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                      3
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {uiLang === 'en' ? 'Configure Tone & Model' : uiLang === 'ar' ? 'ضبط النبرة والنموذج' : 'تنظیم زبان، لحن و مدل AI'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {uiLang === 'en' 
                      ? 'Choose the target language, translation tone (Cinematic, Humorous, Game Lore), and your preferred Gemini model.' 
                      : uiLang === 'ar' 
                      ? 'حدد لغة الهدف ونبرة الترجمة (سينمائية، محادثة، ألعاب) ونموذج الذكاء الاصطناعي المناسب.' 
                      : 'زبان مقصد، لحن ترجمه (سینمایی، گیمینگ، محاوره‌ای) و مدل جمینای مد نظرتان را انتخاب نمایید.'}
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                      4
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {uiLang === 'en' ? 'Translate & Export' : uiLang === 'ar' ? 'الترجمة والتصدير' : 'ترجمه دسته‌ای و دانلود خروجی'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {uiLang === 'en' 
                      ? 'Click "Start Translation". You can pause/resume anytime and export in multiple subtitle or tabular formats.' 
                      : uiLang === 'ar' 
                      ? 'اضغط على "بدء الترجمة". يمكنك الإيقاف المؤقت والاستئناف وتنزيل النتيجة بالصيغة المرغوبة فور اكتمالها.' 
                      : 'روی «شروع ترجمه هوشمند» کلیک کنید. پیشرفت خط‌به‌خط ذخیره شده و خروجی با فرمت دلخواه قابل دانلود است.'}
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CINEMA & SUBTITLES */}
          {activeTab === 'cinema' && (
            <div className="space-y-3">
              
              {/* Feature 1 */}
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {uiLang === 'en' ? 'AI Speech-to-Subtitle from Raw Video' : uiLang === 'ar' ? 'استخراج الترجمة من الفيديو الخام بالـ AI' : 'تولید هوشمند زیرنویس از روی ویدیو خام (بدون زیرنویس)'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {uiLang === 'en'
                      ? 'Upload a video file with dialogue. Click "Generate Subtitles from Video" to transcribe speech with millisecond timestamps before translation.'
                      : uiLang === 'ar'
                      ? 'ارفع ملف الفيديو واضغط على "توليد الترجمة من الفيديو" لاستخراج الكلام وتوقيته بدقة بالملي ثانية تلقائياً.'
                      : 'ویدیوی خام بدون زیرنویس را بارگذاری کرده و دکمه «تولید زیرنویس از ویدیو» را بزنید تا هوش مصنوعی گفتار را به زیرنویس دقیق تبدیل کند.'}
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                  <Languages className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {uiLang === 'en' ? 'Bilingual Subtitles Generator' : uiLang === 'ar' ? 'صانع الترجمة المزدوجة (دوزبانه)' : 'ساخت زیرنویس دوزبانه (Bilingual)'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {uiLang === 'en'
                      ? 'Combine original audio text with translated text. Choose line order (original on top or bottom), secondary font colors, and bracket enclosures.'
                      : uiLang === 'ar'
                      ? 'دمج النص الأصلي والمترجم في سطرين مع تحديد الترتيب، الألوان المتباينة، وفواصل الأقواس.'
                      : 'ترکیب خطوط انگلیسی و فارسی با تنظیم ترتیب (اصلی بالا یا پایین)، رنگ خط دوم و نشانه‌گذاری دلخواه.'}
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {uiLang === 'en' ? 'Real-Time Sync Video Player' : uiLang === 'ar' ? 'مشغل المعاينة المتزامن' : 'پیش‌نمایش زنده ویدیو و همگام‌سازی'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {uiLang === 'en'
                      ? 'Attach a local video to preview lines in real-time, click any subtitle to seek to that timestamp, and adjust font style overlays.'
                      : uiLang === 'ar'
                      ? 'مشاهدة الفيديو المرفق بالتزامن مع الترجمة مع تمييز السطر الحالي والقفز للتوقيت المحدد.'
                      : 'پخش ویدیو همزمان با زیرنویس ترجمه‌شده با پرش به تایم‌کد هر خط و تنظیم استایل فونت روی تصویر.'}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: GAME LOCALIZATION */}
          {activeTab === 'game' && (
            <div className="space-y-3">
              
              {/* Feature 1 */}
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                  <TableProperties className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {uiLang === 'en' ? 'Interactive Column Mapping (CSV & Excel)' : uiLang === 'ar' ? 'تحديد وتعيين أعمدة الجداول' : 'نگاشت هوشمند ستون‌ها (CSV و اکسل XLSX)'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {uiLang === 'en'
                      ? 'Easily choose which column contains the original text to translate and which column receives the translation without disturbing game IDs or keys.'
                      : uiLang === 'ar'
                      ? 'حدد بسهولة عمود النص المراد ترجمته وعمود المخرجات مع الحفاظ التام على باقي بيانات الجدول.'
                      : 'ستون حاوی دیالوگ جهت ترجمه را انتخاب کرده و ستون خروجی را مشخص کنید؛ سایر ستون‌ها و شناسه‌ها کاملاً دست‌نخورده حفظ می‌شوند.'}
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {uiLang === 'en' ? 'Code & Variable Protection ({0}, %s, $player)' : uiLang === 'ar' ? 'حماية المتغيرات والأكواد' : 'محافظت از متغیرها و کدهای بازی ({0}, %s, $var)'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {uiLang === 'en'
                      ? 'The AI engine is trained to preserve all in-game formatting tokens, placeholders, escape characters (\n, \t), and control tags verbatim.'
                      : uiLang === 'ar'
                      ? 'يقوم النظام بحماية جميع المتغيرات والرموز البرمجية من التعديل أو التشويه أثناء عملية التعريب.'
                      : 'هوش مصنوعی متغیرهای بازی، تگ‌های کنترلی و کاراکترهای اسکیپ را به دقت تشخیص داده و بدون تغییر در ساختار جمله جای‌گذاری می‌کند.'}
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {uiLang === 'en' ? 'High-Performance Grid (+50,000 Rows)' : uiLang === 'ar' ? 'جدول فائق السرعة (+50,000 سطر)' : 'محیط مجازی‌سازی فوق‌سریع (+۵۰,۰۰۰ خط دیالوگ)'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {uiLang === 'en'
                      ? 'Powered by DOM Virtualization to scroll smoothly through massive RPG dialogue scripts without browser lag.'
                      : uiLang === 'ar'
                      ? 'تصفح وتعديل ملفات ألعاب الآربيجي الضخمة بسلاسة فائقة دون أي بطء في المتصفح.'
                      : 'فناوری رندرینگ مجازی به شما امکان می‌دهد متون حجیم بازی‌ها را بدون افت فریم و با جستجوی آنی ویرایش و مشاهده کنید.'}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: API & NETWORK */}
          {activeTab === 'api' && (
            <div className="space-y-3">
              
              {/* Point 1 */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {uiLang === 'en' ? 'Multi-Key Rotation & Auto-Failover' : uiLang === 'ar' ? 'التدوير التلقائي لمفاتيح API' : 'چرخش هوشمند چند کلید API (Multi-Key Failover)'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {uiLang === 'en'
                      ? 'Add multiple Gemini API keys (one per line) in the API Key modal. If one key hits Google quota limits (429), the app instantly fails over to the next key.'
                      : uiLang === 'ar'
                      ? 'أدخل عدة مفاتيح API (كل مفتاح في سطر). عند وصول أحد المفاتيح للحد الأقصى ينتقل النظام تلقائياً للمفتاح التالي دون توقف.'
                      : 'در پنجره کلید API می‌توانید چند کلید مجزا (هر کدام در یک خط) وارد کنید تا در صورت اتمام سهمیه کلید اول، سیستم بلافاصله از کلیدهای بعدی استفاده کند.'}
                  </p>
                </div>
              </div>

              {/* Point 2 */}
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {uiLang === 'en' ? 'Network & DNS Guidance' : uiLang === 'ar' ? 'إرشادات الشبكة والـ DNS' : 'راهنمای رفع خطای شبکه و اتصال در ایران'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {uiLang === 'en'
                      ? 'If Google Generative AI endpoints are restricted in your region, ensure your VPN is configured with TUN Mode or proper DNS resolving.'
                      : uiLang === 'ar'
                      ? 'في حال وجود قيود على خوادم جوجل، تأكد من استخدام اتصال شبكة مستقر أو VPN بنمط TUN.'
                      : 'در صورت بروز خطای اتصال به سرورهای جمینای، از VPN با قابلیت TUN Mode یا DNS ضدتحریم معتبر استفاده فرمایید.'}
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer & Community Bar */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Community Links */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href="https://t.me/MySaeedLab"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-xs font-bold transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>@MySaeedLab</span>
            </a>

            <a
              href="https://github.com/gguhfhu7-sketch/SubGame-Lab"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
