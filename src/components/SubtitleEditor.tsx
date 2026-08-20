import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SubtitleItem, BilingualConfig, AppMode } from '../types';
import { UILanguage, TRANSLATIONS } from '../lib/i18n';
import { SubtitleRowItem } from './SubtitleRowItem';
import { 
  Search, 
  Sparkles, 
  Layers, 
  Replace, 
  Eye, 
  Plus, 
  Languages, 
  Sliders, 
  Maximize2, 
  Minimize2, 
  X, 
  Zap, 
  ListOrdered, 
  Film, 
  Gamepad2, 
  Play, 
  Pause, 
  CheckCheck, 
  AlertCircle 
} from 'lucide-react';

interface SubtitleEditorProps {
  mode?: AppMode;
  items: SubtitleItem[];
  onItemChange: (id: number, translatedText: string) => void;
  onSourceItemChange?: (id: number, field: 'originalText' | 'startTime' | 'endTime', value: string) => void;
  onSingleLineTranslate: (id: number) => Promise<void>;
  onRetranslateModified?: () => Promise<void>;
  onVerifyQuality?: () => Promise<void>;
  isVerifyingQuality?: boolean;
  onDeleteItem: (id: number) => void;
  onAddNewLine?: () => void;
  onBatchReplace: (findText: string, replaceText: string) => void;
  onFillEmptyWithOriginal: () => void;
  onRepairCorruptedSubtitles?: () => void;
  uiLang: UILanguage;
  onOpenBilingualModal?: () => void;
  bilingualConfig?: BilingualConfig;
}

export const SubtitleEditor: React.FC<SubtitleEditorProps> = ({
  mode = 'cinema',
  items,
  onItemChange,
  onSourceItemChange,
  onSingleLineTranslate,
  onRetranslateModified,
  onVerifyQuality,
  isVerifyingQuality = false,
  onDeleteItem,
  onAddNewLine,
  onBatchReplace,
  onFillEmptyWithOriginal,
  onRepairCorruptedSubtitles,
  uiLang,
  onOpenBilingualModal,
  bilingualConfig,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'untranslated' | 'translated' | 'modified'>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [translatingLineId, setTranslatingLineId] = useState<number | null>(null);

  // Full-Screen / Expanded View State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Rendering Mode: 'virtual' (infinite virtualized scroll for 10,000+ items) vs 'paginated'
  const [renderMode, setRenderMode] = useState<'virtual' | 'paginated'>('virtual');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Find & Replace Modal state
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Row in-line preview toggle (clean by default)
  const [showRowBilingualPreview, setShowRowBilingualPreview] = useState(false);

  // Subtitle Player Simulator (Cinema mode only)
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);

  const t = TRANSLATIONS[uiLang];
  const isGameMode = mode === 'game';

  // Handle Escape key to close Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        searchQuery === '' ||
        item.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.translatedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.gameKey && item.gameKey.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.startTime.includes(searchQuery) ||
        item.id.toString() === searchQuery;

      if (!matchSearch) return false;

      if (filterMode === 'untranslated') return !item.translatedText.trim();
      if (filterMode === 'translated') return !!item.translatedText.trim();
      if (filterMode === 'modified') return !!item.sourceModified;
      return true;
    });
  }, [items, searchQuery, filterMode]);

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMode]);

  // Virtualizer parent ref
  const virtualListParentRef = useRef<HTMLDivElement>(null);

  // TanStack React Virtual for high-speed rendering
  const rowVirtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => virtualListParentRef.current,
    estimateSize: () => 145,
    overscan: 6,
  });

  // Paginated items fallback
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / (pageSize || 1)));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    if (pageSize === 0) return filteredItems;
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safeCurrentPage, pageSize]);

  // Handle single line re-translation
  const handleSingleTranslate = useCallback(async (id: number) => {
    setTranslatingLineId(id);
    try {
      await onSingleLineTranslate(id);
    } finally {
      setTranslatingLineId(null);
    }
  }, [onSingleLineTranslate]);

  const handleCopyLine = useCallback((id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleFindReplaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (findText.trim()) {
      onBatchReplace(findText, replaceText);
      setFindText('');
      setReplaceText('');
      setShowFindReplace(false);
    }
  };

  // Currently active subtitle line for simulator player
  const activeSimulatedItem = useMemo(() => {
    if (mode === 'game') return null;
    return items.find(
      (item) => currentTimeSec >= item.startSeconds && currentTimeSec <= item.endSeconds
    );
  }, [items, currentTimeSec, mode]);

  const maxDuration = items.length > 0 ? items[items.length - 1].endSeconds : 100;

  const getSearchPlaceholder = () => {
    if (isGameMode) {
      return uiLang === 'en' ? 'Search in Key, original text, or translation...' : 'جستجو در کلید (Key)، متن اصلی، یا ترجمه...';
    }
    return uiLang === 'en' ? 'Search in original, translation, line # or time...' : 'جستجو در متن اصلی، ترجمه، شماره یا زمان‌بندی...';
  };

  const modifiedCount = useMemo(() => items.filter((i) => i.sourceModified).length, [items]);
  const translatedCount = useMemo(() => items.filter((i) => i.translatedText.trim()).length, [items]);

  // Render Top Header Controls
  const renderHeaderControls = () => (
    <div className="flex flex-col gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      
      {/* Title + Mode Badge + Fullscreen Expand Button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          {isGameMode ? (
            <Gamepad2 className="w-5 h-5 text-purple-500" />
          ) : (
            <Film className="w-5 h-5 text-blue-500" />
          )}
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isGameMode ? t.gameStringsList : t.subtitlesList}
          </h3>
          <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
            isGameMode
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/25'
              : 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/25'
          }`}>
            {items.length} {t.linesCount}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {translatedCount} / {items.length} ({Math.round((translatedCount / (items.length || 1)) * 100)}%)
          </span>
        </div>

        {/* Global Action Tools & Fullscreen Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* View Mode Toggle: Virtualized vs Paginated */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setRenderMode('virtual')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                renderMode === 'virtual'
                  ? isGameMode
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Virtual Scroll (Instant rendering for 10,000+ items)"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Virtual Scroll</span>
            </button>
            <button
              type="button"
              onClick={() => setRenderMode('paginated')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                renderMode === 'paginated'
                  ? isGameMode
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Paginated View"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Paginated</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowFindReplace(!showFindReplace)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition-all"
            title={t.replaceWords}
          >
            <Replace className={`w-3.5 h-3.5 ${isGameMode ? 'text-purple-500' : 'text-blue-500'}`} />
            <span className="hidden sm:inline">{t.replaceWords}</span>
          </button>

          <button
            type="button"
            onClick={onFillEmptyWithOriginal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition-all"
            title={t.fillEmptyLines}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">{t.fillEmptyLines}</span>
          </button>

          {onRepairCorruptedSubtitles && mode === 'cinema' && (
            <button
              type="button"
              onClick={onRepairCorruptedSubtitles}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/40 border border-slate-300 dark:border-slate-700 rounded-xl transition-all"
              title={uiLang === 'en' ? 'Clean duplicate original lines in translations' : 'پاکسازی و تفکیک متن‌های تکراری اصلی در ترجمه'}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">{uiLang === 'en' ? 'Clean Duplicates' : 'پاکسازی تکراری‌ها'}</span>
            </button>
          )}

          {onVerifyQuality && (
            <button
              type="button"
              onClick={onVerifyQuality}
              disabled={isVerifyingQuality}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700/60 rounded-xl transition-all disabled:opacity-50"
              title={uiLang === 'en' ? 'AI Quality Audit' : 'ارزیابی کیفیت هوشمند'}
            >
              <Sparkles className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isVerifyingQuality ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isVerifyingQuality ? (uiLang === 'en' ? 'Auditing...' : 'در حال بررسی...') : (uiLang === 'en' ? 'Audit Quality' : 'بررسی کیفیت')}</span>
            </button>
          )}

          {onAddNewLine && (
            <button
              type="button"
              onClick={onAddNewLine}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                isGameMode
                  ? 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/80 border-purple-200 dark:border-purple-800'
                  : 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 border-blue-200 dark:border-blue-800'
              }`}
              title={mode === 'game' ? 'Add String' : 'Add Line'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{mode === 'game' ? (uiLang === 'en' ? 'Add String' : 'افزودن کلید') : (uiLang === 'en' ? 'Add Line' : 'افزودن سطر')}</span>
            </button>
          )}

          {/* Full-Screen Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all shadow-sm ${
              isFullscreen
                ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                : isGameMode
                ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500'
                : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500'
            }`}
            title={isFullscreen ? t.exitFullscreen : t.fullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? t.exitFullscreen : t.fullscreen}</span>
          </button>

        </div>
      </div>

      {/* Search Bar & Filter Buttons */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute ltr:right-3.5 rtl:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getSearchPlaceholder()}
            className={`w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-200 border rounded-xl px-4 py-2 text-xs focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
              isGameMode
                ? 'border-slate-300 dark:border-slate-800 focus:ring-2 focus:ring-purple-500'
                : 'border-slate-300 dark:border-slate-800 focus:ring-2 focus:ring-blue-500'
            }`}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              filterMode === 'all'
                ? isGameMode ? 'bg-purple-600 text-white font-bold shadow-sm' : 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {t.filterAll} ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('translated')}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              filterMode === 'translated'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {t.filterTranslated} ({translatedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('untranslated')}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              filterMode === 'untranslated'
                ? 'bg-amber-600 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {t.filterUntranslated} ({items.length - translatedCount})
          </button>
          {modifiedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterMode('modified')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === 'modified'
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {t.filterModified} ({modifiedCount})
            </button>
          )}
        </div>

      </div>

      {/* Find & Replace Bar */}
      {showFindReplace && (
        <form onSubmit={handleFindReplaceSubmit} className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-center gap-3 ${
          isGameMode ? 'bg-purple-950/20 border-purple-500/40' : 'bg-blue-950/20 border-blue-500/40'
        }`}>
          <input
            type="text"
            placeholder={uiLang === 'en' ? 'Word to find...' : 'کلمه مورد نظر برای یافتن...'}
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
          />
          <input
            type="text"
            placeholder={uiLang === 'en' ? 'Replacement word...' : 'کلمه جایگزین...'}
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className={`w-full sm:w-auto px-4 py-1.5 rounded-lg text-white text-xs font-bold shrink-0 transition-all ${
              isGameMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {t.applyReplace}
          </button>
        </form>
      )}

    </div>
  );

  // Render Rows List (Virtualized or Paginated)
  const renderRowsContent = (containerHeightClass: string) => (
    <div className="flex-1 flex flex-col min-h-0 relative">
      
      {/* Virtualization Info Strip */}
      {renderMode === 'virtual' && filteredItems.length > 0 && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pb-2 px-1">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>{t.virtualizedStats}</span>
          </span>
          <span className="font-mono text-[10px]">
            {uiLang === 'en' 
              ? `Rendering ~${rowVirtualizer.getVirtualItems().length} active rows of ${filteredItems.length}` 
              : `رندر هوشمند ${rowVirtualizer.getVirtualItems().length} سطر فعال از ${filteredItems.length}`}
          </span>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-xs">
          {uiLang === 'en' ? 'No items match your search or filter.' : 'هیچ موردی با فیلتر یا جستجوی فعلی یافت نشد.'}
        </div>
      ) : renderMode === 'virtual' ? (
        // Virtualized List Container
        <div
          ref={virtualListParentRef}
          className={`w-full overflow-y-auto pr-1 relative ${containerHeightClass}`}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = filteredItems[virtualRow.index];
              return (
                <div
                  key={item.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: '12px',
                  }}
                >
                  <SubtitleRowItem
                    item={item}
                    mode={mode}
                    uiLang={uiLang}
                    t={t}
                    isCurrentSimulated={
                      mode === 'cinema' &&
                      currentTimeSec >= item.startSeconds &&
                      currentTimeSec <= item.endSeconds
                    }
                    isTranslatingThisLine={translatingLineId === item.id}
                    isCopied={copiedId === item.id}
                    showRowBilingualPreview={showRowBilingualPreview}
                    bilingualConfig={bilingualConfig}
                    onItemChange={onItemChange}
                    onSourceItemChange={onSourceItemChange}
                    onSingleTranslate={handleSingleTranslate}
                    onCopyLine={handleCopyLine}
                    onDeleteItem={onDeleteItem}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Paginated List Container
        <div className={`flex flex-col gap-3 overflow-y-auto pr-1 ${containerHeightClass}`}>
          {paginatedItems.map((item) => (
            <SubtitleRowItem
              key={item.id}
              item={item}
              mode={mode}
              uiLang={uiLang}
              t={t}
              isCurrentSimulated={
                mode === 'cinema' &&
                currentTimeSec >= item.startSeconds &&
                currentTimeSec <= item.endSeconds
              }
              isTranslatingThisLine={translatingLineId === item.id}
              isCopied={copiedId === item.id}
              showRowBilingualPreview={showRowBilingualPreview}
              bilingualConfig={bilingualConfig}
              onItemChange={onItemChange}
              onSourceItemChange={onSourceItemChange}
              onSingleTranslate={handleSingleTranslate}
              onCopyLine={handleCopyLine}
              onDeleteItem={onDeleteItem}
            />
          ))}

          {/* Pagination Controls in Paginated Mode */}
          {pageSize > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs mt-2">
              <span className="text-slate-500 font-mono">
                {uiLang === 'en' ? `Page ${safeCurrentPage} of ${totalPages}` : `صفحه ${safeCurrentPage} از ${totalPages}`}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 disabled:opacity-40 text-slate-800 dark:text-slate-200 font-semibold"
                >
                  {uiLang === 'en' ? 'Previous' : 'قبلی'}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 disabled:opacity-40 text-slate-800 dark:text-slate-200 font-semibold"
                >
                  {uiLang === 'en' ? 'Next' : 'بعدی'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Normal Embedded Workspace View */}
      <div className={`w-full bg-white/95 dark:bg-slate-900/90 rounded-2xl border p-4 lg:p-6 shadow-md dark:shadow-2xl backdrop-blur-md flex flex-col gap-5 transition-all duration-300 ${
        isGameMode
          ? 'border-purple-500/25 dark:border-purple-500/35 shadow-purple-500/5'
          : 'border-blue-500/25 dark:border-blue-500/35 shadow-blue-500/5'
      }`}>
        {renderHeaderControls()}
        {renderRowsContent('max-h-[620px]')}
      </div>

      {/* Full-Screen Workspace Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl p-4 sm:p-6 flex flex-col gap-4 overflow-hidden animate-fade-in">
          
          {/* Top Bar for Full-Screen Mode */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              {isGameMode ? (
                <Gamepad2 className="w-6 h-6 text-purple-400" />
              ) : (
                <Film className="w-6 h-6 text-blue-400" />
              )}
              <h2 className="text-lg font-bold text-white">
                {isGameMode ? t.gameStringsList : t.subtitlesList} - {t.fullscreen}
              </h2>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                isGameMode
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              }`}>
                {items.length} {t.linesCount}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all shadow-md"
                title={t.exitFullscreen}
              >
                <Minimize2 className="w-4 h-4" />
                <span>{t.exitFullscreen} (ESC)</span>
              </button>
            </div>
          </div>

          {/* Controls */}
          {renderHeaderControls()}

          {/* Full-Screen Virtualized Rows (takes 100% remaining vertical space) */}
          <div className="flex-1 min-h-0 flex flex-col">
            {renderRowsContent('flex-1 min-h-0 h-full')}
          </div>

        </div>
      )}
    </>
  );
};
