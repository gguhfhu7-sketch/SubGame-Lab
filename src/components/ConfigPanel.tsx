import React, { useState } from 'react';
import { SubtitleFormat, GameFormat, ToneOption, AppMode, GameColumnMapping, BatchSizeOption } from '../types';
import { TONE_OPTIONS } from '../constants';
import { UILanguage, TRANSLATIONS } from '../lib/i18n';
import { SearchableLanguageSelect } from './SearchableLanguageSelect';
import { 
  Languages, 
  Sparkles, 
  MessageSquareQuote, 
  FileType, 
  Film, 
  MessageSquare, 
  BookOpen, 
  Smile, 
  GraduationCap, 
  Swords, 
  Wand2, 
  ArrowLeftRight,
  SlidersHorizontal,
  TableProperties,
  Gamepad2,
  FileCode2,
  Info,
  Cpu,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';

interface ConfigPanelProps {
  mode: AppMode;
  sourceLanguage: string;
  setSourceLanguage: (lang: string) => void;
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  selectedTone: ToneOption;
  setSelectedTone: (tone: ToneOption) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  targetFormat: SubtitleFormat | GameFormat;
  setTargetFormat: (fmt: any) => void;
  onStartTranslation: () => void;
  isTranslating: boolean;
  itemCount: number;
  detectedSourceLang?: string;
  uiLang: UILanguage;
  onOpenBilingualModal?: () => void;
  isBilingualActive?: boolean;
  // Game mode column mapping props
  gameColumns?: string[];
  gameMapping?: GameColumnMapping;
  setGameMapping?: (mapping: GameColumnMapping) => void;
  hasGameFile?: boolean;
  // Advanced Optimization & Localization settings
  batchSize?: BatchSizeOption;
  setBatchSize?: (size: BatchSizeOption) => void;
  skipCodeOnly?: boolean;
  setSkipCodeOnly?: (skip: boolean) => void;
  appendRTLMarkers?: boolean;
  setAppendRTLMarkers?: (append: boolean) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  mode,
  sourceLanguage,
  setSourceLanguage,
  targetLanguage,
  setTargetLanguage,
  selectedTone,
  setSelectedTone,
  customPrompt,
  setCustomPrompt,
  targetFormat,
  setTargetFormat,
  onStartTranslation,
  isTranslating,
  itemCount,
  detectedSourceLang,
  uiLang,
  onOpenBilingualModal,
  isBilingualActive = false,
  gameColumns,
  gameMapping,
  setGameMapping,
  hasGameFile = false,
  batchSize = 35,
  setBatchSize,
  skipCodeOnly = true,
  setSkipCodeOnly,
  appendRTLMarkers = true,
  setAppendRTLMarkers,
}) => {
  const t = TRANSLATIONS[uiLang];
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const isGameMode = mode === 'game';


  const getToneIcon = (iconName: string) => {
    switch (iconName) {
      case 'Film': return <Film className="w-4 h-4" />;
      case 'MessageSquare': return <MessageSquare className="w-4 h-4" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4" />;
      case 'Smile': return <Smile className="w-4 h-4" />;
      case 'GraduationCap': return <GraduationCap className="w-4 h-4" />;
      case 'Swords': return <Swords className="w-4 h-4" />;
      case 'Wand2': return <Wand2 className="w-4 h-4" />;
      default: return <MessageSquareQuote className="w-4 h-4" />;
    }
  };

  const getToneLabel = (toneId: ToneOption) => {
    switch (toneId) {
      case 'cinematic': return t.toneCinematic;
      case 'conversational': return t.toneConversational;
      case 'formal': return t.toneFormal;
      case 'humorous': return t.toneHumorous;
      case 'educational': return t.toneEducational;
      case 'epic': return t.toneEpic;
      case 'custom': return t.toneCustom;
      default: return toneId;
    }
  };

  const getToneDescription = (toneId: ToneOption) => {
    switch (toneId) {
      case 'cinematic': return t.toneDescCinematic;
      case 'conversational': return t.toneDescConversational;
      case 'formal': return t.toneDescFormal;
      case 'humorous': return t.toneDescHumorous;
      case 'educational': return t.toneDescEducational;
      case 'epic': return t.toneDescEpic;
      case 'custom': return t.toneDescCustom;
      default: return '';
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLanguage !== 'auto') {
      const prevSource = sourceLanguage;
      setSourceLanguage(targetLanguage);
      setTargetLanguage(prevSource);
    }
  };

  const applyCustomPreset = (presetText: string) => {
    setSelectedTone('custom');
    if (customPrompt.trim()) {
      setCustomPrompt(`${customPrompt}\n${presetText}`);
    } else {
      setCustomPrompt(presetText);
    }
  };

  return (
    <div className={`w-full bg-white/95 dark:bg-slate-900/90 rounded-2xl border p-5 lg:p-6 shadow-md dark:shadow-2xl backdrop-blur-md flex flex-col gap-6 transition-all duration-300 ${
      isGameMode
        ? 'border-purple-500/25 dark:border-purple-500/35 shadow-purple-500/5'
        : 'border-blue-500/25 dark:border-blue-500/35 shadow-blue-500/5'
    }`}>
      
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 flex-wrap">
        <div className="flex items-center gap-2">
          {mode === 'game' ? (
            <Gamepad2 className="w-5 h-5 text-purple-500" />
          ) : (
            <Film className="w-5 h-5 text-blue-500" />
          )}
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {mode === 'game' ? t.gameSettings : t.subtitleSettings}
          </h2>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
            mode === 'game' 
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25' 
              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25'
          }`}>
            {mode === 'game' ? 'Game Localization Engine' : 'Cinema Subtitle Engine'}
          </span>
        </div>

        {/* Bilingual Subtitle toggle (Cinema Mode only) */}
        {mode === 'cinema' && onOpenBilingualModal && (
          <button
            type="button"
            onClick={onOpenBilingualModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isBilingualActive
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700/60 ring-2 ring-purple-500/20 shadow-sm'
                : 'bg-slate-100 hover:bg-purple-50 dark:bg-slate-800 dark:hover:bg-purple-950/30 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>{t.bilingualSubtitles}</span>
            {isBilingualActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            )}
          </button>
        )}
      </div>

      {/* Language Selection Row */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-end gap-3">
        {/* Source Language */}
        <SearchableLanguageSelect
          value={sourceLanguage}
          onChange={setSourceLanguage}
          label={t.sourceLang}
          includeAuto={true}
          detectedLangText={detectedSourceLang ? `${uiLang === 'en' ? 'Auto:' : 'تشخیص:'} ${detectedSourceLang}` : undefined}
          uiLang={uiLang}
        />

        {/* Swap Button */}
        <div className="flex items-center justify-center pb-1">
          <button
            type="button"
            onClick={handleSwapLanguages}
            disabled={sourceLanguage === 'auto'}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition-colors"
            title={t.swapLanguages}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Target Language */}
        <SearchableLanguageSelect
          value={targetLanguage}
          onChange={setTargetLanguage}
          label={t.targetLang}
          includeAuto={false}
          uiLang={uiLang}
        />
      </div>

      {/* Game Column Mapping (Only for Game Mode with CSV/XLSX columns) */}
      {mode === 'game' && hasGameFile && gameColumns && gameColumns.length > 0 && gameMapping && setGameMapping && (
        <div className="bg-purple-500/5 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-500/20 dark:border-purple-500/30 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <TableProperties className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{t.gameMappingTitle}</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {uiLang === 'en' 
                ? 'Select the column to translate. All other columns remain untouched.' 
                : 'ستون متن جهت ترجمه را انتخاب کنید. تمامی ستون‌های دیگر دست‌نخورده حفظ می‌شوند.'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Source Column */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-500/30 shadow-xs">
              <label className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block mb-1 flex items-center justify-between">
                <span>{t.sourceColumn}</span>
                <span className="text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-mono">To Translate</span>
              </label>
              <select
                value={gameMapping.sourceColumn}
                onChange={(e) => setGameMapping({ ...gameMapping, sourceColumn: e.target.value })}
                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-purple-300 dark:border-purple-700/60 rounded-md p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {gameColumns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Target Column */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {t.targetColumn}
              </label>
              <select
                value={gameMapping.targetColumn}
                onChange={(e) => setGameMapping({ ...gameMapping, targetColumn: e.target.value })}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {gameColumns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
                {!gameColumns.includes(gameMapping.targetColumn) && (
                  <option value={gameMapping.targetColumn}>{gameMapping.targetColumn} (New Column)</option>
                )}
              </select>
            </div>

            {/* Key/ID Column */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {t.keyColumn}
              </label>
              <select
                value={gameMapping.keyColumn || ''}
                onChange={(e) => setGameMapping({ ...gameMapping, keyColumn: e.target.value || undefined })}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="">-- None / Auto Row ID --</option>
                {gameColumns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tone Selection Cards (Expanded with Epic + Custom) */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <MessageSquareQuote className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>{t.translationTone}:</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
          {TONE_OPTIONS.map((tone) => {
            const isSelected = selectedTone === tone.id;
            return (
              <div
                key={tone.id}
                onClick={() => setSelectedTone(tone.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between gap-2 relative overflow-hidden ${
                  isSelected
                    ? tone.id === 'epic'
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20 text-slate-900 dark:text-white shadow-md'
                      : tone.id === 'custom'
                      ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-500 ring-2 ring-purple-500/20 text-slate-900 dark:text-white shadow-md'
                      : 'bg-indigo-50 dark:bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900 dark:text-white shadow-md'
                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`p-1.5 rounded-lg ${
                    isSelected 
                      ? tone.id === 'epic' 
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        : tone.id === 'custom'
                        ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
                        : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {getToneIcon(tone.iconName)}
                  </span>
                  {isSelected && (
                    <span className={`w-2 h-2 rounded-full animate-pulse ${
                      tone.id === 'epic' ? 'bg-amber-500' : tone.id === 'custom' ? 'bg-purple-500' : 'bg-indigo-500'
                    }`} />
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {getToneLabel(tone.id)}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {getToneDescription(tone.id)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Prompt / Instructions Section (when Custom Tone is selected or toggled) */}
      {selectedTone === 'custom' && (
        <div className="bg-purple-50/70 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800/60 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{t.customPromptLabel}</span>
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {customPrompt.length} کاراکتر
            </span>
          </div>

          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={t.customPromptPlaceholder}
            rows={3}
            className="w-full text-xs bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/80 rounded-xl p-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-sans leading-relaxed"
          />

          {/* Quick Preset Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-500" />
              الگوهای سریع:
            </span>
            <button
              type="button"
              onClick={() => applyCustomPreset(t.customPromptPresetGlossary)}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/60 border border-purple-300 dark:border-purple-700/50 transition-colors"
            >
              {t.customPromptPresetGlossary}
            </button>
            <button
              type="button"
              onClick={() => applyCustomPreset(t.customPromptPresetRpg)}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/60 border border-amber-300 dark:border-amber-700/50 transition-colors"
            >
              {t.customPromptPresetRpg}
            </button>
            <button
              type="button"
              onClick={() => applyCustomPreset(t.customPromptPresetMilitary)}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors"
            >
              {t.customPromptPresetMilitary}
            </button>
            <button
              type="button"
              onClick={() => applyCustomPreset(t.customPromptPresetNoCensor)}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-800/60 border border-rose-300 dark:border-rose-700/50 transition-colors"
            >
              {t.customPromptPresetNoCensor}
            </button>
          </div>
        </div>
      )}

      {/* Advanced Performance & Localization Options Accordion */}
      <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${
        isGameMode
          ? 'bg-purple-950/10 dark:bg-purple-950/20 border-purple-500/20 dark:border-purple-500/30'
          : 'bg-blue-950/10 dark:bg-blue-950/20 border-blue-500/20 dark:border-blue-500/30'
      }`}>
        <button
          type="button"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        >
          <div className="flex items-center gap-2">
            <Cpu className={`w-4 h-4 ${isGameMode ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`} />
            <span className="text-slate-900 dark:text-white">
              {t.advancedGameOptions}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              isGameMode
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20'
            }`}>
              Batch: {batchSize} | {skipCodeOnly ? 'Auto-Skip ON' : 'Auto-Skip OFF'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-500">
            <span className="text-[11px] font-normal hidden sm:inline">
              {showAdvancedSettings ? (uiLang === 'en' ? 'Collapse' : 'بستن') : (uiLang === 'en' ? 'Expand settings' : 'نمایش تنظیمات')}
            </span>
            {showAdvancedSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showAdvancedSettings && (
          <div className="p-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-col gap-4">
            
            {/* Batch Size Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.batchSize}</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.batchSizeDesc}
                </p>
              </div>

              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-800 shrink-0">
                {([25, 35, 50, 100] as BatchSizeOption[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setBatchSize && setBatchSize(size)}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                      batchSize === size
                        ? isGameMode
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Skip Code-Only / Non-Text Rows Toggle */}
            <div className="flex items-start sm:items-center justify-between gap-3 p-2.5 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t.skipCodeOnly}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.skipCodeOnlyDesc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSkipCodeOnly && setSkipCodeOnly(!skipCodeOnly)}
                className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                  skipCodeOnly
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
                }`}
              >
                {skipCodeOnly ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </button>
            </div>

            {/* Append Hidden RTL Markers (\u200f) Toggle */}
            <div className="flex items-start sm:items-center justify-between gap-3 p-2.5 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t.appendRTLMarkers}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.appendRTLMarkersDesc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAppendRTLMarkers && setAppendRTLMarkers(!appendRTLMarkers)}
                className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                  appendRTLMarkers
                    ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
                }`}
              >
                {appendRTLMarkers ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Target Export Format & Start Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        {/* Export Format selector */}
        <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
          <FileType className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 font-semibold">
            {t.outputFormat}
          </span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {mode === 'cinema' ? (
              (['srt', 'vtt', 'ass', 'ssa', 'sub'] as SubtitleFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setTargetFormat(fmt)}
                  className={`uppercase text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg transition-colors ${
                    targetFormat === fmt
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  .{fmt}
                </button>
              ))
            ) : (
              (['csv', 'json', 'xlsx', 'txt'] as GameFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setTargetFormat(fmt)}
                  className={`uppercase text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg transition-colors ${
                    targetFormat === fmt
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  .{fmt}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Start Translation Button */}
        <button
          onClick={onStartTranslation}
          disabled={isTranslating || itemCount === 0}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 ${
            mode === 'game'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 border border-emerald-400/30 shadow-emerald-600/30'
              : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-indigo-400/30 shadow-indigo-600/30'
          }`}
        >
          <Sparkles className="w-4 h-4 animate-spin-slow" />
          <span>
            {isTranslating ? t.processing : `${t.startTranslation} ${itemCount > 0 ? `(${itemCount} ${t.linesCount})` : ''}`}
          </span>
        </button>
      </div>

    </div>
  );
};
