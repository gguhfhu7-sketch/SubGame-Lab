import React, { useState } from 'react';
import { SubtitleItem, SubtitleFormat, BilingualConfig, BilingualOrder, BilingualSeparator, BilingualWrap } from '../types';
import { UILanguage, TRANSLATIONS } from '../lib/i18n';
import { formatBilingualText, DEFAULT_BILINGUAL_CONFIG, wrapText, sanitizeTranslation } from '../lib/bilingualHelper';
import { 
  Languages, 
  X, 
  ArrowUpDown, 
  Palette, 
  Check, 
  Download, 
  Eye, 
  Sparkles,
  Sliders,
  Type,
  Maximize2,
  Tv,
  Wand2,
  CheckCircle2,
  Film,
  GraduationCap,
  Zap
} from 'lucide-react';

interface BilingualModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SubtitleItem[];
  bilingualConfig?: BilingualConfig;
  setBilingualConfig: (config: BilingualConfig) => void;
  onApplyToEditor: (config: BilingualConfig) => void;
  onExportBilingual: (config: BilingualConfig, format: SubtitleFormat) => void;
  targetFormat?: SubtitleFormat;
  uiLang: UILanguage;
}

const COLOR_OPTIONS = [
  { label: 'Yellow', hex: '#FFFF00', bg: 'bg-yellow-400', ring: 'ring-yellow-400/50' },
  { label: 'Cyan', hex: '#00FFFF', bg: 'bg-cyan-400', ring: 'ring-cyan-400/50' },
  { label: 'Mint', hex: '#00FF7F', bg: 'bg-emerald-400', ring: 'ring-emerald-400/50' },
  { label: 'Amber', hex: '#FFAA00', bg: 'bg-amber-400', ring: 'ring-amber-400/50' },
  { label: 'Lavender', hex: '#C084FC', bg: 'bg-purple-400', ring: 'ring-purple-400/50' },
  { label: 'White', hex: '#FFFFFF', bg: 'bg-white', ring: 'ring-white/50' },
  { label: 'Silver', hex: '#CBD5E1', bg: 'bg-slate-300', ring: 'ring-slate-400/50' },
];

export const BilingualModal: React.FC<BilingualModalProps> = ({
  isOpen,
  onClose,
  items = [],
  bilingualConfig,
  setBilingualConfig,
  onApplyToEditor,
  onExportBilingual,
  targetFormat = 'srt',
  uiLang,
}) => {
  const t = TRANSLATIONS[uiLang];

  const getSafeConfig = (cfg?: BilingualConfig): BilingualConfig => ({
    ...DEFAULT_BILINGUAL_CONFIG,
    ...(cfg || {}),
  });

  // Local draft config while editing in modal
  const [draftConfig, setDraftConfig] = useState<BilingualConfig>(() => getSafeConfig(bilingualConfig));
  const [selectedExportFormat, setSelectedExportFormat] = useState<SubtitleFormat>(targetFormat || 'srt');
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);

  // Sync draft config when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDraftConfig(getSafeConfig(bilingualConfig));
      setSelectedExportFormat(targetFormat || 'srt');
      setActiveSampleIndex(0);
    }
  }, [isOpen, bilingualConfig, targetFormat]);

  if (!isOpen) return null;

  // Filter sample candidates from real subtitle lines
  const validItems = items.filter((i) => i.originalText.trim() && i.translatedText.trim());
  const sampleItem = validItems.length > 0 ? validItems[activeSampleIndex % validItems.length] : null;

  const rawOriginal = sampleItem?.originalText || (uiLang === 'en' ? 'Never give up on what you really want to do.' : 'هرگز از آنچه واقعاً می‌خواهید انجام دهید دست نکشید.');
  const rawTranslated = sampleItem?.translatedText || (uiLang === 'en' ? 'هرگز از آنچه واقعاً می‌خواهید انجام دهید دست نکشید.' : 'Never give up on what you really want to do.');
  
  const sampleOriginal = rawOriginal;
  const sampleTranslated = sanitizeTranslation(rawOriginal, rawTranslated);

  // Quick Preset Handlers
  const applyPreset = (presetKey: 'cinema' | 'learner' | 'modern' | 'singleLine') => {
    switch (presetKey) {
      case 'cinema':
        setDraftConfig({
          ...draftConfig,
          enabled: true,
          order: 'original-top',
          separator: '\n',
          secondaryColor: '#FFFF00',
          secondarySizePercent: 85,
          wrapSecondary: 'none',
        });
        break;
      case 'learner':
        setDraftConfig({
          ...draftConfig,
          enabled: true,
          order: 'translated-top',
          separator: '\n',
          secondaryColor: '#00FFFF',
          secondarySizePercent: 75,
          wrapSecondary: 'parentheses',
        });
        break;
      case 'modern':
        setDraftConfig({
          ...draftConfig,
          enabled: true,
          order: 'original-top',
          separator: '\n',
          secondaryColor: '#00FF7F',
          secondarySizePercent: 85,
          wrapSecondary: 'none',
        });
        break;
      case 'singleLine':
        setDraftConfig({
          ...draftConfig,
          enabled: true,
          order: 'original-top',
          separator: ' | ',
          secondaryColor: '#FFAA00',
          secondarySizePercent: 85,
          wrapSecondary: 'none',
        });
        break;
    }
  };

  const handleApply = () => {
    setBilingualConfig({ ...draftConfig, enabled: true });
    onApplyToEditor({ ...draftConfig, enabled: true });
    onClose();
  };

  const handleExport = () => {
    onExportBilingual(draftConfig, selectedExportFormat);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="bg-slate-900 text-slate-100 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto transition-all ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {t.bilingualModalTitle}
                </h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all ${
                  draftConfig.enabled 
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {draftConfig.enabled ? (uiLang === 'en' ? 'Active' : 'فعال') : (uiLang === 'en' ? 'Disabled' : 'غیرفعال')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {t.bilingualModalDesc}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 flex flex-col gap-5 overflow-y-auto max-h-[calc(92vh-145px)] custom-scrollbar">
          
          {/* Master Enable & Status Card */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Tv className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>{uiLang === 'en' ? 'Enable Dual-Language Subtitles' : 'فعال‌سازی حالت دوزبانه (Dual-Language)'}</span>
                </div>
                <div className="text-[11px] text-purple-300/80 mt-0.5">
                  {uiLang === 'en' 
                    ? 'Render both original & translated lines simultaneously without altering original data'
                    : 'نمایش و خروجی همزمان خط اصلی و ترجمه بدون تخریب متن ترجمه شده'}
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={draftConfig.enabled}
                onChange={(e) => setDraftConfig({ ...draftConfig, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Quick Presets Bar */}
          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.bilingualPresets}:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('cinema')}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-yellow-500/40 text-left rtl:text-right transition-all flex flex-col gap-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-yellow-400 transition-colors flex items-center gap-1">
                    <Film className="w-3 h-3 text-yellow-400" />
                    <span>Cinema</span>
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-sm" />
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-1">
                  {uiLang === 'en' ? 'Original Top + Yellow' : 'اصلی بالا + ترجمه زرد'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('learner')}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 text-left rtl:text-right transition-all flex flex-col gap-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-cyan-400" />
                    <span>Learning</span>
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm" />
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-1">
                  {uiLang === 'en' ? 'Trans Top + (Original)' : 'ترجمه بالا + (اصلی)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('modern')}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 text-left rtl:text-right transition-all flex flex-col gap-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Modern</span>
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-1">
                  {uiLang === 'en' ? 'Mint Green 85%' : 'سبز فیروزه‌ای ۸۵٪'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('singleLine')}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-left rtl:text-right transition-all flex flex-col gap-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Single Line</span>
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" />
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-1">
                  {uiLang === 'en' ? 'Side-by-side ( | )' : 'تک‌خطی با جداکننده |'}
                </span>
              </button>
            </div>
          </div>

          {/* Cinematic Interactive Live Preview Screen */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 flex flex-col gap-3 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-purple-400 font-bold">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t.previewBilingual}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {sampleItem ? `[Line #${sampleItem.id}]` : '[Live Simulator]'}
                </span>
              </div>

              {validItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveSampleIndex((prev) => prev + 1)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                >
                  {uiLang === 'en' ? 'Next Sample ↻' : 'نمونه بعدی ↻'}
                </button>
              )}
            </div>

            {/* Simulated Cinematic Screen */}
            <div className="min-h-[120px] sm:min-h-[140px] flex items-center justify-center text-center p-4 rounded-xl bg-gradient-to-b from-slate-950 via-black to-slate-950 border border-slate-800/80 relative shadow-inner">
              {/* Subtle Cinema Glow and Safe Zone */}
              <div className="absolute inset-0 bg-radial from-purple-900/10 via-transparent to-transparent pointer-events-none" />
              
              <div className="flex flex-col items-center justify-center gap-2 max-w-xl z-10 px-2">
                {draftConfig.order === 'original-top' ? (
                  <>
                    <p className="text-xs sm:text-sm font-semibold text-white leading-snug drop-shadow-md">
                      {sampleOriginal}
                    </p>
                    {draftConfig.separator && draftConfig.separator !== '\n' && (
                      <span className="text-[11px] text-slate-400 font-bold px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800">
                        {draftConfig.separator}
                      </span>
                    )}
                    <p 
                      className="text-xs sm:text-sm font-semibold leading-snug transition-all drop-shadow-md"
                      style={{ 
                        color: draftConfig.secondaryColor || '#FFFF00',
                        fontSize: `${(13 * (draftConfig.secondarySizePercent || 85)) / 100}px`
                      }}
                    >
                      {wrapText(sampleTranslated, draftConfig.wrapSecondary || 'none')}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs sm:text-sm font-semibold text-white leading-snug drop-shadow-md">
                      {sampleTranslated}
                    </p>
                    {draftConfig.separator && draftConfig.separator !== '\n' && (
                      <span className="text-[11px] text-slate-400 font-bold px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800">
                        {draftConfig.separator}
                      </span>
                    )}
                    <p 
                      className="text-xs sm:text-sm font-semibold leading-snug transition-all drop-shadow-md"
                      style={{ 
                        color: draftConfig.secondaryColor || '#FFFF00',
                        fontSize: `${(13 * (draftConfig.secondarySizePercent || 85)) / 100}px`
                      }}
                    >
                      {wrapText(sampleOriginal, draftConfig.wrapSecondary || 'none')}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Setting Group 1: Stacking Order */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <ArrowUpDown className="w-4 h-4 text-purple-400" />
              <span>{t.bilingualOrder}:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDraftConfig({ ...draftConfig, order: 'original-top' })}
                className={`p-3 rounded-xl border text-xs font-bold text-left rtl:text-right flex items-center justify-between transition-all ${
                  draftConfig.order === 'original-top'
                    ? 'bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/30 text-purple-200 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🔼</span>
                  <div>
                    <div>{uiLang === 'en' ? 'Original on Top' : 'متن زبان اصلی بالا'}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{uiLang === 'en' ? 'Translation on Bottom' : 'متن ترجمه شده در پایین'}</div>
                  </div>
                </div>
                {draftConfig.order === 'original-top' && (
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setDraftConfig({ ...draftConfig, order: 'translated-top' })}
                className={`p-3 rounded-xl border text-xs font-bold text-left rtl:text-right flex items-center justify-between transition-all ${
                  draftConfig.order === 'translated-top'
                    ? 'bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/30 text-purple-200 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🔼</span>
                  <div>
                    <div>{uiLang === 'en' ? 'Translation on Top' : 'متن ترجمه شده بالا'}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{uiLang === 'en' ? 'Original on Bottom' : 'متن زبان اصلی در پایین'}</div>
                  </div>
                </div>
                {draftConfig.order === 'translated-top' && (
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Setting Group 2: Separator Between Lines */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>{t.bilingualSeparator}:</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: '\n', label: uiLang === 'en' ? 'New Line' : 'سطر جدید', badge: '↵' },
                { id: ' - ', label: uiLang === 'en' ? 'Dash' : 'خط تیره', badge: '-' },
                { id: ' / ', label: uiLang === 'en' ? 'Slash' : 'اسلش', badge: '/' },
                { id: ' | ', label: uiLang === 'en' ? 'Pipe' : 'خط عمودی', badge: '|' },
                { id: ' • ', label: uiLang === 'en' ? 'Bullet' : 'نقطه', badge: '•' },
              ].map((sep) => {
                const isSelected = draftConfig.separator === sep.id;
                return (
                  <button
                    key={sep.id}
                    type="button"
                    onClick={() => setDraftConfig({ ...draftConfig, separator: sep.id as BilingualSeparator })}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/30 text-indigo-200 font-bold shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold text-white">{sep.badge}</span>
                    <span className="text-[11px]">{sep.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Setting Group 3 & 4: Styling (Color, Scale, Wrap) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Secondary Text Color Swatches */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-pink-400" />
                <span>{t.secondaryColor}:</span>
              </label>

              <div className="grid grid-cols-4 gap-1.5">
                {COLOR_OPTIONS.map((col) => {
                  const isSelected = draftConfig.secondaryColor === col.hex;
                  return (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setDraftConfig({ ...draftConfig, secondaryColor: col.hex })}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'border-white bg-slate-800 ring-2 ring-purple-500 shadow-md'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      }`}
                      title={col.label}
                    >
                      <span className={`w-4 h-4 rounded-full border border-black/40 shadow-sm ${col.bg}`} />
                      <span className="text-[9px] text-slate-300 font-medium truncate w-full">{col.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Secondary Font Scale Ratio */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.secondarySize}:</span>
                </span>
                <span className="font-mono text-purple-400 font-bold text-xs">
                  {draftConfig.secondarySizePercent}%
                </span>
              </label>

              <div className="flex flex-col gap-1.5">
                {[
                  { size: 75, label: uiLang === 'en' ? '75% (Subtle / Compact)' : '۷۵٪ (کوچک و ظریف)' },
                  { size: 85, label: uiLang === 'en' ? '85% (Balanced Standard)' : '۸۵٪ (استاندارد متعادل)' },
                  { size: 100, label: uiLang === 'en' ? '100% (Equal Size)' : '۱۰۰٪ (هم‌اندازه کامل)' },
                ].map(({ size, label }) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setDraftConfig({ ...draftConfig, secondarySizePercent: size })}
                    className={`p-2 rounded-xl border text-xs font-semibold text-left rtl:text-right transition-all flex items-center justify-between ${
                      draftConfig.secondarySizePercent === size
                        ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/30 text-amber-200 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span>{label}</span>
                    {draftConfig.secondarySizePercent === size && (
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Wrap Secondary Text (Enclosure) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.wrapSecondary}:</span>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'none', label: t.wrapNone, sample: 'Text' },
                  { id: 'parentheses', label: t.wrapParentheses, sample: '(Text)' },
                  { id: 'brackets', label: t.wrapBrackets, sample: '[Text]' },
                  { id: 'curly', label: t.wrapCurly, sample: '{Text}' },
                ].map((wrap) => {
                  const isSelected = draftConfig.wrapSecondary === wrap.id;
                  return (
                    <button
                      key={wrap.id}
                      type="button"
                      onClick={() => setDraftConfig({ ...draftConfig, wrapSecondary: wrap.id as BilingualWrap })}
                      className={`p-2 rounded-xl border text-xs text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30 text-emerald-200 font-bold shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-mono text-[11px] font-bold text-white">{wrap.sample}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{wrap.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Footer Actions Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Format selector for direct export */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-400">
              {uiLang === 'en' ? 'Format:' : 'فرمت خروجی:'}
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(['srt', 'vtt', 'ass'] as SubtitleFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedExportFormat(fmt)}
                  className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg uppercase transition-all ${
                    selectedExportFormat === fmt
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  .{fmt}
                </button>
              ))}
            </div>

            {/* Direct Export Button */}
            <button
              type="button"
              onClick={handleExport}
              disabled={items.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all disabled:opacity-50"
              title={t.exportBilingualFile}
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.exportBilingualFile}</span>
            </button>
          </div>

          {/* Primary Action Button: Apply to Editor */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {t.close}
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={items.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.applyBilingualToEditor}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
