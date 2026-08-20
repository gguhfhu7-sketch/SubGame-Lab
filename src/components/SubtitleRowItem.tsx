import React from 'react';
import { SubtitleItem, BilingualConfig, AppMode } from '../types';
import { UILanguage, Translations } from '../lib/i18n';
import { wrapText, sanitizeTranslation } from '../lib/bilingualHelper';
import { extractGameVariables } from '../lib/gameLocalizationParser';
import { 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  Edit3, 
  Clock, 
  Trash2, 
  Languages, 
  KeyRound, 
  AlertTriangle 
} from 'lucide-react';

interface SubtitleRowItemProps {
  item: SubtitleItem;
  mode: AppMode;
  uiLang: UILanguage;
  t: Translations;
  isCurrentSimulated?: boolean;
  isTranslatingThisLine?: boolean;
  isCopied?: boolean;
  showRowBilingualPreview?: boolean;
  bilingualConfig?: BilingualConfig;
  onItemChange: (id: number, translatedText: string) => void;
  onSourceItemChange?: (id: number, field: 'originalText' | 'startTime' | 'endTime', value: string) => void;
  onSingleTranslate: (id: number) => void;
  onCopyLine: (id: number, text: string) => void;
  onDeleteItem: (id: number) => void;
}

export const SubtitleRowItem = React.memo<SubtitleRowItemProps>(({
  item,
  mode,
  uiLang,
  t,
  isCurrentSimulated = false,
  isTranslatingThisLine = false,
  isCopied = false,
  showRowBilingualPreview = false,
  bilingualConfig,
  onItemChange,
  onSourceItemChange,
  onSingleTranslate,
  onCopyLine,
  onDeleteItem,
}) => {
  const isGame = mode === 'game';
  const cleanTrans = sanitizeTranslation(item.originalText, item.translatedText) || item.translatedText;
  const isOrigTop = (bilingualConfig?.order || 'original-top') === 'original-top';
  const firstPreview = isOrigTop ? item.originalText : cleanTrans;
  const secondPreview = isOrigTop 
    ? wrapText(cleanTrans, bilingualConfig?.wrapSecondary || 'none')
    : wrapText(item.originalText, bilingualConfig?.wrapSecondary || 'none');

  // Game variables detection
  const gameVars = isGame ? extractGameVariables(item.originalText) : [];
  const missingVars = isGame && item.translatedText
    ? gameVars.filter((v) => !item.translatedText.includes(v))
    : [];

  return (
    <div
      id={`subtitle-row-${item.id}`}
      className={`p-3.5 rounded-xl border transition-all duration-150 flex flex-col gap-2.5 ${
        isCurrentSimulated
          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-500/60 ring-1 ring-blue-400/30 shadow-md'
          : item.sourceModified
          ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800/80'
          : isGame
          ? 'bg-slate-50/90 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-purple-500/30 dark:hover:border-purple-500/40'
          : 'bg-slate-50/90 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-blue-500/30 dark:hover:border-blue-500/40'
      }`}
    >
      {/* Main Row Content */}
      <div className="flex flex-col md:flex-row items-stretch gap-3">
        
        {/* Identifier / Timecode / Game Key Column */}
        <div className="flex md:flex-col items-center justify-between md:justify-center gap-2 border-b md:border-b-0 ltr:md:border-r rtl:md:border-l border-slate-200 dark:border-slate-800/80 pb-2 md:pb-0 ltr:md:pr-3 rtl:md:pl-3 shrink-0 min-w-[90px]">
          <div className="flex items-center gap-1">
            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${
              isGame
                ? 'text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/25'
                : 'text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/25'
            }`}>
              #{item.id}
            </span>
            {item.sourceModified && (
              <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                Mod
              </span>
            )}
          </div>

          {!isGame ? (
            <div className="flex flex-col gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={item.startTime}
                  onChange={(e) => onSourceItemChange && onSourceItemChange(item.id, 'startTime', e.target.value)}
                  className="bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none w-20 text-center text-[10px] text-slate-800 dark:text-slate-200"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">→</span>
                <input
                  type="text"
                  value={item.endTime}
                  onChange={(e) => onSourceItemChange && onSourceItemChange(item.id, 'endTime', e.target.value)}
                  className="bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none w-20 text-center text-[10px] text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          ) : (
            item.gameKey && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800 max-w-[120px] truncate" title={item.gameKey}>
                <KeyRound className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{item.gameKey}</span>
              </div>
            )
          )}
        </div>

        {/* Text Areas (Source and Translation) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
          
          {/* Source Text Box */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-semibold flex items-center justify-between">
              <span>{t.originalTextLabel}:</span>
              {gameVars.length > 0 && (
                <span className="text-[9px] text-purple-600 dark:text-purple-400 font-mono">
                  {gameVars.length} {uiLang === 'en' ? 'Variable(s)' : 'متغیر'}
                </span>
              )}
            </span>
            <textarea
              rows={2}
              value={item.originalText}
              onChange={(e) => onSourceItemChange && onSourceItemChange(item.id, 'originalText', e.target.value)}
              placeholder="..."
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed font-sans"
            />
          </div>

          {/* Translated Text Editor */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Edit3 className="w-2.5 h-2.5" />
                <span>{t.translatedTextLabel}:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {isTranslatingThisLine && (
                  <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    <span>Live</span>
                  </span>
                )}
                {item.translatedText.trim() && (
                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400/80 font-bold">{t.completedLine}</span>
                )}
              </div>
            </div>
            <textarea
              rows={2}
              value={item.translatedText}
              onChange={(e) => onItemChange(item.id, e.target.value)}
              placeholder="..."
              className={`w-full bg-white dark:bg-slate-900 border rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:outline-none resize-none leading-relaxed ${
                missingVars.length > 0
                  ? 'border-amber-400 dark:border-amber-500 focus:ring-amber-500'
                  : isGame
                  ? 'border-slate-300 dark:border-slate-800 focus:ring-purple-500'
                  : 'border-slate-300 dark:border-slate-800 focus:ring-blue-500'
              }`}
            />
            {missingVars.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>{uiLang === 'en' ? 'Missing variable(s):' : 'متغیرهای جاافتاده:'} {missingVars.join(', ')}</span>
              </div>
            )}
          </div>

        </div>

        {/* Action Controls */}
        <div className="flex md:flex-col items-center justify-end gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onSingleTranslate(item.id)}
            disabled={isTranslatingThisLine}
            className={`p-2 rounded-lg border transition-colors disabled:opacity-50 ${
              isGame
                ? 'bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
                : 'bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30'
            }`}
            title={t.retranslateLine}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isTranslatingThisLine ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onCopyLine(item.id, item.translatedText || item.originalText)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title={t.copyText}
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => onItemChange(item.id, item.originalText)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            title={t.restoreOriginal}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteItem(item.id)}
            className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors"
            title={t.deleteLine}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Optional In-line Dual-Language Output Strip (Cinema Mode) */}
      {!isGame && bilingualConfig?.enabled && showRowBilingualPreview && item.originalText.trim() && item.translatedText.trim() && (
        <div className="w-full mt-1 p-2.5 rounded-xl bg-black/90 text-center flex flex-col items-center justify-center gap-1 border border-slate-800/80 text-xs shadow-inner">
          <div className="flex items-center justify-between w-full text-[10px] text-purple-400 font-mono border-b border-slate-800/80 pb-1">
            <span className="flex items-center gap-1">
              <Languages className="w-3 h-3" />
              <span>{uiLang === 'en' ? 'Bilingual Output Preview' : 'پیش‌نمایش خروجی دوزبانه'}</span>
            </span>
            <span className="text-slate-500">
              {isOrigTop ? 'Original 🔼 | Translation 🔽' : 'Translation 🔼 | Original 🔽'}
            </span>
          </div>

          <p className="text-white font-medium leading-snug">{firstPreview}</p>
          {bilingualConfig.separator && bilingualConfig.separator !== '\n' && (
            <span className="text-[10px] text-slate-400 font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
              {bilingualConfig.separator}
            </span>
          )}
          <p
            className="font-medium leading-snug transition-all"
            style={{
              color: bilingualConfig.secondaryColor || '#FFFF00',
              fontSize: `${(12 * (bilingualConfig.secondarySizePercent || 85)) / 100}px`,
            }}
          >
            {secondPreview}
          </p>
        </div>
      )}
    </div>
  );
});

SubtitleRowItem.displayName = 'SubtitleRowItem';
