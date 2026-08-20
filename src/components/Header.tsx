import React from 'react';
import { SubtitleFormat, GameFormat, AppMode } from '../types';
import { UILanguage, TRANSLATIONS } from '../lib/i18n';
import { SUBGAME_LAB_LOGO } from '../assets/logo';
import { 
  Subtitles, 
  Download, 
  RotateCcw, 
  Sparkles, 
  Sun, 
  Moon, 
  FileText,
  Lock,
  Loader2,
  Key,
  Globe,
  HelpCircle,
  Languages,
  Film,
  Gamepad2,
  Send,
  Github
} from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  uiLang: UILanguage;
  setUiLang: (lang: UILanguage) => void;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  onOpenApiKeyModal: () => void;
  onOpenHelpModal?: () => void;
  onOpenBilingualModal?: () => void;
  userApiKey: string;
  onExport: () => void;
  onReset: () => void;
  hasSubtitles: boolean;
  subtitleFormat?: SubtitleFormat | GameFormat;
  fileName?: string;
  isTranslating?: boolean;
  isFullyTranslated?: boolean;
  completionPercentage?: number;
  translatedItemsCount?: number;
  totalItemsCount?: number;
  isBilingualActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  setDarkMode,
  uiLang,
  setUiLang,
  mode,
  setMode,
  onOpenApiKeyModal,
  onOpenHelpModal,
  onOpenBilingualModal,
  userApiKey,
  onExport,
  onReset,
  hasSubtitles,
  subtitleFormat,
  fileName,
  isTranslating = false,
  isFullyTranslated = false,
  completionPercentage = 0,
  translatedItemsCount = 0,
  totalItemsCount = 0,
  isBilingualActive = false,
}) => {

  const t = TRANSLATIONS[uiLang];

  const getHelpBtnText = () => {
    if (uiLang === 'en') return 'Help';
    if (uiLang === 'ar') return 'دليل';
    return 'راهنما';
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800/80 px-4 lg:px-8 py-3 shadow-md dark:shadow-xl transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        
        {/* Logo, Title & Mode Selector */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="relative group shrink-0">
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden shadow-lg p-0.5 border transition-all duration-300 ${
                mode === 'game'
                  ? 'border-purple-500/50 shadow-purple-500/20 group-hover:border-purple-400 group-hover:shadow-purple-500/40'
                  : 'border-blue-500/50 shadow-blue-500/20 group-hover:border-cyan-400 group-hover:shadow-cyan-500/40'
              }`}>
                <img
                  src={SUBGAME_LAB_LOGO}
                  alt="SubGame Lab Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-lg transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {t.appTitle}
                </h1>
                <span className={`hidden xl:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  mode === 'game'
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                }`}>
                  <Sparkles className="w-3 h-3" /> Gemini 3.6
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                {mode === 'cinema' ? t.appSubtitle : t.modeGameDesc}
              </p>
            </div>
          </div>

          {/* Mode Switcher Segmented Control */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMode('cinema')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'cinema'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={t.modeMovieTitle}
            >
              <Film className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.modeMovie}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('game')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'game'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={t.modeGameTitle}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.modeGame}</span>
            </button>
          </div>
        </div>

        {/* Current File Indicator (Desktop) */}
        {hasSubtitles && fileName && (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
            <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="max-w-[150px] truncate font-medium">{fileName}</span>
            <span className="uppercase text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold">
              {subtitleFormat}
            </span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap">
          
          {/* Help Button */}
          {onOpenHelpModal && (
            <button
              onClick={onOpenHelpModal}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all shadow-sm active:scale-95"
              title={getHelpBtnText()}
            >
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span className="hidden md:inline">{getHelpBtnText()}</span>
            </button>
          )}

          {/* Telegram Channel Button */}
          <a
            href="https://t.me/MySaeedLab"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 hover:border-sky-400 dark:hover:border-sky-400 shadow-sm transition-all active:scale-95 group"
            title="Join SaeedLab on Telegram (@MySaeedLab)"
          >
            <Send className="w-3.5 h-3.5 text-sky-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <span className="font-semibold font-sans tracking-wide">Telegram</span>
          </a>

          {/* GitHub Repository Button */}
          <a
            href="https://github.com/gguhfhu7-sketch/SubGame-Lab"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm transition-all active:scale-95 group"
            title="View SubGame-Lab on GitHub"
          >
            <Github className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform" />
            <span className="font-semibold font-sans tracking-wide">GitHub</span>
          </a>

          {/* UI Language Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
            <button
              onClick={() => setUiLang('fa')}
              className={`text-[11px] font-medium px-2 py-1 rounded-lg transition-colors ${
                uiLang === 'fa' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="فارسی"
            >
              FA
            </button>
            <button
              onClick={() => setUiLang('en')}
              className={`text-[11px] font-medium px-2 py-1 rounded-lg transition-colors ${
                uiLang === 'en' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => setUiLang('ar')}
              className={`text-[11px] font-medium px-2 py-1 rounded-lg transition-colors ${
                uiLang === 'ar' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="العربية"
            >
              AR
            </button>
          </div>

          {/* API Key BYOK Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all active:scale-95 ${
              userApiKey
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
            title={userApiKey ? t.customKeyActive : t.defaultKeyActive}
          >
            <Key className={`w-3.5 h-3.5 ${userApiKey ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`} />
            <span className="hidden md:inline">{t.apiKey}</span>
            <span className={`w-2 h-2 rounded-full ${userApiKey ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-500'}`} />
          </button>

          {/* Bilingual Subtitles Generator Button (Only for Cinema Mode) */}
          {mode === 'cinema' && onOpenBilingualModal && (
            <button
              onClick={onOpenBilingualModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all active:scale-95 shadow-sm ${
                isBilingualActive
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700/60 ring-2 ring-purple-500/20'
                  : 'bg-purple-50/50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
              }`}
              title={t.bilingualSubtitles}
            >
              <Languages className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="hidden md:inline">{t.bilingualSubtitles}</span>
              {isBilingualActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              )}
            </button>
          )}

          {/* Reset File Button */}
          {hasSubtitles && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 border border-slate-300 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800/50 rounded-xl transition-all active:scale-95"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400" />
            </button>
          )}

          {/* Export / Download Button */}
          {hasSubtitles && (
            <button
              onClick={onExport}
              disabled={isTranslating || !isFullyTranslated}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all shadow-sm ${
                isTranslating
                  ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/60 cursor-wait'
                  : isFullyTranslated
                  ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-500/30 shadow-lg shadow-emerald-900/30 active:scale-95'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 border border-slate-200 dark:border-slate-700/80 cursor-not-allowed opacity-80'
              }`}
              title={
                isTranslating
                  ? `${t.processing} (${completionPercentage}%)...`
                  : !isFullyTranslated
                  ? `${t.downloadDisabled} (${completionPercentage}%)`
                  : t.downloadSubtitle
              }
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span>{completionPercentage}%</span>
                </>
              ) : !isFullyTranslated ? (
                <>
                  <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                  <span>{completionPercentage}%</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>{mode === 'game' ? t.downloadGameFiles : t.downloadSubtitle}</span>
                </>
              )}
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors"
            title={darkMode ? 'Light Theme' : 'Dark Theme'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

        </div>
      </div>
    </header>
  );
};
