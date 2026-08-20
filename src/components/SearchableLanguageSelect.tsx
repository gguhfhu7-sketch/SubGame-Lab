import React, { useState, useRef, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';
import { UILanguage, TRANSLATIONS } from '../lib/i18n';
import { Search, ChevronDown, Check, Sparkles } from 'lucide-react';

interface SearchableLanguageSelectProps {
  value: string;
  onChange: (code: string) => void;
  label: string;
  includeAuto?: boolean;
  detectedLangText?: string;
  uiLang: UILanguage;
}

export const SearchableLanguageSelect: React.FC<SearchableLanguageSelectProps> = ({
  value,
  onChange,
  label,
  includeAuto = false,
  detectedLangText,
  uiLang,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[uiLang];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === value);

  const filteredLanguages = SUPPORTED_LANGUAGES.filter((lang) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      lang.nameFa.toLowerCase().includes(query) ||
      lang.nameEn.toLowerCase().includes(query) ||
      lang.code.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
        <span>{label}</span>
        {detectedLangText && (
          <span className="text-[11px] text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20 font-mono font-medium">
            {detectedLangText}
          </span>
        )}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
      >
        <div className="flex items-center gap-2 truncate">
          {value === 'auto' ? (
            <span className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>✨ {t.autoDetect}</span>
            </span>
          ) : selectedLangObj ? (
            <span className="flex items-center gap-2 font-medium">
              <span className="text-base">{selectedLangObj.flag}</span>
              <span>{uiLang === 'en' ? selectedLangObj.nameEn : selectedLangObj.nameFa}</span>
            </span>
          ) : (
            <span>{value}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-72 animate-slide-up transition-colors">
          
          {/* Search Box */}
          <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 sticky top-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchLanguagePlaceholder}
                autoFocus
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* List Items */}
          <div className="overflow-y-auto p-1 flex flex-col gap-0.5">
            {includeAuto && !searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onChange('auto');
                  setIsOpen(false);
                }}
                className={`w-full text-right px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                  value === 'auto'
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>✨ {t.autoDetect}</span>
                </span>
                {value === 'auto' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              </button>
            )}

            {filteredLanguages.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-['Vazirmatn']">
                {t.noLanguageFound}
              </div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = value === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      onChange(lang.code);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full text-right px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-base">{lang.flag}</span>
                      <span>{uiLang === 'en' ? lang.nameEn : lang.nameFa}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                );
              })
            )}
          </div>

        </div>
      )}
    </div>
  );
};
