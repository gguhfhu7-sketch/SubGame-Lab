import React from 'react';
import { UILanguage, TRANSLATIONS } from '../lib/i18n';
import { AI_MODELS } from '../constants';
import { AIModelId } from '../types';
import { 
  X, 
  Sparkles, 
  Zap, 
  Radio, 
  BrainCircuit, 
  Flame, 
  CheckCircle2, 
  Gauge 
} from 'lucide-react';

interface ModelGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  selectedModel: AIModelId;
  onSelectModel: (modelId: AIModelId) => void;
}

export const ModelGuideModal: React.FC<ModelGuideModalProps> = ({
  isOpen,
  onClose,
  uiLang,
  selectedModel,
  onSelectModel,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[uiLang];

  const getModelIcon = (id: AIModelId) => {
    switch (id) {
      case 'gemini-live-stream':
        return <Radio className="w-5 h-5 text-rose-500 animate-pulse" />;
      case 'gemini-3.1-pro':
        return <BrainCircuit className="w-5 h-5 text-purple-500" />;
      case 'gemini-2.5-pro':
        return <Sparkles className="w-5 h-5 text-indigo-500" />;
      case 'gemini-2.5-flash':
        return <Flame className="w-5 h-5 text-blue-500" />;
      case 'gemini-3.6-flash':
      default:
        return <Zap className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getModelCategoryDetails = (id: AIModelId) => {
    switch (id) {
      case 'gemini-live-stream':
        return {
          categoryFa: 'پخش زنده و جریانی (Streaming)',
          categoryEn: 'Real-Time Streaming',
          categoryAr: 'البث المباشر الفوري',
          bestForFa: 'ترجمه زنده و آنی، مشاهده پیشرفت کلمه‌به‌کلمه و جلوگیری از تایم‌اوت در متون سنگین.',
          bestForEn: 'Live low-latency translations, progressive word-by-word streaming, zero blocking.',
          bestForAr: 'الترجمة الحية والفورية وتدفق النتائج كلمة بكلمة بدون انقطاع.',
          speed: 'فوق‌العاده سریع (Real-time)',
          reasoning: 'عالی برای زیرنویس و دیالوگ',
        };
      case 'gemini-3.1-pro':
      case 'gemini-2.5-pro':
        return {
          categoryFa: 'استدلال پیشرفته و محتوای عمیق (Deep Reasoning)',
          categoryEn: 'High-Reasoning & Complex Lore',
          categoryAr: 'استدلال متقدم ونصوص عميقة',
          bestForFa: 'متون سنگین فانتزی/گیمینگ، دیالوگ‌های داستانی، حفظ لحن‌های پیچیده و رعایت دقیق ساختارهای حساس بازی.',
          bestForEn: 'Heavy RPG fantasy lore, intricate narrative nuances, slang, and strict game code parsing.',
          bestForAr: 'نصوص ألعاب الآربيجي المعقدة، الحوارات الدرامية العميقة، وحماية تراكيب الأكواد الحساسة.',
          speed: 'متوسط تا استاندارد',
          reasoning: 'بالاترین سطح هوش و منطق',
        };
      case 'gemini-3.6-flash':
      case 'gemini-2.5-flash':
      default:
        return {
          categoryFa: 'سرعت بالا و بهینه‌سازی توکن (High Speed & Efficiency)',
          categoryEn: 'Speed & Cost Efficiency',
          categoryAr: 'سرعة فائقة واستهلاك أمثل',
          bestForFa: 'بهترین گزینه برای ترجمه حجیم و فوق‌العاده سریع زیرنویس‌های روزمره فیلم و سریال با مصرف بهینه API.',
          bestForEn: 'Best for large subtitle files, rapid turnarounds, and minimal API quota footprint.',
          bestForAr: 'الخيار الأفضل للترجمة السريعة لملفات الترجمة الضخمة مع استهلاك اقتصادي للـ API.',
          speed: 'بسیار سریع (Flash Engine)',
          reasoning: 'عالی و بهینه',
        };
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {t.modelGuideTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.modelGuideDesc}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800/60">
          {AI_MODELS.map((model) => {
            const isSelected = selectedModel === model.id;
            const meta = getModelCategoryDetails(model.id);
            const description = uiLang === 'en' 
              ? model.descriptionEn 
              : uiLang === 'ar' 
                ? model.descriptionAr 
                : model.descriptionFa;

            const bestForText = uiLang === 'en'
              ? meta.bestForEn
              : uiLang === 'ar'
                ? meta.bestForAr
                : meta.bestForFa;

            return (
              <div 
                key={model.id}
                className={`pt-3.5 first:pt-0 p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700/60 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
                onClick={() => {
                  onSelectModel(model.id);
                  onClose();
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getModelIcon(model.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {model.name}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${model.badgeColor}`}>
                          {model.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {model.id}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectModel(model.id);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all self-start sm:self-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{isSelected ? (uiLang === 'en' ? 'Active Model' : 'مدل فعال') : (uiLang === 'en' ? 'Select' : 'انتخاب')}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2.5">
                  {description}
                </p>

                {/* Best for & Characteristics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      {uiLang === 'en' ? '💡 Best for:' : '💡 کاربرد اصلی:'}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {bestForText}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400 sm:justify-end">
                    <span className="flex items-center gap-1 font-medium">
                      <Gauge className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{model.speed || meta.speed}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Google Gemini Flash & Pro Engine</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all active:scale-95"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
