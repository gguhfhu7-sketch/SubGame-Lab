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
  AIModelId
} from './types';
import { 
  parseSubtitleFile, 
  exportSubtitleFile, 
  detectEncodingAndDecode,
  fixRTLPunctuation,
  timestampToSeconds,
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
import { getApiKeyArrayForHeader } from './lib/apiKeyManager';
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

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    localStorage.setItem('gemini_app_mode', newMode);
    if (newMode === 'game') {
      if (['srt', 'vtt', 'ass', 'ssa', 'sub'].includes(targetFormat)) {
        setTargetFormat('csv');
        setSourceFormat('csv');
      }
      if (selectedTone === 'cinematic') {
        setSelectedTone('epic');
      }
    } else {
      if (['csv', 'json', 'xlsx', 'txt'].includes(targetFormat)) {
        setTargetFormat('srt');
        setSourceFormat('srt');
      }
      if (selectedTone === 'epic') {
        setSelectedTone('cinematic');
      }
    }
  };

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
  const [selectedModel, setSelectedModel] = useState<AIModelId>(() => {
    const saved = localStorage.getItem('subgamelab_selected_model');
    if (saved && AI_MODELS.some((m) => m.id === saved)) {
      return saved as AIModelId;
    }
    return 'gemini-3.6-flash';
  });
  const [activeRunningModel, setActiveRunningModel] = useState<AIModelId | undefined>(undefined);
  const [isFallbackActive, setIsFallbackActive] = useState<boolean>(false);

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

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
  const processBufferData = async (buffer: ArrayBuffer, name: string, size: number, currentAppMode = mode) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const isGameFile = currentAppMode === 'game' || ['csv', 'json', 'xlsx'].includes(ext);

    setFileName(name);
    setFileSize(size);

    if (isGameFile) {
      if (mode !== 'game') {
        setMode('game');
      }
      try {
        const parsedGame = await parseGameLocalizationFile(buffer, name);
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
        setDetectedEncoding('UTF-8');

        showToast(`${t.newFileLoaded} (${unifiedItems.length} ${t.linesCount})`, 'success');
        detectLanguageOnLoad(unifiedItems);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Error parsing game localization file', 'error');
      }
    } else {
      // Cinema Subtitle Mode
      const { text, encoding } = detectEncodingAndDecode(buffer);
      setDetectedEncoding(encoding);

      try {
        const parsed = parseSubtitleFile(text, name);
        setItems(parsed.items);
        setSourceFormat(parsed.format);
        setTargetFormat(parsed.format);
        setRawHeader(parsed.rawHeader);

        showToast(`${t.newFileLoaded} (${parsed.items.length} ${t.linesCount})`, 'success');
        detectLanguageOnLoad(parsed.items);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : t.fileParseError, 'error');
      }
    }
  };

  // Listen to file upload events
  useEffect(() => {
    const handleProcessBuffer = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { buffer, fileName: name, fileSize: size, mode: eventMode } = customEvent.detail;
      if (!buffer) return;
      processBufferData(buffer, name || 'file', size || 0, eventMode || mode);
    };

    window.addEventListener('processBuffer', handleProcessBuffer);
    return () => window.removeEventListener('processBuffer', handleProcessBuffer);
  }, [uiLang, t, mode]);

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

  const detectLanguageOnLoad = async (loadedItems: SubtitleItem[]) => {
    if (loadedItems.length === 0) return;
    const sampleText = loadedItems.slice(0, 5).map((i) => i.originalText).join(' ');

    try {
      const res = await fetch('/api/detect-language', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ text: sampleText }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.detectedLanguage) {
          setDetectedSourceLang(data.detectedLanguage);
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

  const handleVerifyQuality = async () => {
    if (items.length === 0) return;
    setIsVerifyingQuality(true);
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
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Quality audit failed.');
      }

      const data = await res.json();
      const reviewedItems = data.reviewedItems || data.verifiedTranslations;
      if (reviewedItems && Array.isArray(reviewedItems)) {
        let refinedCount = 0;
        const isRTL = RTL_LANGUAGES.includes(targetLanguage);

        setItems((prev) => {
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
      showToast(err instanceof Error ? err.message : 'Error auditing translation quality', 'error');
    } finally {
      setIsVerifyingQuality(false);
    }
  };

  // Add a new empty line / string
  const handleAddNewLine = () => {
    setItems((prev) => {
      const nextId = prev.length > 0 ? Math.max(...prev.map((i) => i.id)) + 1 : 1;
      const lastItem = prev[prev.length - 1];
      const newStart = lastItem ? lastItem.endTime : '00:00:00,000';
      const newEnd = lastItem ? lastItem.endTime : '00:00:05,000';
      return [
        ...prev,
        {
          id: nextId,
          startTime: newStart,
          endTime: newEnd,
          startSeconds: lastItem ? lastItem.endSeconds : 0,
          endSeconds: lastItem ? lastItem.endSeconds + 5 : 5,
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
  const translateWithLiveStream = async () => {
    const isRTL = RTL_LANGUAGES.includes(targetLanguage);
    const STREAM_CHUNK_SIZE = Math.min(batchSize || 35, 30);
    const totalCount = items.length;
    const totalBatchesCount = Math.ceil(totalCount / STREAM_CHUNK_SIZE);

    setTotalBatches(totalBatchesCount);
    setCurrentBatch(0);
    setTranslatedCount(0);

    for (let b = 0; b < totalBatchesCount; b++) {
      if (cancelTranslationRef.current) break;

      while (isPausedRef.current) {
        if (cancelTranslationRef.current) break;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (cancelTranslationRef.current) break;

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
        });

        if (!response.ok || !response.body) {
          throw new Error(`Streaming failed with HTTP status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          if (cancelTranslationRef.current) {
            reader.cancel();
            break;
          }

          const { done, value } = await reader.read();
          if (done) break;

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
        console.error('Live streaming network/parse error:', streamErr);
        showToast(streamErr?.message || 'Error in live streaming translation', 'error');
      }

      // Small throttle between stream blocks with rate-limit pacing support
      if (b < totalBatchesCount - 1 && !cancelTranslationRef.current) {
        if (rateLimitPacing) {
          const delaySeconds = 3;
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
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }
    }

    setPacingRemainingSec(null);
    setIsTranslating(false);

    if (!cancelTranslationRef.current) {
      showToast(t.translationFinished, 'success');
    }
  };

  // Start Batch or Live Streaming Translation Process
  const handleStartTranslation = async () => {
    if (items.length === 0) {
      showToast(t.noSubtitlesToTranslate, 'warning');
      return;
    }

    setIsTranslating(true);
    setIsPaused(false);
    cancelTranslationRef.current = false;
    setActiveRunningModel(selectedModel);
    setIsFallbackActive(false);
    setPacingRemainingSec(null);

    // If live streaming model is selected, use real-time stream engine
    if (selectedModel === 'gemini-live-stream') {
      await translateWithLiveStream();
      return;
    }

    const BATCH_SIZE = batchSize || 35;
    const totalCount = items.length;
    const totalBatchesCount = Math.ceil(totalCount / BATCH_SIZE);

    setTotalBatches(totalBatchesCount);
    setCurrentBatch(0);
    setTranslatedCount(0);

    const isRTL = RTL_LANGUAGES.includes(targetLanguage);

    for (let b = 0; b < totalBatchesCount; b++) {
      if (cancelTranslationRef.current) break;

      // Handle pause loop
      while (isPausedRef.current) {
        if (cancelTranslationRef.current) break;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (cancelTranslationRef.current) break;

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
      const MAX_RETRIES = 5;

      while (!success && attempt < MAX_RETRIES && !cancelTranslationRef.current) {
        attempt++;
        if (attempt > 1) {
          setRetryInfo({ batch: b + 1, attempt, maxRetries: MAX_RETRIES });
          const backoffDelay = Math.min(attempt * 6000, 30000);
          showToast(
            uiLang === 'en'
              ? `Rate limit backoff: retrying batch ${b + 1} in ${Math.round(backoffDelay / 1000)}s...`
              : uiLang === 'ar'
              ? `انتظار تجديد الحصة: جاري إعادة المحاولة خلال ${Math.round(backoffDelay / 1000)} ثوانٍ...`
              : `توقف کوتاه‌مدت به دلیل محدودیت درخواست: تلاش مجدد دسته ${b + 1} تا ${Math.round(backoffDelay / 1000)} ثانیه دیگر...`,
            'warning'
          );
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }

        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify({
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
              model: selectedModel,
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server error (${response.status}) during translation.`);
          }

          const data = await response.json();
          if (data.modelUsed) {
            setActiveRunningModel(data.modelUsed as AIModelId);
          }
          if (data.isFallback !== undefined) {
            setIsFallbackActive(Boolean(data.isFallback));
          }

          const translationsList: Array<{ id: number; text: string }> = data.translations || [];

          // Merge translations into state
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
        } catch (err: unknown) {
          console.error(`Batch ${b + 1} attempt ${attempt} failed:`, err);
          if (attempt >= MAX_RETRIES) {
            const errMsg = err instanceof Error ? err.message : `Batch ${b + 1} failed after ${MAX_RETRIES} attempts.`;
            showToast(errMsg, 'error');
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

    setPacingRemainingSec(null);
    setIsTranslating(false);

    if (!cancelTranslationRef.current) {
      showToast(t.translationFinished, 'success');
    }
  };

  // Re-translate single line
  const handleSingleLineTranslate = async (id: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const isRTL = RTL_LANGUAGES.includes(targetLanguage);

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
          model: selectedModel,
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
  const handleExport = async () => {
    if (items.length === 0) return;

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
        blob = exportGameCSV(gameItems, gameMapping, gameOriginalStructure);
      } else if (targetFormat === 'json') {
        blob = exportGameJSON(gameItems, gameOriginalStructure);
      } else if (targetFormat === 'xlsx') {
        blob = await exportGameXLSX(gameItems, gameMapping);
      } else {
        blob = exportGameTXT(gameItems);
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
        isRTL
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

  // Reset State
  const handleReset = () => {
    setItems([]);
    setFileName('');
    setFileSize(0);
    setRawHeader(undefined);
    setDetectedEncoding('');
    setGameColumns([]);
    setGameOriginalStructure(null);
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
          onFileSelect={() => {}}
          selectedEncoding={selectedEncoding}
          setSelectedEncoding={setSelectedEncoding}
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
              setPacingRemainingSec(null);
              setIsTranslating(false);
            }}
            uiLang={uiLang}
            selectedModel={activeRunningModel || selectedModel}
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

      {/* User Gemini API Key (BYOK) Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        userApiKey={userApiKey}
        onSaveKey={handleSaveApiKey}
        onClearKey={handleClearApiKey}
        uiLang={uiLang}
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
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

    </div>
  );
}
