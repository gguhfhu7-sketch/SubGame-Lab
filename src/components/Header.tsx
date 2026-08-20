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
  userApiKey,
  onExport,
  onReset,
  hasSubtitles,
  subtitleFormat,
  fileName,
  isTranslating = false,
  isFullyTranslated = false,
  completionPercentage = 0,
}) => {
  const t = TRANSLATIONS[uiLang];

  const getHelpBtnText = () => {
    if (uiLang === 'en') return 'Guide';
    if (uiLang === 'ar') return 'دليل';
    return 'راهنما';
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/95 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2.5 shadow-xs dark:shadow-md transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: Brand + Mode Switcher */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-sm p-0.5 border transition-all duration-300 shrink-0 ${
              mode === 'game'
                ? 'border-purple-500/50 shadow-purple-500/10'
                : 'border-blue-500/50 shadow-blue-500/10'
            }`}>
              <img
                src={SUBGAME_LAB_LOGO}
                alt="SubGame Lab Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {t.appTitle}
                </h1>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border hidden sm:inline-flex items-center gap-1 ${
                  mode === 'game'
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                }`}>
                  {mode === 'game' ? 'Game Mode' : 'Cinema Mode'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:block leading-tight">
                {mode === 'cinema' ? t.appSubtitle : t.modeGameDesc}
              </p>
            </div>
          </div>

          {/* Mode Switcher Segmented Control */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setMode('cinema')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'cinema'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={t.modeMovieTitle}
            >
              <Film className="w-3.5 h-3.5" />
              <span>{t.modeCinemaShort}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('game')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'game'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={t.modeGameTitle}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>{t.modeGameShort}</span>
            </button>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
          
          {/* Loaded File Badge */}
          {hasSubtitles && fileName && (
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span className="max-w-[120px] truncate font-medium">{fileName}</span>
              <span className="uppercase text-[9px] font-mono px-1 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-bold">
                {subtitleFormat}
              </span>
            </div>
          )}

          {/* Guide / Help Button */}
          {onOpenHelpModal && (
            <button
              onClick={onOpenHelpModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shrink-0"
              title={getHelpBtnText()}
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>{getHelpBtnText()}</span>
            </button>
          )}

          {/* Social Icons (Telegram & GitHub) in Compact Form */}
          <div className="flex items-center gap-1">
            <a
              href="https://t.me/MySaeedLab"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:border-sky-400 transition-all active:scale-95 shrink-0"
              title="SaeedLab Telegram Channel (@MySaeedLab)"
            >
              <Send className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://github.com/gguhfhu7-sketch/SubGame-Lab"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shrink-0"
              title="GitHub Repository"
            >
              <Github className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* UI Language Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shrink-0">
            <button
              onClick={() => setUiLang('fa')}
              className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors ${
                uiLang === 'fa' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="فارسی"
            >
              FA
            </button>
            <button
              onClick={() => setUiLang('en')}
              className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors ${
                uiLang === 'en' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => setUiLang('ar')}
              className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors ${
                uiLang === 'ar' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="العربية (Arabic)"
            >
              AR
            </button>
          </div>

          {/* API Key Modal Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all active:scale-95 shrink-0 ${
              userApiKey
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
            title={userApiKey ? t.customKeyActive : t.defaultKeyActive}
          >
            <Key className={`w-3.5 h-3.5 ${userApiKey ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`} />
            <span>{t.apiKey}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${userApiKey ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-400 dark:bg-slate-500'}`} />
          </button>

          {/* Reset File Button */}
          {hasSubtitles && (
            <button
              onClick={onReset}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-300 transition-all active:scale-95 shrink-0"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Export / Download Button */}
          {hasSubtitles && (
            <button
              onClick={onExport}
              disabled={isTranslating || !isFullyTranslated}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
                isTranslating
                  ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/60 cursor-wait'
                  : isFullyTranslated
                  ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-500/30 shadow-md active:scale-95'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-75'
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
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span>{completionPercentage}%</span>
                </>
              ) : !isFullyTranslated ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>{completionPercentage}%</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>{mode === 'game' ? t.downloadGameFiles : t.downloadSubtitle}</span>
                </>
              )}
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
            title={darkMode ? 'Light Theme' : 'Dark Theme'}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
          </button>

        </div>
      </div>
    </header>
  );
};
