import React, { useState, useEffect, useRef } from 'react';
import { 
  AppMode,
  SubtitleFormat, 
  GameFormat,
  SubtitleItem, 
  GameLocalizationItem,
  GameColumnMapping,
  ToneOption, 
  ToastMessage,
  BilingualConfig,
  BatchSizeOption,
  AIModelId,
  AIProvider,
  CustomProviderConfig,
  ModeSessionState
} from './types';
import { 
  createDefaultSession, 
  loadSessionFromDb, 
  saveSessionToDb, 
  debounceSaveSession, 
  clearSessionInDb,
  flushPendingSessionSaves
} from './lib/sessionStorageDb';
import { 
  parseSubtitleFile, 
  exportSubtitleFile, 
  detectEncodingAndDecode,
  fixRTLPunctuation,
  timestampToSeconds,
  secondsToSRT,
  RTL_LANGUAGES
} from './lib/subtitleParser';
import { 
  parseGameLocalizationFile,
  exportGameCSV,
  exportGameJSON,
  exportGameXLSX,
  exportGameTXT,
  isCodeOnlyOrSkippable,
  appendHiddenRTLMarker,
  stripHiddenRTLMarker,
  extractGameVariables
} from './lib/gameLocalizationParser';

import { 
  DEFAULT_BILINGUAL_CONFIG, 
  exportBilingualSubtitleFile, 
  repairCorruptedSubtitleItems 
} from './lib/bilingualHelper';
import { 
  SAMPLE_SRT_CONTENT, 
  SAMPLE_GAME_CSV_CONTENT, 
  SAMPLE_GAME_JSON_CONTENT,
  AI_MODELS 
} from './constants';
import { resolveModelId, DEFAULT_TRANSLATION_MODEL_ID } from './modelRegistry';
import { 
  getApiKeyArrayForHeader, 
  getActiveAiProvider, 
  setActiveAiProvider, 
  getStoredCustomProvider, 
  saveStoredCustomProvider 
} from './lib/apiKeyManager';
import { UILanguage, TRANSLATIONS } from './lib/i18n';
import { SUBGAME_LAB_LOGO } from './assets/logo';
import { Send, Sparkles, Github } from 'lucide-react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ConfigPanel } from './components/ConfigPanel';
import { TranslationProgress } from './components/TranslationProgress';
import { SubtitleEditor } from './components/SubtitleEditor';
import { VideoSubtitlePreview } from './components/VideoSubtitlePreview';
import { ApiKeyModal } from './components/ApiKeyModal';
import { BilingualModal } from './components/BilingualModal';
import { HelpModal } from './components/HelpModal';
import { ToastContainer } from './components/Toast';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  // Operational Mode: Cinema Subtitles vs Game Localization
  const [mode, setModeState] = useState<AppMode>(() => {
    return (localStorage.getItem('gemini_app_mode') as AppMode) || 'cinema';
  });

  // Sessions dictionary for mode isolation (Cinema Mode vs Game Mode)
  const sessionsRef = useRef<Record<AppMode, ModeSessionState>>({
    cinema: createDefaultSession('cinema'),
    game: createDefaultSession('game'),
  });
  const hasInitializedSessions = useRef<boolean>(false);

  // i18n & BYOK API Key State
  const [uiLang, setUiLang] = useState<UILanguage>(() => {
    return (localStorage.getItem('gemini_ui_lang') as UILanguage) || 'fa';
  });
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    const keys = getApiKeyArrayForHeader();
    return keys[0] || '';
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isBilingualModalOpen, setIsBilingualModalOpen] = useState(false);

  // Bilingual Subtitles Config State (Active in Cinema Mode)
  const [bilingualConfig, setBilingualConfig] = useState<BilingualConfig>(() => {
    try {
      const saved = localStorage.getItem('gemini_bilingual_config');
      if (saved) {
        return { ...DEFAULT_BILINGUAL_CONFIG, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_BILINGUAL_CONFIG;
  });

  const handleUpdateBilingualConfig = (config: BilingualConfig) => {
    setBilingualConfig(config);
    try {
      localStorage.setItem('gemini_bilingual_config', JSON.stringify(config));
    } catch {}
  };

  const t = TRANSLATIONS[uiLang];

  // Helper to generate API headers with multi-key support
  const getApiHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const keys = getApiKeyArrayForHeader();
    if (keys.length > 0) {
      headers['x-gemini-api-keys'] = JSON.stringify(keys);
      headers['x-gemini-api-key'] = keys[0];
      headers['Authorization'] = `Bearer ${keys[0]}`;
    }
    return headers;
  };

  // Sync document direction and language code on uiLang change
  useEffect(() => {
    localStorage.setItem('gemini_ui_lang', uiLang);
    document.documentElement.dir = uiLang === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = uiLang;
    document.title = 'SubGame Lab | AI Subtitle & Game Translator';
  }, [uiLang]);

  // File state
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [sourceFormat, setSourceFormat] = useState<SubtitleFormat | GameFormat>('srt');
  const [rawHeader, setRawHeader] = useState<string | undefined>(undefined);
  const [selectedEncoding, setSelectedEncoding] = useState<string>('auto');
  const [detectedEncoding, setDetectedEncoding] = useState<string>('');
  const [items, setItems] = useState<SubtitleItem[]>([]);

  // Game specific state
  const [gameColumns, setGameColumns] = useState<string[]>([]);
  const [gameMapping, setGameMapping] = useState<GameColumnMapping>({
    sourceColumn: 'Source',
    targetColumn: 'Translation',
    hasHeaders: true,
  });
  const [gameOriginalStructure, setGameOriginalStructure] = useState<any>(null);

  // Config options
  const [sourceLanguage, setSourceLanguage] = useState<string>('auto');
  const [detectedSourceLang, setDetectedSourceLang] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('fa');
  const [selectedTone, setSelectedTone] = useState<ToneOption>('cinematic');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [targetFormat, setTargetFormat] = useState<SubtitleFormat | GameFormat>('srt');

  // Advanced Optimization & Localization options
  const [serverHasKey, setServerHasKey] = useState<boolean>(false);
  const lastUploadedBufferRef = useRef<{ buffer: ArrayBuffer; name: string; size: number } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data?.hasServerKey) {
          setServerHasKey(true);
        }
      })
      .catch(() => {});
  }, []);

  const [selectedModel, setSelectedModel] = useState<AIModelId>(() => {
    const saved = localStorage.getItem('subgamelab_selected_model');
    if (saved) {
      return resolveModelId(saved) as AIModelId;
    }
    return DEFAULT_TRANSLATION_MODEL_ID as AIModelId;
  });
  const [activeRunningModel, setActiveRunningModel] = useState<string | undefined>(undefined);
  const [isFallbackActive, setIsFallbackActive] = useState<boolean>(false);

  // Active AI Provider: 'gemini' (default) or 'custom' (BYOK)
  const [activeAiProvider, setActiveAiProviderState] = useState<AIProvider>(() => getActiveAiProvider());
  const [customProviderConfig, setCustomProviderConfig] = useState<CustomProviderConfig>(() => getStoredCustomProvider());

  const handleProviderChange = (provider: AIProvider) => {
    setActiveAiProviderState(provider);
    setActiveAiProvider(provider);
  };

  const handleSaveCustomConfig = (cfg: CustomProviderConfig) => {
    setCustomProviderConfig(cfg);
    saveStoredCustomProvider(cfg);
  };

  const [batchSize, setBatchSize] = useState<BatchSizeOption>(() => {
    const saved = localStorage.getItem('subgamelab_custom_batch_size');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 35;
  });

  const handleSetBatchSize = (size: BatchSizeOption) => {
    setBatchSize(size);
    localStorage.setItem('subgamelab_custom_batch_size', String(size));
  };

  const [skipCodeOnly, setSkipCodeOnly] = useState<boolean>(true);
  const [appendRTLMarkers, setAppendRTLMarkers] = useState<boolean>(true);
  const [rateLimitPacing, setRateLimitPacing] = useState<boolean>(() => {
    const saved = localStorage.getItem('subgamelab_rate_limit_pacing');
    return saved !== null ? saved === 'true' : true;
  });
  const [pacingRemainingSec, setPacingRemainingSec] = useState<number | null>(null);

  const handleToggleRateLimitPacing = (val: boolean) => {
    setRateLimitPacing(val);
    localStorage.setItem('subgamelab_rate_limit_pacing', String(val));
  };

  // Model switch handler (pure model selection without overriding custom batch size)
  const handleSelectModel = (modelId: AIModelId) => {
    setSelectedModel(modelId);
    localStorage.setItem('subgamelab_selected_model', modelId);
  };

  // Translation execution state
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentBatch, setCurrentBatch] = useState<number>(0);
  const [totalBatches, setTotalBatches] = useState<number>(0);
  const [translatedCount, setTranslatedCount] = useState<number>(0);
  const [retryInfo, setRetryInfo] = useState<{ batch: number; attempt: number; maxRetries: number } | null>(null);

  // Modals & Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Calculate overall translation completion stats
  const translatedItemsCount = items.filter((item) => item.translatedText && item.translatedText.trim().length > 0).length;
  const totalItemsCount = items.length;
  const isFullyTranslated = totalItemsCount > 0 && translatedItemsCount === totalItemsCount;
  const completionPercentage = totalItemsCount > 0 ? Math.round((translatedItemsCount / totalItemsCount) * 100) : 0;

  const cancelTranslationRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const activeJobIdRef = useRef<string>('');
  const isTranslatingRef = useRef<boolean>(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Toast Helper
  // FIX (L4): dedupe previously compared message text only, so two DIFFERENT events with the
  // same text (e.g. two consecutive batches failing with an identical provider message) were
  // collapsed into one toast and the user lost the real severity. Dedupe is now limited to a
  // 700ms window — rapid accidental duplicates are still suppressed, but distinct events stack.
  const lastToastRef = useRef<{ message: string; type: string; ts: number }>({ message: '', type: '', ts: 0 });
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const now = Date.now();
    const isRapidDuplicate = lastToastRef.current.message === message && lastToastRef.current.type === type && (now - lastToastRef.current.ts) < 700;
    lastToastRef.current = { message, type, ts: now };
    if (isRapidDuplicate) return;

    setToasts((prev) => {
      const id = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6);
      return [...prev, { id, message, type }];
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.message !== message || t.type !== type));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // FIX (B18): flush every pending per-mode autosave when the tab hides/closes — a quick mode
  // switch + instant browser close can no longer swallow the last 1.2s of edits.
  useEffect(() => {
    const onPageHide = () => flushPendingSessionSaves();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushPendingSessionSaves();
    };
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // Helper to apply isolated mode session to local state
  const applySessionState = (s: ModeSessionState) => {
    setFileName(s.fileName || '');
    setFileSize(s.fileSize || 0);
    setSourceFormat(s.sourceFormat);
    setTargetFormat(s.targetFormat);
    setRawHeader(s.rawHeader);
    setSelectedEncoding(s.selectedEncoding || 'auto');
    setDetectedEncoding(s.detectedEncoding || '');
    setItems(s.items || []);
    setGameColumns(s.gameColumns || []);
    setGameMapping(s.gameMapping || { sourceColumn: 'Source', targetColumn: 'Translation', hasHeaders: true });
    setGameOriginalStructure(s.gameOriginalStructure || null);
    setSourceLanguage(s.sourceLanguage || 'auto');
    setDetectedSourceLang(s.detectedSourceLang || '');
    setTargetLanguage(s.targetLanguage || 'fa');
    setSelectedTone(s.selectedTone);
    setCustomPrompt(s.customPrompt || '');
    setIsTranslating(false);
    setIsPaused(false);
    setCurrentBatch(s.currentBatch || 0);
    setTotalBatches(s.totalBatches || 0);
    setTranslatedCount(s.translatedCount || 0);
    lastUploadedBufferRef.current = s.lastUploadedBuffer || null;
  };

  // Mode Switcher with Strict Context & State Isolation (Finding 02B)
  const setMode = (newMode: AppMode) => {
    if (newMode === mode) return;

    // 1. Snapshot and persist current active mode state
    const currentSnapshot: ModeSessionState = {
      fileName,
      fileSize,
      sourceFormat,
      targetFormat,
      rawHeader,
      selectedEncoding,
      detectedEncoding,
      items,
      gameColumns,
      gameMapping,
      gameOriginalStructure,
      sourceLanguage,
      detectedSourceLang,
      targetLanguage,
      selectedTone,
      customPrompt,
      isTranslating: false,
      isPaused: false,
      currentBatch,
      totalBatches,
      translatedCount,
      lastUploadedBuffer: lastUploadedBufferRef.current,
    };
    sessionsRef.current[mode] = currentSnapshot;
    saveSessionToDb(mode, currentSnapshot);

    // 2. Stop ongoing translation if user switches mode
    if (isTranslating) {
      cancelTranslationRef.current = true;
      // FIX (Cancellation): also abort the in-flight request so the server-side upstream call stops too
      if (activeAbortControllerRef.current) {
        try { activeAbortControllerRef.current.abort(); } catch {}
        activeAbortControllerRef.current = null;
      }
      setIsTranslating(false);
      setIsPaused(false);
    }

    // 3. Switch mode
    setModeState(newMode);
    localStorage.setItem('gemini_app_mode', newMode);

    // 4. Restore target mode session
    const targetSession = sessionsRef.current[newMode] || createDefaultSession(newMode);
    applySessionState(targetSession);

    showToast(
      newMode === 'game'
        ? (uiLang === 'en' ? 'Switched to Game Localization Mode' : 'حالت بومی‌سازی بازی فعال شد')
        : (uiLang === 'en' ? 'Switched to Cinema Subtitle Mode' : 'حالت زیرنویس سینما فعال شد'),
      'info'
    );
  };

  // Load isolated sessions from IndexedDB on startup
  useEffect(() => {
    let isMounted = true;
    async function initSessions() {
      const [savedCinema, savedGame] = await Promise.all([
        loadSessionFromDb('cinema'),
        loadSessionFromDb('game'),
      ]);
      if (!isMounted) return;
      if (savedCinema) {
        sessionsRef.current.cinema = { ...createDefaultSession('cinema'), ...savedCinema };
      }
      if (savedGame) {
        sessionsRef.current.game = { ...createDefaultSession('game'), ...savedGame };
      }
      hasInitializedSessions.current = true;
      const activeSession = sessionsRef.current[mode];
      if (activeSession && (activeSession.items.length > 0 || activeSession.fileName)) {
        applySessionState(activeSession);
      }
    }
    initSessions();
    return () => { isMounted = false; };
  }, []);

  // Auto-save session debounced when items or parameters change
  useEffect(() => {
    if (!hasInitializedSessions.current) return;
    const currentSnapshot: ModeSessionState = {
      fileName,
      fileSize,
      sourceFormat,
      targetFormat,
      rawHeader,
      selectedEncoding,
      detectedEncoding,
      items,
      gameColumns,
      gameMapping,
      gameOriginalStructure,
      sourceLanguage,
      detectedSourceLang,
      targetLanguage,
      selectedTone,
      customPrompt,
      isTranslating,
      isPaused,
      currentBatch,
      totalBatches,
      translatedCount,
      lastUploadedBuffer: lastUploadedBufferRef.current,
    };
    sessionsRef.current[mode] = currentSnapshot;
    debounceSaveSession(mode, currentSnapshot);
  }, [
    items, fileName, fileSize, sourceFormat, targetFormat, rawHeader,
    selectedEncoding, detectedEncoding, gameColumns, gameMapping,
    gameOriginalStructure, sourceLanguage, detectedSourceLang, targetLanguage,
    selectedTone, customPrompt, isTranslating, isPaused, currentBatch,
    totalBatches, translatedCount, mode
  ]);

  // Column Mapping Change Handler for Game/CSV Localization
  const handleGameMappingChange = (newMapping: GameColumnMapping) => {
    setGameMapping(newMapping);

    if (items.length > 0 && newMapping.sourceColumn) {
      setItems((prevItems) =>
        prevItems.map((item, idx) => {
          if (!item.rawRowData) return item;
          const newOriginal = String(item.rawRowData[newMapping.sourceColumn] ?? '').trim();
          const newKey = newMapping.keyColumn && item.rawRowData[newMapping.keyColumn]
            ? String(item.rawRowData[newMapping.keyColumn]).trim()
            : (item.gameKey || `ROW_${idx + 1}`);
          const newContext = newMapping.contextColumn && item.rawRowData[newMapping.contextColumn]
            ? String(item.rawRowData[newMapping.contextColumn]).trim()
            : item.context;
          const existingTranslated = newMapping.targetColumn && item.rawRowData[newMapping.targetColumn] !== undefined
            ? String(item.rawRowData[newMapping.targetColumn]).trim()
            : item.translatedText;

          return {
            ...item,
            originalText: newOriginal,
            translatedText: existingTranslated,
            gameKey: newKey,
            context: newContext,
            variables: extractGameVariables(newOriginal),
          };
        })
      );
    }
  };

  // Process File Buffer for Cinema & Game Modes
  const processBufferData = async (
    buffer: ArrayBuffer,
    name: string,
    size: number,
    currentAppMode = mode,
    forcedEncoding = selectedEncoding
  ) => {
    lastUploadedBufferRef.current = { buffer, name, size };
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const isGameFile = currentAppMode === 'game' || ['csv', 'json', 'xlsx'].includes(ext);

    setFileName(name);
    setFileSize(size);

    if (isGameFile) {
      if (mode !== 'game') {
        setMode('game');
      }
      try {
        const parsedGame = await parseGameLocalizationFile(buffer, name, forcedEncoding);
        const unifiedItems: SubtitleItem[] = parsedGame.items.map((gItem, idx) => ({
          id: gItem.id || idx + 1,
          startTime: `00:00:00,000`,
          endTime: `00:00:05,000`,
          startSeconds: idx * 5,
          endSeconds: (idx + 1) * 5,
          originalText: gItem.originalText,
          translatedText: gItem.translatedText || '',
          gameKey: gItem.key,
          context: gItem.context,
          variables: gItem.variables,
          rawRowData: gItem.rawRowData,
        }));

        setItems(unifiedItems);
        setSourceFormat(parsedGame.format);
        setTargetFormat(parsedGame.format);
        setGameColumns(parsedGame.columns || []);
        if (parsedGame.suggestedMapping) {
          setGameMapping(parsedGame.suggestedMapping);
        }
        setGameOriginalStructure(parsedGame.originalRawStructure);
        setDetectedEncoding(forcedEncoding && forcedEncoding !== 'auto' ? forcedEncoding : 'UTF-8');

        showToast(`${t.newFileLoaded} (${unifiedItems.length} ${t.linesCount})`, 'success');
        // FIX (B13/B16): surface parser warnings (orphan SRT blocks, salvaged ASS events, ...)
        const gameWarnings = (parsedGame as any).warnings as string[] | undefined;
        if (gameWarnings && gameWarnings.length > 0) {
          gameWarnings.forEach((w) => showToast(w, 'warning'));
        }
        detectLanguageOnLoad(unifiedItems);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Error parsing game localization file', 'error');
      }
    } else {
      // Cinema Subtitle Mode
      const { text, encoding } = detectEncodingAndDecode(buffer, forcedEncoding);
      setDetectedEncoding(encoding);

      try {
        const parsed = parseSubtitleFile(text, name);
        setItems(parsed.items);
        setSourceFormat(parsed.format);
        setTargetFormat(parsed.format);
        setRawHeader(parsed.rawHeader);
        // FIX (L8): remember the MicroDVD FPS detected in the source header for export
        subFpsRef.current = (parsed as any).subFps || 25;

        showToast(`${t.newFileLoaded} (${parsed.items.length} ${t.linesCount})`, 'success');
        // FIX (B13/B16): surface parser warnings (orphan blocks, salvaged ASS events, ...)
        const parseWarnings = (parsed as any).warnings as string[] | undefined;
        if (parseWarnings && parseWarnings.length > 0) {
          parseWarnings.forEach((w) => showToast(w, 'warning'));
        }
        detectLanguageOnLoad(parsed.items);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : t.fileParseError, 'error');
      }
    }
  };

  // FIX (L8): FPS of the currently loaded MicroDVD file (default 25)
  const subFpsRef = useRef<number>(25);

  // FIX (B7): switching the encoding used to silently RE-PARSE the file and wipe every
  // translation. Now translations survive: after re-parse, previously translated text is
  // re-attached by logical identity (game key for game files, start time for subtitles),
  // and the pre-reload state is flushed to IndexedDB first as an extra safety net.
  const handleEncodingChange = (newEncoding: string) => {
    setSelectedEncoding(newEncoding);
    if (lastUploadedBufferRef.current) {
      // Safety net 1: persist the CURRENT session (with translations) before re-parsing
      try { flushPendingSessionSaves(); } catch {}

      const previousItems = items;
      const hadTranslations = previousItems.some((it) => it.translatedText && it.translatedText.trim());

      processBufferData(
        lastUploadedBufferRef.current.buffer,
        lastUploadedBufferRef.current.name,
        lastUploadedBufferRef.current.size,
        mode,
        newEncoding
      );

      // Safety net 2: re-attach translations onto the freshly parsed items.
      // processBufferData updates state asynchronously via setItems — we hook into the same
      // updater flow by scheduling our merge AFTER its state update with a functional update.
      if (hadTranslations) {
        setTimeout(() => {
          setItems((freshItems) => {
            if (!freshItems.length || !previousItems.length) return freshItems;
            const isGameCtx = mode === 'game' || ['csv', 'json', 'xlsx', 'txt'].includes(String(lastUploadedBufferRef.current?.name || '').split('.').pop() || '');
            const translationByKey = new Map<string, string>();
            previousItems.forEach((it) => {
              if (!it.translatedText || !it.translatedText.trim()) return;
              const identity = isGameCtx
                ? (it.gameKey || it.context || it.originalText)
                : `${Math.round((it.startSeconds || 0) * 10)}|${it.originalText.slice(0, 40)}`;
              if (!translationByKey.has(identity)) {
                translationByKey.set(identity, it.translatedText);
              }
            });
            let restored = 0;
            const merged = freshItems.map((it) => {
              if (it.translatedText && it.translatedText.trim()) return it; // already has a value
              const identity = isGameCtx
                ? (it.gameKey || it.context || it.originalText)
                : `${Math.round((it.startSeconds || 0) * 10)}|${it.originalText.slice(0, 40)}`;
              const saved = translationByKey.get(identity);
              if (saved) { restored++; return { ...it, translatedText: saved }; }
              return it;
            });
            if (restored > 0) {
              showToast(
                uiLang === 'en'
                  ? `Encoding switched — ${restored} existing translation(s) were preserved.`
                  : `رمزگذاری تغییر کرد — ${restored} ترجمهٔ قبلی حفظ شد.`,
                'success'
              );
            }
            return merged;
          });
        }, 50);
      }

      showToast(
        uiLang === 'en'
          ? `File reloaded using encoding: ${newEncoding}`
          : `فایل با رمزگذاری ${newEncoding} مجدداً بارگذاری شد.`,
        'info'
      );
    }
  };

  // Listen to file upload events
  useEffect(() => {
    const handleProcessBuffer = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { buffer, fileName: name, fileSize: size, mode: eventMode } = customEvent.detail;
      if (!buffer) return;
      processBufferData(buffer, name || 'file', size || 0, eventMode || mode, selectedEncoding);
    };

    window.addEventListener('processBuffer', handleProcessBuffer);
    return () => window.removeEventListener('processBuffer', handleProcessBuffer);
  }, [uiLang, t, mode, selectedEncoding]);

  // Sample Load Handlers
  const handleLoadSubtitleSample = () => {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(SAMPLE_SRT_CONTENT).buffer;
    processBufferData(buffer, 'Sample_Movie_Subtitles.srt', buffer.byteLength, 'cinema');
  };

  const handleLoadGameSample = (type: 'csv' | 'json') => {
    const encoder = new TextEncoder();
    if (type === 'csv') {
      const buffer = encoder.encode(SAMPLE_GAME_CSV_CONTENT).buffer;
      processBufferData(buffer, 'RPG_Quest_Dialogues.csv', buffer.byteLength, 'game');
    } else {
      const buffer = encoder.encode(SAMPLE_GAME_JSON_CONTENT).buffer;
      processBufferData(buffer, 'Game_Localization_Strings.json', buffer.byteLength, 'game');
    }
  };

  // FIX (L9): language detection used to fire a paid Gemini request on EVERY file load.
  // Results are now cached per (file name + size + sample hash) so re-loading or switching
  // between the same files no longer spends quota, and the detection request is skipped
  // entirely when neither a user key nor a server key is available.
  const detectLanguageOnLoad = async (loadedItems: SubtitleItem[]) => {
    if (loadedItems.length === 0) return;
    const sampleText = loadedItems.slice(0, 5).map((i) => i.originalText).join(' ');
    if (!sampleText.trim()) return;

    // Skip when there is no key available at all (the server would reject it anyway)
    const userKeys = getApiKeyArrayForHeader();
    if (userKeys.length === 0 && !serverHasKey) return;

    const cacheKey = `sgl_lang_detect_${fileName}_${fileSize}_${sampleText.length}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setDetectedSourceLang(cached);
        return;
      }
    } catch {}

    try {
      const res = await fetch('/api/detect-language', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ text: sampleText }),
      });

      if (res.ok) {
        const data = await res.json();
        const detectedName = data.languageFa || data.language || data.detectedLanguage;
        if (detectedName) {
          setDetectedSourceLang(detectedName);
          try { localStorage.setItem(cacheKey, detectedName); } catch {}
        }
      }
    } catch {
      // Ignore background detection errors
    }
  };

  // Save / Clear API Key handlers
  const handleSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    setUserApiKey(trimmed);
    localStorage.setItem('gemini_user_api_key', trimmed);
    showToast(t.apiKeySaved, 'success');
  };

  const handleClearApiKey = () => {
    setUserApiKey('');
    localStorage.removeItem('gemini_user_api_key');
    showToast(t.apiKeyCleared, 'info');
  };

  // Source item modification handler
  const handleSourceItemChange = (id: number, field: 'originalText' | 'startTime' | 'endTime', value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isTextChanged = field === 'originalText' && value !== item.originalText;
          let newStartSec = item.startSeconds;
          let newEndSec = item.endSeconds;

          if (field === 'startTime') {
            const parsedSec = timestampToSeconds(value);
            if (!isNaN(parsedSec)) newStartSec = parsedSec;
          } else if (field === 'endTime') {
            const parsedSec = timestampToSeconds(value);
            if (!isNaN(parsedSec)) newEndSec = parsedSec;
          }

          return {
            ...item,
            [field]: value,
            startSeconds: newStartSec,
            endSeconds: newEndSec,
            sourceModified: isTextChanged ? true : item.sourceModified,
          };
        }
        return item;
      })
    );
  };

  // Re-translate modified source lines
  const handleRetranslateModified = async () => {
    const modifiedItems = items.filter((item) => item.sourceModified);
    if (modifiedItems.length === 0) return;

    showToast(uiLang === 'en' ? `Re-translating ${modifiedItems.length} modified line(s)...` : `در حال ترجمه مجدد ${modifiedItems.length} سطر اصلاح‌شده...`, 'info');

    for (const item of modifiedItems) {
      await handleSingleLineTranslate(item.id);
    }

    setItems((prev) =>
      prev.map((item) => ({ ...item, sourceModified: false }))
    );
  };

  // AI Quality Audit & Verification Pass
  const [isVerifyingQuality, setIsVerifyingQuality] = useState(false);
  // FIX (B2): quality-audit runs get the same job-isolation treatment as translation runs
  const verifyRunIdRef = useRef<string>('');

  const handleVerifyQuality = async () => {
    if (items.length === 0) return;
    const verifyRunId = 'verify_' + Date.now().toString(36);
    verifyRunIdRef.current = verifyRunId;
    const isVerifyDead = () => verifyRunIdRef.current !== verifyRunId || (activeAbortControllerRef.current?.signal.aborted ?? false);

    setIsVerifyingQuality(true);
    const verifyAbortController = new AbortController();
    activeAbortControllerRef.current = verifyAbortController;
    try {
      const res = await fetch('/api/verify-translation', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            originalText: i.originalText,
            translatedText: i.translatedText,
          })),
          targetLanguage,
          tone: selectedTone,
          customPrompt,
          mode,
          model: selectedModel,
          provider: activeAiProvider,
          customProvider: activeAiProvider === 'custom' ? customProviderConfig : undefined,
        }),
        // FIX (B2): a mode switch (setMode aborts activeAbortControllerRef) now also aborts the
        // quality audit instead of letting it finish and overwrite the other workspace
        signal: verifyAbortController.signal,
      });

      if (isVerifyDead()) return;

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Quality audit failed.');
      }

      const data = await res.json();
      if (isVerifyDead()) return;

      const reviewedItems = data.reviewedItems || data.verifiedTranslations;
      if (reviewedItems && Array.isArray(reviewedItems)) {
        let refinedCount = 0;
        const isRTL = RTL_LANGUAGES.includes(targetLanguage);

        setItems((prev) => {
          // FIX (B2): never apply audit results after cancel/mode-switch — the response would
          // otherwise be written onto a DIFFERENT workspace's rows
          if (isVerifyDead() || cancelTranslationRef.current) return prev;
          const copy = [...prev];
          reviewedItems.forEach((vt: { id: number; translatedText?: string; text?: string }) => {
            const idx = copy.findIndex((i) => i.id === vt.id);
            const textVal = vt.translatedText ?? vt.text;
            if (idx !== -1 && textVal && textVal !== copy[idx].translatedText) {
              const finalText = isRTL ? fixRTLPunctuation(textVal) : textVal;
              copy[idx] = { ...copy[idx], translatedText: finalText };
              refinedCount++;
            }
          });
          return copy;
        });

        showToast(
          uiLang === 'en'
            ? `Quality audit complete! Refined ${refinedCount} line(s).`
            : `ارزیابی کیفیت انجام شد! ${refinedCount} سطر بهبود یافت.`,
          'success'
        );
      }
    } catch (err: unknown) {
      // FIX (B2): an abort caused by cancel/mode-switch is not an error
      if ((err as any)?.name === 'AbortError' || isVerifyDead()) return;
      showToast(err instanceof Error ? err.message : 'Error auditing translation quality', 'error');
    } finally {
      if (activeAbortControllerRef.current === verifyAbortController) {
        activeAbortControllerRef.current = null;
      }
      if (verifyRunIdRef.current === verifyRunId) {
        setIsVerifyingQuality(false);
      }
    }
  };

  // Add a new empty line / string
  const handleAddNewLine = () => {
    setItems((prev) => {
      const nextId = prev.length > 0 ? Math.max(...prev.map((i) => i.id)) + 1 : 1;
      const lastItem = prev[prev.length - 1];
      // FIX (L1): the two time representations used to disagree — startTime/endTime were both
      // set to the previous row's END time (zero-duration display) while startSeconds/endSeconds
      // were 5s apart. Both displays now describe the SAME 5-second slot.
      const newStartSec = lastItem ? lastItem.endSeconds : 0;
      const newEndSec = lastItem ? lastItem.endSeconds + 5 : 5;
      return [
        ...prev,
        {
          id: nextId,
          startTime: secondsToSRT(newStartSec),
          endTime: secondsToSRT(newEndSec),
          startSeconds: newStartSec,
          endSeconds: newEndSec,
          originalText: '',
          translatedText: '',
          gameKey: mode === 'game' ? `KEY_${nextId}` : undefined,
        },
      ];
    });
    showToast(uiLang === 'en' ? 'New item added' : 'سطر جدید افزوده‌شد', 'info');
  };

  // Fill empty lines with original text
  const handleFillEmptyWithOriginal = () => {
    let count = 0;
    setItems((prev) =>
      prev.map((item) => {
        if (!item.translatedText || !item.translatedText.trim()) {
          count++;
          return { ...item, translatedText: item.originalText };
        }
        return item;
      })
    );
    showToast(`${count} ${t.emptyLinesFilled}`, 'info');
  };

  // Live Real-Time Streaming Translation Handler
  // FIX (Cancellation): jobId isolation + AbortController — previously this path had NO jobId check
  // and NO fetch signal, so cancelling could leave a zombie loop that resumed when a new job reset
  // the global cancel flag, and the in-flight stream could not be aborted at all.
  const translateWithLiveStream = async (currentJobId: string) => {
    // A batch/iteration may only continue while the cancel flag is false AND this job is still the active one
    const isJobDead = () => cancelTranslationRef.current || activeJobIdRef.current !== currentJobId;

    const isRTL = RTL_LANGUAGES.includes(targetLanguage);
    const STREAM_CHUNK_SIZE = Math.min(batchSize || 35, 30);
    const totalCount = items.length;
    const totalBatchesCount = Math.ceil(totalCount / STREAM_CHUNK_SIZE);

    setTotalBatches(totalBatchesCount);
    setCurrentBatch(0);
    setTranslatedCount(0);

    for (let b = 0; b < totalBatchesCount; b++) {
      if (isJobDead()) break;

      while (isPausedRef.current) {
        if (isJobDead()) break;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (isJobDead()) break;

      setCurrentBatch(b + 1);
      const startIndex = b * STREAM_CHUNK_SIZE;
      const batchSlice = items.slice(startIndex, startIndex + STREAM_CHUNK_SIZE);

      // Handle skippable items
      const itemsToStream: typeof batchSlice = [];
      const autoFilled: Array<{ id: number; text: string }> = [];

      batchSlice.forEach((item) => {
        if (skipCodeOnly && isCodeOnlyOrSkippable(item.originalText)) {
          autoFilled.push({ id: item.id, text: item.originalText });
        } else {
          itemsToStream.push(item);
        }
      });

      if (autoFilled.length > 0) {
        setItems((prevItems) => {
          // FIX (B2): a zombie/stale stream loop must never write into the CURRENT workspace —
          // after a mode switch both lists share ids starting at 1, so unguarded writes landed
          // translations of the OLD workspace onto the NEW workspace's rows.
          if (cancelTranslationRef.current || activeJobIdRef.current !== currentJobId) return prevItems;
          const updated = [...prevItems];
          autoFilled.forEach((af) => {
            const idx = updated.findIndex((i) => i.id === af.id);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], translatedText: af.text };
            }
          });
          return updated;
        });
      }

      if (itemsToStream.length === 0) {
        setTranslatedCount((prev) => prev + batchSlice.length);
        continue;
      }

      const abortController = new AbortController();
      activeAbortControllerRef.current = abortController;
      let clientGone = false;

      try {
        const response = await fetch('/api/translate-stream', {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            items: itemsToStream.map((i) => ({
              id: i.id,
              text: i.originalText,
              key: i.gameKey,
              context: i.context,
            })),
            sourceLanguage: sourceLanguage === 'auto' ? undefined : sourceLanguage,
            targetLanguage,
            tone: selectedTone,
            customPrompt,
            mode,
            model: selectedModel,
          }),
          // FIX (Cancellation): the stream fetch is now abortable — the Cancel button (which aborts
          // activeAbortControllerRef) kills this request instantly, instead of waiting for the next chunk
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Streaming failed with HTTP status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          if (isJobDead()) {
            clientGone = true;
            try { await reader.cancel(); } catch {}
            break;
          }

          const { done, value } = await reader.read();
          if (done) break;

          // FIX (Cancellation): pause now works DURING streaming (backpressure) — previously the
          // pause flag was never checked inside the read loop, so pause did nothing until the batch ended
          while (isPausedRef.current && !isJobDead()) {
            await new Promise((r) => setTimeout(r, 300));
          }
          if (isJobDead()) {
            clientGone = true;
            try { await reader.cancel(); } catch {}
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const ev of events) {
            if (!ev.trim()) continue;
            const lines = ev.split('\n');
            let eventType = 'message';
            let eventData = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.replace('event:', '').trim();
              } else if (line.startsWith('data:')) {
                eventData = line.replace('data:', '').trim();
              }
            }

            if (!eventData) continue;

            try {
              const parsed = JSON.parse(eventData);

              if (eventType === 'line_translated' && parsed.id && parsed.text !== undefined) {
                setItems((prevItems) => {
                  // FIX (B2): the apply itself is guarded NOW (not only at the next read) —
                  // between reading a chunk and React running this updater, the user may have
                  // cancelled or switched mode; stale translations of the old workspace must
                  // never land on the new workspace's rows (ids collide starting at 1).
                  if (cancelTranslationRef.current || activeJobIdRef.current !== currentJobId) return prevItems;
                  const updated = [...prevItems];
                  const targetIndex = updated.findIndex((i) => i.id === parsed.id);
                  if (targetIndex !== -1) {
                    let finalText = isRTL ? fixRTLPunctuation(parsed.text) : parsed.text;
                    if (isRTL && appendRTLMarkers) {
                      finalText = appendHiddenRTLMarker(finalText);
                    }
                    updated[targetIndex] = {
                      ...updated[targetIndex],
                      translatedText: finalText,
                    };
                  }
                  return updated;
                });
                setTranslatedCount((prev) => Math.min(prev + 1, totalCount));
              } else if (eventType === 'status' && parsed.status === 'key_failover') {
                showToast(
                  uiLang === 'en'
                    ? `Live Stream: API Quota limit reached, switching automatically to Key #${parsed.nextKeyIndex}...`
                    : `پخش زنده: سقف کلید جاری پر شد، سوئیچ خودکار به کلید #${parsed.nextKeyIndex}...`,
                  'warning'
                );
              } else if (eventType === 'error') {
                showToast(parsed.error || 'Live Streaming Error', 'error');
              }
            } catch (jsonErr) {
              console.warn('Could not parse SSE event:', jsonErr);
            }
          }
        }
      } catch (streamErr: any) {
        // FIX (Cancellation): an abort from the Cancel button is not an error — exit quietly.
        // Previously an abort/network error was toasted and the loop CONTINUED to the next batch.
        if (streamErr?.name === 'AbortError' || isJobDead()) {
          clientGone = true;
        } else {
          console.error('Live streaming network/parse error:', streamErr);
          showToast(streamErr?.message || 'Error in live streaming translation', 'error');
        }
      } finally {
        // FIX: release the abort controller slot so a fresh job registers its own
        if (activeAbortControllerRef.current === abortController) {
          activeAbortControllerRef.current = null;
        }
      }

      // FIX (Zombie prevention): if this job was cancelled/superseded, never start the next batch
      if (clientGone || isJobDead()) break;

      // Small throttle between stream blocks with rate-limit pacing support
      if (b < totalBatchesCount - 1 && !isJobDead()) {
        if (rateLimitPacing) {
          const delaySeconds = 3;
          for (let s = delaySeconds; s > 0; s--) {
            if (isJobDead()) break;
            while (isPausedRef.current) {
              if (isJobDead()) break;
              await new Promise((r) => setTimeout(r, 500));
            }
            setPacingRemainingSec(s);
            await new Promise((r) => setTimeout(r, 1000));
          }
          setPacingRemainingSec(null);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }
    }

    // FIX (Race safety): only the ACTIVE job may touch the shared UI state. If a new job already
    // took over (cancel + quick restart), this stale loop must exit without resetting its state.
    if (activeJobIdRef.current === currentJobId) {
      setPacingRemainingSec(null);
      setIsTranslating(false);
      isTranslatingRef.current = false;

      if (!cancelTranslationRef.current) {
        showToast(t.translationFinished, 'success');
      }
    }
  };

  // Start Batch or Live Streaming Translation Process
  const handleStartTranslation = async () => {
    if (isTranslatingRef.current) return;
    if (items.length === 0) {
      showToast(t.noSubtitlesToTranslate, 'warning');
      return;
    }

    // Verify provider configuration
    if (activeAiProvider === 'custom') {
      if (!customProviderConfig.baseUrl?.trim() || !customProviderConfig.apiKey?.trim() || !customProviderConfig.model?.trim()) {
        showToast(
          uiLang === 'en'
            ? 'Please configure your Custom Provider (Base URL, API Key, Model ID) before translating.'
            : 'لطفاً تنظیمات سرویس‌دهنده سفارشی (Base URL، کلید API و شناسه مدل) را تکمیل کنید.',
          'warning'
        );
        setIsApiKeyModalOpen(true);
        return;
      }
    } else {
      // Verify Gemini API key is configured (client key or server env key)
      const userKeys = getApiKeyArrayForHeader();
      if (userKeys.length === 0 && !serverHasKey) {
        showToast(
          uiLang === 'en'
            ? 'Please enter your Gemini API key to start translation.'
            : 'برای شروع ترجمه، لطفاً کلید API جمینای خود را وارد کنید.',
          'warning'
        );
        setIsApiKeyModalOpen(true);
        return;
      }
    }

    const effectiveModel = activeAiProvider === 'custom'
      ? (customProviderConfig.model || selectedModel)
      : selectedModel;

    const currentJobId = 'job_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    activeJobIdRef.current = currentJobId;

    isTranslatingRef.current = true;
    setIsTranslating(true);
    setIsPaused(false);
    cancelTranslationRef.current = false;
    setActiveRunningModel(effectiveModel);
    setIsFallbackActive(false);
    setPacingRemainingSec(null);

    // If live streaming model is selected, use real-time stream engine (Gemini only)
    if (selectedModel === 'gemini-live-stream') {
      if (activeAiProvider === 'custom') {
        showToast(
          uiLang === 'en'
            ? 'Gemini Live Stream is only supported on Google Gemini. Translating with Custom Provider in standard mode.'
            : 'حالت پخش زنده مخصوص گوگل جمینای است. ترجمه با سرویس‌دهنده سفارشی در حالت استاندارد انجام می‌شود.',
          'info'
        );
      } else {
        await translateWithLiveStream(currentJobId);
        return;
      }
    }

    const BATCH_SIZE = batchSize || 35;
    const totalCount = items.length;
    const totalBatchesCount = Math.ceil(totalCount / BATCH_SIZE);

    setTotalBatches(totalBatchesCount);
    setCurrentBatch(0);
    setTranslatedCount(0);

    const isRTL = RTL_LANGUAGES.includes(targetLanguage);

    for (let b = 0; b < totalBatchesCount; b++) {
      if (cancelTranslationRef.current || activeJobIdRef.current !== currentJobId) break;

      // Handle pause loop
      while (isPausedRef.current) {
        if (cancelTranslationRef.current || activeJobIdRef.current !== currentJobId) break;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (cancelTranslationRef.current || activeJobIdRef.current !== currentJobId) break;

      setCurrentBatch(b + 1);

      const startIndex = b * BATCH_SIZE;
      const batchSlice = items.slice(startIndex, startIndex + BATCH_SIZE);

      // Separate skippable code/symbol items if skipCodeOnly is enabled
      const itemsToTranslate: typeof batchSlice = [];
      const autoFilledItems: Array<{ id: number; text: string }> = [];

      batchSlice.forEach((item) => {
        if (skipCodeOnly && isCodeOnlyOrSkippable(item.originalText)) {
          autoFilledItems.push({ id: item.id, text: item.originalText });
        } else {
          itemsToTranslate.push(item);
        }
      });

      // Apply auto-filled skippable rows immediately
      if (autoFilledItems.length > 0) {
        setItems((prevItems) => {
          const updated = [...prevItems];
          autoFilledItems.forEach((af) => {
            const idx = updated.findIndex((i) => i.id === af.id);
            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                translatedText: af.text,
              };
            }
          });
          return updated;
        });
      }

      // If all items in this batch were skippable code rows, increment count and continue!
      if (itemsToTranslate.length === 0) {
        setTranslatedCount((prev) => prev + batchSlice.length);
        continue;
      }

      let success = false;
      let attempt = 0;
      const MAX_RETRIES = 3; // Consolidated unified retries (Requirements 6, 7, 8)

      while (!success && attempt < MAX_RETRIES && !cancelTranslationRef.current && activeJobIdRef.current === currentJobId) {
        attempt++;
        if (attempt > 1) {
          setRetryInfo({ batch: b + 1, attempt, maxRetries: MAX_RETRIES });
          // Exponential backoff with jitter
          const baseDelay = Math.min(Math.pow(2, attempt - 1) * 2000, 16000);
          const jitter = Math.floor(Math.random() * 1000);
          const backoffDelay = baseDelay + jitter;
          showToast(
            uiLang === 'en'
              ? `Retrying batch ${b + 1} (attempt ${attempt}/${MAX_RETRIES}) in ${(backoffDelay / 1000).toFixed(1)}s...`
              : uiLang === 'ar'
              ? `إعادة محاولة الدفعة ${b + 1} (محاولة ${attempt} من ${MAX_RETRIES}) خلال ${(backoffDelay / 1000).toFixed(1)} ثانية...`
              : `تلاش مجدد دسته ${b + 1} (تلاش ${attempt} از ${MAX_RETRIES}) تا ${(backoffDelay / 1000).toFixed(1)} ثانیه دیگر...`,
            'warning'
          );
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }

        if (cancelTranslationRef.current || activeJobIdRef.current !== currentJobId) break;

        const abortController = new AbortController();
        activeAbortControllerRef.current = abortController;

        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify({
              jobId: currentJobId,
              items: itemsToTranslate.map((i) => ({ 
                id: i.id, 
                text: i.originalText,
                key: i.gameKey,
                context: i.context 
              })),
              sourceLanguage: sourceLanguage === 'auto' ? undefined : sourceLanguage,
              targetLanguage,
              tone: selectedTone,
              customPrompt,
              mode,
              model: effectiveModel,
              provider: activeAiProvider,
              customProvider: activeAiProvider === 'custom' ? customProviderConfig : undefined,
            }),
            signal: abortController.signal,
          });

          // Verify job isolation: if cancelled or job changed, discard response immediately (Requirement 10)
          if (cancelTranslationRef.current || activeJobIdRef.current !== currentJobId) {
            break;
          }

          const data = await response.json().catch(() => ({}));

          if (!response.ok || (data.success === false && data.error)) {
            const isNonRetryable = data.retryable === false || response.status === 400 || response.status === 401 || response.status === 403 || response.status === 413;
            const errorMsg = data.error || `Server error (${response.status}) during translation.`;

            if (isNonRetryable) {
              showToast(errorMsg, 'error');
              cancelTranslationRef.current = true;
              break; // Cease retries immediately for non-retryable errors (Requirement 7)
            }
            throw new Error(errorMsg);
          }

          if (data.modelUsed) {
            setActiveRunningModel(data.modelUsed);
          }
          if (data.isFallback !== undefined) {
            setIsFallbackActive(Boolean(data.isFallback));
          }

          const translationsList: Array<{ id: number; text: string }> = data.translations || [];

          // Merge translations into state only if this job is still the active one
          if (activeJobIdRef.current === currentJobId && !cancelTranslationRef.current) {
            setItems((prevItems) => {
              const updated = [...prevItems];
              translationsList.forEach((transObj) => {
                const targetIndex = updated.findIndex((i) => i.id === transObj.id);
                if (targetIndex !== -1) {
                  let finalText = isRTL ? fixRTLPunctuation(transObj.text) : transObj.text;
                  if (isRTL && appendRTLMarkers) {
                    finalText = appendHiddenRTLMarker(finalText);
                  }
                  updated[targetIndex] = {
                    ...updated[targetIndex],
                    translatedText: finalText,
                  };
                }
              });
              return updated;
            });

            setTranslatedCount((prev) => prev + batchSlice.length);
            success = true;
            setRetryInfo(null);
          }
        } catch (err: any) {
          if (err?.name === 'AbortError' || cancelTranslationRef.current || activeJobIdRef.current !== currentJobId) {
            break;
          }
          console.error(`Batch ${b + 1} attempt ${attempt} failed:`, err);
          if (attempt >= MAX_RETRIES) {
            const errMsg = err instanceof Error ? err.message : `Batch ${b + 1} failed after ${MAX_RETRIES} attempts.`;
            showToast(errMsg, 'error');
          }
        } finally {
          if (activeAbortControllerRef.current === abortController) {
            activeAbortControllerRef.current = null;
          }
        }
      }

      // Pacing delay between batches to protect against RPM/TPM rate limits
      if (b < totalBatchesCount - 1 && !cancelTranslationRef.current) {
        if (rateLimitPacing) {
          const delaySeconds = 4;
          for (let s = delaySeconds; s > 0; s--) {
            if (cancelTranslationRef.current) break;
            while (isPausedRef.current) {
              if (cancelTranslationRef.current) break;
              await new Promise((r) => setTimeout(r, 500));
            }
            setPacingRemainingSec(s);
            await new Promise((r) => setTimeout(r, 1000));
          }
          setPacingRemainingSec(null);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    // FIX (Race safety): only the ACTIVE job may reset the shared state — a stale cancelled loop
    // whose tail runs after a new job started must not kill the new job's UI/locks.
    if (activeJobIdRef.current === currentJobId) {
      setPacingRemainingSec(null);
      setIsTranslating(false);
      isTranslatingRef.current = false;

      if (!cancelTranslationRef.current) {
        showToast(t.translationFinished, 'success');
      }
    }
  };

  // Re-translate single line
  const handleSingleLineTranslate = async (id: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const isRTL = RTL_LANGUAGES.includes(targetLanguage);

    const effectiveModel = activeAiProvider === 'custom'
      ? (customProviderConfig.model || selectedModel)
      : selectedModel;

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          items: [{ 
            id: item.id, 
            text: item.originalText,
            key: item.gameKey,
            context: item.context 
          }],
          sourceLanguage: sourceLanguage === 'auto' ? undefined : sourceLanguage,
          targetLanguage,
          tone: selectedTone,
          customPrompt,
          mode,
          model: effectiveModel,
          provider: activeAiProvider,
          customProvider: activeAiProvider === 'custom' ? customProviderConfig : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const translatedObj = data.translations?.[0];
        if (translatedObj && translatedObj.text) {
          let finalText = isRTL ? fixRTLPunctuation(translatedObj.text) : translatedObj.text;
          if (isRTL && appendRTLMarkers) {
            finalText = appendHiddenRTLMarker(finalText);
          }
          handleItemChange(id, finalText);
          showToast(`#${id} ${t.singleLineTranslated}`, 'success');
        }
      } else {
        showToast('Single line translation error.', 'error');
      }
    } catch {
      showToast('Network error while translating line.', 'error');
    }
  };

  // Item edit change handler
  const handleItemChange = (id: number, translatedText: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, translatedText } : item))
    );
  };

  const handleDeleteItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    showToast(`#${id} ${t.lineDeleted}`, 'info');
  };

  // Batch Replace
  const handleBatchReplace = (findText: string, replaceText: string) => {
    let replacedCount = 0;
    setItems((prev) =>
      prev.map((item) => {
        if (item.translatedText.includes(findText)) {
          replacedCount++;
          return {
            ...item,
            translatedText: item.translatedText.replaceAll(findText, replaceText),
          };
        }
        return item;
      })
    );
    showToast(`${replacedCount} ${t.batchReplacedNotice}`, 'success');
  };

  // Export File Download (Handles Cinema & Game Formats)
  // FIX (B4): XLSX export now receives the original structure — extra columns (speaker,
  // category, notes, engine ids…) and the original sheet name survive the round-trip.
  // FIX (B12): TXT export now receives the original structure — comments and blank lines are
  // rebuilt exactly instead of being dropped by the fallback path.
  // FIX (B17): the appendRTLMarkers toggle is now actually honored by ALL game exports AND the
  // cinema export; when OFF, markers previously embedded in the text are stripped on the way out.
  // FIX (B9): exporting is no longer locked behind 100% completion — with an unfinished file the
  // user gets an informed confirm() dialog instead of a permanently disabled button.
  const handleExport = async () => {
    if (items.length === 0) return;

    const untranslatedCount = totalItemsCount - translatedItemsCount;
    if (untranslatedCount > 0 && !isTranslating) {
      const confirmMsg = uiLang === 'en'
        ? `${untranslatedCount} row(s) have no translation yet.\n\nOK = download now (untranslated rows will fall back to the original text)\nCancel = go back and continue translating`
        : `${untranslatedCount} سطر هنوز ترجمه ندارد.\n\nتأیید = همین حالا دانلود شود (سطرهای بدون ترجمه با متن اصلی خروجی می‌گیرند)\nانصراف = بازگشت و ادامهٔ ترجمه`;
      const proceed = window.confirm(confirmMsg);
      if (!proceed) return;
    }

    const isRTL = RTL_LANGUAGES.includes(targetLanguage);
    const nameWithoutExt = fileName ? fileName.substring(0, fileName.lastIndexOf('.')) || fileName : 'SubGameLab_Translation';

    if (mode === 'game' || ['csv', 'json', 'xlsx', 'txt'].includes(targetFormat)) {
      const gameItems: GameLocalizationItem[] = items.map((item) => ({
        id: item.id,
        key: item.gameKey,
        originalText: item.originalText,
        translatedText: item.translatedText,
        context: item.context,
        variables: item.variables,
        rawRowData: item.rawRowData,
      }));

      let blob: Blob;
      if (targetFormat === 'csv') {
        blob = exportGameCSV(gameItems, gameMapping, gameOriginalStructure, appendRTLMarkers);
      } else if (targetFormat === 'json') {
        blob = exportGameJSON(gameItems, gameOriginalStructure, appendRTLMarkers);
      } else if (targetFormat === 'xlsx') {
        blob = await exportGameXLSX(gameItems, gameMapping, gameOriginalStructure, appendRTLMarkers);
      } else {
        blob = exportGameTXT(gameItems, gameOriginalStructure, appendRTLMarkers);
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${nameWithoutExt}_${targetLanguage}.${targetFormat}`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      showToast(`${uiLang === 'en' ? 'Game localization file downloaded' : 'فایل ترجمه بازی با موفقیت دانلود شد'} (.${targetFormat.toUpperCase()})`, 'success');
      return;
    }

    // Cinema Subtitle Export
    let exportedContent: string;
    let fileSuffix = targetLanguage;

    if (bilingualConfig?.enabled) {
      exportedContent = exportBilingualSubtitleFile(
        items,
        targetFormat as SubtitleFormat,
        bilingualConfig,
        rawHeader,
        isRTL
      );
      fileSuffix = `bilingual_${targetLanguage}`;
    } else {
      exportedContent = exportSubtitleFile(
        items,
        targetFormat as SubtitleFormat,
        rawHeader,
        isRTL,
        appendRTLMarkers, // FIX (B17): the cinema UI toggle now reaches the exporter too
        subFpsRef.current // FIX (L8): keep the MicroDVD frame rate of the source file
      );
    }

    const blob = new Blob([exportedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.download = `${nameWithoutExt}_${fileSuffix}.${targetFormat}`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);

    showToast(`${t.subtitleExported} (.${targetFormat.toUpperCase()})`, 'success');
  };

  // Safely activate Bilingual configuration without destroying raw translatedText
  const handleApplyBilingualToEditor = (config: BilingualConfig) => {
    handleUpdateBilingualConfig({ ...config, enabled: true });
    showToast(
      uiLang === 'en'
        ? 'Bilingual subtitles activated! Both languages are separated cleanly in preview and export.'
        : 'حالت زیرنویس دوزبانه فعال شد! زبان اصلی و ترجمه به صورت تفکیک‌شده روی ویدیو و هنگام خروجی نمایش داده می‌شوند.',
      'success'
    );
  };

  // Repair corrupted items
  const handleRepairCorruptedSubtitles = () => {
    if (items.length === 0) return;
    const repaired = repairCorruptedSubtitleItems(items);
    setItems(repaired);
    showToast(
      uiLang === 'en' ? 'Subtitles cleaned and duplicate original lines removed!' : 'زیرنویس‌ها پاکسازی و خطوط تکراری اصلاح شدند!',
      'success'
    );
  };

  // Direct Bilingual Subtitles Export
  const handleExportBilingual = (config: BilingualConfig, format: SubtitleFormat) => {
    if (items.length === 0) {
      showToast(uiLang === 'en' ? 'No subtitles to export' : 'زیرنویسی برای دانلود وجود ندارد', 'warning');
      return;
    }
    const isRTL = RTL_LANGUAGES.includes(targetLanguage);
    const content = exportBilingualSubtitleFile(items, format, config, rawHeader, isRTL);
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const nameWithoutExt = fileName ? fileName.substring(0, fileName.lastIndexOf('.')) || fileName : 'SubGameLab_Bilingual';
    link.download = `${nameWithoutExt}_bilingual_${targetLanguage}.${format}`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);

    showToast(
      uiLang === 'en' ? `Exported bilingual subtitles (.${format.toUpperCase()})` : `زیرنویس دوزبانه دانلود شد (.${format.toUpperCase()})`,
      'success'
    );
  };

  // Reset State for current mode
  const handleReset = async () => {
    const defaultSession = createDefaultSession(mode);
    sessionsRef.current[mode] = defaultSession;
    await clearSessionInDb(mode);
    applySessionState(defaultSession);
    showToast(t.allDataReset, 'info');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors`}>
      
      {/* Top Application Header with Mode Selector */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        uiLang={uiLang}
        setUiLang={setUiLang}
        mode={mode}
        setMode={setMode}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        onOpenBilingualModal={() => setIsBilingualModalOpen(true)}
        isBilingualActive={bilingualConfig.enabled && mode === 'cinema'}
        userApiKey={userApiKey}
        activeProvider={activeAiProvider}
        customProviderName={customProviderConfig.name || customProviderConfig.model}
        onExport={handleExport}
        onReset={handleReset}
        hasSubtitles={items.length > 0}
        subtitleFormat={targetFormat}
        fileName={fileName}
        isTranslating={isTranslating}
        isFullyTranslated={isFullyTranslated}
        completionPercentage={completionPercentage}
        translatedItemsCount={translatedItemsCount}
        totalItemsCount={totalItemsCount}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6">
        
        {/* Upload Zone */}
        <FileUpload
          mode={mode}
          onFileSelect={(buffer, name, size, enc) => processBufferData(buffer, name, size, mode, enc)}
          selectedEncoding={selectedEncoding}
          setSelectedEncoding={handleEncodingChange}
          detectedEncoding={detectedEncoding}
          currentFileName={fileName}
          currentFileSize={fileSize}
          itemCount={items.length}
          currentFormat={sourceFormat}
          uiLang={uiLang}
          onLoadGameSample={handleLoadGameSample}
          onLoadSubtitleSample={handleLoadSubtitleSample}
        />

        {/* Translation Configuration Bar */}
        <ConfigPanel
          mode={mode}
          sourceLanguage={sourceLanguage}
          setSourceLanguage={setSourceLanguage}
          targetLanguage={targetLanguage}
          setTargetLanguage={setTargetLanguage}
          selectedTone={selectedTone}
          setSelectedTone={setSelectedTone}
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
          targetFormat={targetFormat}
          setTargetFormat={setTargetFormat}
          onStartTranslation={handleStartTranslation}
          isTranslating={isTranslating}
          itemCount={items.length}
          detectedSourceLang={detectedSourceLang}
          uiLang={uiLang}
          onOpenBilingualModal={() => setIsBilingualModalOpen(true)}
          isBilingualActive={bilingualConfig.enabled && mode === 'cinema'}
          gameColumns={gameColumns}
          gameMapping={gameMapping}
          setGameMapping={handleGameMappingChange}
          hasGameFile={mode === 'game' && items.length > 0}
          batchSize={batchSize}
          setBatchSize={handleSetBatchSize}
          skipCodeOnly={skipCodeOnly}
          setSkipCodeOnly={setSkipCodeOnly}
          appendRTLMarkers={appendRTLMarkers}
          setAppendRTLMarkers={setAppendRTLMarkers}
          rateLimitPacing={rateLimitPacing}
          setRateLimitPacing={handleToggleRateLimitPacing}
          selectedModel={selectedModel}
          setSelectedModel={handleSelectModel}
          activeProvider={activeAiProvider}
          customProviderConfig={customProviderConfig}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        />

        {/* Translation Progress Bar (Shows when translating) */}
        {isTranslating && (
          <TranslationProgress
            currentBatch={currentBatch}
            totalBatches={totalBatches}
            translatedLines={translatedCount}
            totalLines={items.length}
            isPaused={isPaused}
            retryInfo={retryInfo}
            onPauseToggle={() => setIsPaused(!isPaused)}
            onCancel={() => {
              cancelTranslationRef.current = true;
              isTranslatingRef.current = false;
              activeJobIdRef.current = '';
              if (activeAbortControllerRef.current) {
                try { activeAbortControllerRef.current.abort(); } catch {}
                activeAbortControllerRef.current = null;
              }
              setPacingRemainingSec(null);
              setRetryInfo(null);
              setIsTranslating(false);
            }}
            uiLang={uiLang}
            selectedModel={activeRunningModel || (activeAiProvider === 'custom' ? (customProviderConfig.model || 'Custom Model') : selectedModel)}
            activeProvider={activeAiProvider}
            customProviderConfig={customProviderConfig}
            isFallbackActive={isFallbackActive}
            rateLimitPacing={rateLimitPacing}
            pacingRemainingSec={pacingRemainingSec}
          />
        )}

        {/* Video Player, AI Extraction & Subtitle Style Customizer (Cinema Mode Only) */}
        {mode === 'cinema' && (
          <VideoSubtitlePreview
            items={items}
            onUpdateItems={(newItems) => setItems(newItems)}
            uiLang={uiLang}
            userApiKey={userApiKey}
            onShowToast={showToast}
            bilingualConfig={bilingualConfig}
            setBilingualConfig={handleUpdateBilingualConfig}
            onOpenBilingualModal={() => setIsBilingualModalOpen(true)}
            targetLanguage={targetLanguage}
          />
        )}

        {/* Subtitle / Game String Editor & Live Preview */}
        {items.length > 0 && (
          <SubtitleEditor
            mode={mode}
            items={items}
            onItemChange={handleItemChange}
            onSourceItemChange={handleSourceItemChange}
            onSingleLineTranslate={handleSingleLineTranslate}
            onRetranslateModified={handleRetranslateModified}
            onVerifyQuality={handleVerifyQuality}
            isVerifyingQuality={isVerifyingQuality}
            onDeleteItem={handleDeleteItem}
            onAddNewLine={handleAddNewLine}
            onBatchReplace={handleBatchReplace}
            onFillEmptyWithOriginal={handleFillEmptyWithOriginal}
            onRepairCorruptedSubtitles={handleRepairCorruptedSubtitles}
            uiLang={uiLang}
            onOpenBilingualModal={() => setIsBilingualModalOpen(true)}
            bilingualConfig={bilingualConfig}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-indigo-500/30 p-0.5 shrink-0 shadow-sm">
            <img
              src={SUBGAME_LAB_LOGO}
              alt="SubGame Lab Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-md"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">SubGame Lab</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Next-Gen Subtitle & Game Localization</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              {t.copyrightText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <a
            href="https://t.me/MySaeedLab"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 hover:border-sky-400 shadow-sm transition-all font-semibold active:scale-95 group"
            title="Join SaeedLab on Telegram"
          >
            <Send className="w-3.5 h-3.5 text-sky-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <span className="font-semibold font-sans tracking-wide">Telegram</span>
          </a>

          <a
            href="https://github.com/gguhfhu7-sketch/SubGame-Lab"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm transition-all font-semibold active:scale-95 group"
            title="View SubGame-Lab on GitHub"
          >
            <Github className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform" />
            <span className="font-semibold font-sans tracking-wide">GitHub</span>
          </a>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Gemini AI Engine</span>
          </div>
        </div>
      </footer>

      {/* User API Key & Provider (BYOK) Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        userApiKey={userApiKey}
        onSaveKey={handleSaveApiKey}
        onClearKey={handleClearApiKey}
        uiLang={uiLang}
        activeProvider={activeAiProvider}
        onProviderChange={handleProviderChange}
        customConfig={customProviderConfig}
        onSaveCustomConfig={handleSaveCustomConfig}
      />

      {/* Bilingual Subtitle Customizer Modal (Cinema Mode) */}
      <BilingualModal
        isOpen={isBilingualModalOpen}
        onClose={() => setIsBilingualModalOpen(false)}
        items={items}
        uiLang={uiLang}
        targetFormat={targetFormat as SubtitleFormat}
        bilingualConfig={bilingualConfig}
        setBilingualConfig={handleUpdateBilingualConfig}
        onApplyToEditor={handleApplyBilingualToEditor}
        onExportBilingual={handleExportBilingual}
      />

      {/* User Guide & Network Warning Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        uiLang={uiLang}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} uiLang={uiLang} />

    </div>
  );
}
