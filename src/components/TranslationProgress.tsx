import React from 'react';
import { UILanguage, TRANSLATIONS } from '../lib/i18n';
import { Pause, Play, XCircle, Loader2 } from 'lucide-react';

interface TranslationProgressProps {
  currentBatch: number;
  totalBatches: number;
  translatedLines: number;
  totalLines: number;
  isPaused: boolean;
  onPauseToggle: () => void;
  onCancel: () => void;
  retryInfo?: { batch: number; attempt: number; maxRetries: number } | null;
  uiLang: UILanguage;
}

export const TranslationProgress: React.FC<TranslationProgressProps> = ({
  currentBatch,
  totalBatches,
  translatedLines,
  totalLines,
  isPaused,
  onPauseToggle,
  onCancel,
  retryInfo,
  uiLang,
}) => {
  const percentage = totalLines > 0 ? Math.min(100, Math.round((translatedLines / totalLines) * 100)) : 0;
  const t = TRANSLATIONS[uiLang];

  const getPausedNotice = () => {
    if (uiLang === 'en') return 'Translation paused. Click "Resume" to continue.';
    if (uiLang === 'ar') return 'تم إيقاف الترجمة مؤقتًا. انقر على "استئناف" للمتابعة.';
    return 'ترجمه به صورت موقت متوقف شده است. روی «ادامه» کلیک کنید.';
  };

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-indigo-500/40 p-5 shadow-2xl shadow-indigo-950/40 backdrop-blur-md flex flex-col gap-4">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
              <span>{t.translatingProgress}</span>
              <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                {percentage}%
              </span>
              {retryInfo && retryInfo.attempt > 1 && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                  {t.retryAttempt} {retryInfo.attempt}/{retryInfo.maxRetries}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.batch} <strong className="text-white font-mono">{currentBatch}</strong> {t.of} <strong className="text-white font-mono">{totalBatches}</strong> •{' '}
              <strong className="text-emerald-400 font-mono">{translatedLines}</strong> {t.of} <strong className="text-slate-300 font-mono">{totalLines}</strong> {t.linesCount}
            </p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={onPauseToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.resume}</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.pause}</span>
              </>
            )}
          </button>

          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>{t.cancel}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 p-0.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300 relative"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-shimmer" />
        </div>
      </div>

      {isPaused && (
        <div className="text-center text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 py-1.5 rounded-lg font-medium">
          {getPausedNotice()}
        </div>
      )}

    </div>
  );
};

