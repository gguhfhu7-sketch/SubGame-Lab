import React, { useState, useRef, useEffect } from 'react';
import { SubtitleItem, BilingualConfig } from '../types';
import { UILanguage, TRANSLATIONS } from '../lib/i18n';
import { shiftSubtitleTimestamps } from '../lib/timeShift';
import { processAudioChunksSequentially } from '../lib/audioExtractor';
import { parseSubtitleFile } from '../lib/subtitleParser';
import { getApiKeyArrayForHeader } from '../lib/apiKeyManager';
import { wrapText, sanitizeTranslation } from '../lib/bilingualHelper';
import { 
  Video, 
  Upload, 
  Sparkles, 
  Type, 
  Palette, 
  Sliders, 
  Maximize2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Check,
  Zap,
  ShieldCheck,
  Layers,
  Languages
} from 'lucide-react';

export interface SubtitleStyleConfig {
  fontFamily: string;
  fontSize: number; // in px
  textColor: string;
  bgStyle: 'none' | 'shadow' | 'semi-box' | 'solid-box';
  position: 'bottom' | 'middle' | 'top';
}

interface VideoSubtitlePreviewProps {
  items: SubtitleItem[];
  onUpdateItems: (newItems: SubtitleItem[]) => void;
  uiLang: UILanguage;
  userApiKey?: string;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  bilingualConfig?: BilingualConfig;
  setBilingualConfig?: (config: BilingualConfig) => void;
  onOpenBilingualModal?: () => void;
}

export const VideoSubtitlePreview: React.FC<VideoSubtitlePreviewProps> = ({
  items,
  onUpdateItems,
  uiLang,
  userApiKey,
  onShowToast,
  bilingualConfig,
  setBilingualConfig,
  onOpenBilingualModal,
}) => {

  const t = TRANSLATIONS[uiLang];

  // Video State
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // Clean up Blob URLs to prevent memory leaks with large video files
  useEffect(() => {
    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  // Audio Extraction / AI Transcription state
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [highAccuracyMode, setHighAccuracyMode] = useState<boolean>(false);
  const [extractProgressText, setExtractProgressText] = useState<string>('');
  const [extractProgressPercent, setExtractProgressPercent] = useState<number>(0);

  // Subtitle Styling State
  const [styleConfig, setStyleConfig] = useState<SubtitleStyleConfig>({
    fontFamily: 'Vazirmatn',
    fontSize: 22,
    textColor: '#FFFFFF',
    bgStyle: 'semi-box',
    position: 'bottom',
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Active Subtitle for current video time
  const activeSubtitle = items.find(
    (item) => currentTime >= item.startSeconds && currentTime <= item.endSeconds
  );

  const activeText = activeSubtitle
    ? activeSubtitle.translatedText.trim() || activeSubtitle.originalText.trim()
    : '';

  // Handle Video Upload
  const handleVideoSelect = (file: File) => {
    if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      onShowToast(uiLang === 'en' ? 'Please select a valid video or audio file.' : 'لطفاً یک فایل ویدئویی یا صوتی معتبر انتخاب کنید.', 'warning');
      return;
    }

    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }

    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setVideoName(file.name);
    setVideoFile(file);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Video timeupdate listener
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const seekBy = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
  };

  // Extract Audio & Transcribe to SRT using AI with Memory-Optimized Sequential Chunks
  const handleExtractAudioAndTranscribe = async () => {
    if (!videoFile) {
      onShowToast(uiLang === 'en' ? 'Please upload a video file first.' : 'لطفاً ابتدا یک ویدئو بارگذاری کنید.', 'warning');
      return;
    }

    setIsExtracting(true);
    setExtractProgressPercent(0);

    try {
      const allItems: SubtitleItem[] = [];
      const keys = getApiKeyArrayForHeader();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (keys.length > 0) {
        headers['x-gemini-api-keys'] = JSON.stringify(keys);
        headers['x-gemini-api-key'] = keys[0];
        headers['Authorization'] = `Bearer ${keys[0]}`;
      } else if (userApiKey) {
        headers['x-gemini-api-key'] = userApiKey;
        headers['Authorization'] = `Bearer ${userApiKey}`;
      }

      // Process 1-minute audio chunks sequentially without holding all chunks in RAM
      const { chunksCount } = await processAudioChunksSequentially(
        videoFile,
        60,
        async (chunk) => {
          const startMin = Math.floor(chunk.startTimeSeconds / 60);
          const startSec = Math.floor(chunk.startTimeSeconds % 60);
          const endMin = Math.floor((chunk.startTimeSeconds + chunk.durationSeconds) / 60);
          const endSec = Math.floor((chunk.startTimeSeconds + chunk.durationSeconds) % 60);

          const timeStr = `${startMin.toString().padStart(2, '0')}:${startSec.toString().padStart(2, '0')} - ${endMin.toString().padStart(2, '0')}:${endSec.toString().padStart(2, '0')}`;

          const progressMsg = uiLang === 'en'
            ? `Transcribing chunk ${chunk.chunkIndex + 1}/${chunk.chunksCount} (${timeStr})...`
            : uiLang === 'ar'
            ? `جاري استخراج الجزء ${chunk.chunkIndex + 1}/${chunk.chunksCount} (${timeStr})...`
            : `در حال پردازش بخش ${chunk.chunkIndex + 1} از ${chunk.chunksCount} (${timeStr})...`;

          setExtractProgressText(progressMsg);
          const currentPercent = Math.round(25 + ((chunk.chunkIndex + 1) / chunk.chunksCount) * 70);
          setExtractProgressPercent(currentPercent);

          const response = await fetch('/api/transcribe-audio', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              audioBase64: chunk.base64Audio,
              mimeType: 'audio/wav',
              highAccuracyMode,
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Failed to transcribe chunk ${chunk.chunkIndex + 1}.`);
          }

          const data = await response.json();
          if (data.srtText) {
            const parsed = parseSubtitleFile(data.srtText, `chunk_${chunk.chunkIndex}.srt`);
            const shiftedItems = shiftSubtitleTimestamps(parsed.items, chunk.startTimeSeconds * 1000);
            allItems.push(...shiftedItems);
          }
        },
        (percent, step) => {
          setExtractProgressPercent(Math.min(25, Math.round(percent * 0.25)));
          setExtractProgressText(step);
        }
      );

      // Re-index merged subtitle items with 1-based sequential IDs
      const finalItems = allItems.map((item, idx) => ({
        ...item,
        id: idx + 1,
      }));

      onUpdateItems(finalItems);

      onShowToast(
        uiLang === 'en'
          ? `Extracted ${finalItems.length} subtitle lines across ${chunksCount} audio chunk(s)!`
          : uiLang === 'ar'
          ? `تم استخراج ${finalItems.length} سطر ترجمة عبر ${chunksCount} أجزاء!`
          : `تعداد ${finalItems.length} خط زیرنویس هوشمند در قالب ${chunksCount} بخش ۱ دقیقه‌ای با موفقیت استخراج شد!`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error extracting subtitles';
      console.error('Extraction error:', err);
      onShowToast(msg, 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  // Custom positioning class for overlay
  const getPositionClass = () => {
    switch (styleConfig.position) {
      case 'top': return 'top-6 items-center';
      case 'middle': return 'top-1/2 -translate-y-1/2 items-center';
      case 'bottom':
      default:
        return 'bottom-8 items-center';
    }
  };

  // Custom background box / shadow class for overlay
  const getBackgroundClass = () => {
    switch (styleConfig.bgStyle) {
      case 'shadow':
        return 'bg-transparent [text-shadow:_0_2px_4px_rgba(0,0,0,0.9),_0_0_8px_rgba(0,0,0,0.8)]';
      case 'solid-box':
        return 'bg-black text-white px-3 py-1.5 rounded-lg border border-slate-700 shadow-xl';
      case 'semi-box':
        return 'bg-black/75 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg border border-black/40 shadow-xl';
      case 'none':
      default:
        return 'bg-transparent';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-md dark:shadow-xl flex flex-col gap-6 transition-colors">
      
      {/* Component Title Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <Video className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {uiLang === 'en' ? 'Video Player & Subtitle Style Customizer' : uiLang === 'ar' ? 'مشغل الفيديو وتخصيص نمط الترجمة' : 'پیش‌نمایش ویدئو و تنظیم استایل زیرنویس'}
          </h3>
        </div>

        {/* Video Upload Button */}
        <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer transition-all active:scale-95 shadow-md">
          <Upload className="w-4 h-4" />
          <span>{uiLang === 'en' ? 'Load Video File' : uiLang === 'ar' ? 'تحميل فيديو' : 'انتخاب فایل ویدئو'}</span>
          <input
            type="file"
            accept="video/*,audio/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleVideoSelect(e.target.files[0]);
              }
            }}
          />
        </label>
      </div>

      {/* Main Content Layout: Video Stage + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Video Player Stage with Rendered Overlay (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-2xl group">
            
            {videoSrc ? (
              <>
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={togglePlay}
                />

                {/* Subtitle Overlay Element */}
                {activeSubtitle && (
                  <div className={`absolute inset-x-4 flex justify-center pointer-events-none z-10 transition-all ${getPositionClass()}`}>
                    <div
                      className={`text-center max-w-[90%] font-semibold leading-relaxed transition-all ${getBackgroundClass()}`}
                      style={{
                        fontFamily: styleConfig.fontFamily === 'Vazirmatn' ? 'Vazirmatn, sans-serif' : styleConfig.fontFamily,
                        fontSize: `${styleConfig.fontSize}px`,
                        color: styleConfig.textColor,
                      }}
                    >
                      {bilingualConfig?.enabled && activeSubtitle.originalText.trim() && activeSubtitle.translatedText.trim() ? (
                        <div className="flex flex-col items-center gap-1">
                          {(bilingualConfig.order || 'original-top') === 'original-top' ? (
                            <>
                              <p className="leading-snug" style={{ color: styleConfig.textColor }}>
                                {activeSubtitle.originalText}
                              </p>
                              {bilingualConfig.separator && bilingualConfig.separator !== '\n' && (
                                <span className="text-xs opacity-60 font-bold">{bilingualConfig.separator}</span>
                              )}
                              <p
                                className="leading-snug transition-all"
                                style={{
                                  color: bilingualConfig.secondaryColor || '#FFFF00',
                                  fontSize: `${(styleConfig.fontSize * (bilingualConfig.secondarySizePercent || 85)) / 100}px`,
                                }}
                              >
                                {wrapText(
                                  sanitizeTranslation(activeSubtitle.originalText, activeSubtitle.translatedText),
                                  bilingualConfig.wrapSecondary || 'none'
                                )}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="leading-snug" style={{ color: styleConfig.textColor }}>
                                {sanitizeTranslation(activeSubtitle.originalText, activeSubtitle.translatedText)}
                              </p>
                              {bilingualConfig.separator && bilingualConfig.separator !== '\n' && (
                                <span className="text-xs opacity-60 font-bold">{bilingualConfig.separator}</span>
                              )}
                              <p
                                className="leading-snug transition-all"
                                style={{
                                  color: bilingualConfig.secondaryColor || '#FFFF00',
                                  fontSize: `${(styleConfig.fontSize * (bilingualConfig.secondarySizePercent || 85)) / 100}px`,
                                }}
                              >
                                {wrapText(activeSubtitle.originalText, bilingualConfig.wrapSecondary || 'none')}
                              </p>
                            </>
                          )}
                        </div>
                      ) : (
                        <span>{activeText}</span>
                      )}
                    </div>
                  </div>
                )}


                {/* Video Custom Play Controls Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex flex-wrap items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={toggleMute}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    {/* Seek -5s / +5s */}
                    <button
                      onClick={() => seekBy(-5)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-mono"
                      title="Seek -5 seconds"
                    >
                      -5s
                    </button>
                    <button
                      onClick={() => seekBy(5)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-mono"
                      title="Seek +5 seconds"
                    >
                      +5s
                    </button>

                    {/* Speed Selector */}
                    <select
                      value={playbackRate}
                      onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono rounded px-1.5 py-1 focus:outline-none"
                      title="Playback Speed"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={0.75}>0.75x</option>
                      <option value={1.0}>1.0x</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2.0}>2.0x</option>
                    </select>

                    <span className="text-xs font-mono text-slate-300">
                      {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                    {videoName}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center p-8 flex flex-col items-center gap-3 text-slate-500">
                <Video className="w-12 h-12 text-slate-700" />
                <p className="text-xs font-medium max-w-xs">
                  {uiLang === 'en'
                    ? 'Upload a video file to test live subtitle playback and visual styling in real time.'
                    : uiLang === 'ar'
                    ? 'قم بتحميل فيديو لاختبار معاينة الترجمة وتنسيق الخطوط مباشرة.'
                    : 'برای مشاهده پیش‌نمایش زنده زیرنویس روی ویدئو، فایل ویدئو یا فیلم خود را بارگذاری کنید.'}
                </p>
              </div>
            )}
          </div>

          {/* AI Auto-Extract Subtitles from Video Button & Controls */}
          {videoFile && (
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 transition-colors shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{uiLang === 'en' ? 'AI Audio Subtitle Extraction' : uiLang === 'ar' ? 'استخراج الترجمة الصوتية بالذكاء الاصطناعي' : 'استخراج هوشمند زیرنویس از ویدئو'}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                        <Layers className="w-3 h-3" />
                        <span>{uiLang === 'en' ? '1-Min Chunking' : uiLang === 'ar' ? 'تقسيم دقيقة' : 'بخش‌بندی ۶۰ ثانیه‌ای'}</span>
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {uiLang === 'en' ? 'Extract audio in 1-min chunks & generate synced SRT subtitles' : 'استخراج صدای فیلم در بخش‌های ۱ دقیقه‌ای و تولید فایل SRT سنک‌شده'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExtractAudioAndTranscribe}
                  disabled={isExtracting}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isExtracting ? `${extractProgressPercent}%` : (uiLang === 'en' ? 'Extract Subtitles' : 'استخراج زیرنویس')}</span>
                </button>
              </div>

              {/* High Accuracy Mode Toggle Bar */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={highAccuracyMode}
                      onChange={(e) => setHighAccuracyMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className={`w-3.5 h-3.5 ${highAccuracyMode ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {uiLang === 'en'
                        ? 'High Accuracy Mode (Higher Token Usage)'
                        : uiLang === 'ar'
                        ? 'وضع الدقة العالية (استهلاك أعلى للرموز)'
                        : 'حالت دقت بالا (مصرف توکن بیشتر)'}
                    </span>
                  </div>
                </label>

                <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>
                    {uiLang === 'en'
                      ? 'Deep phonetic & accent analysis for quiet audio'
                      : uiLang === 'ar'
                      ? 'تحليل آواشناسي وتدقيق اللكنات للصوت الضعيف'
                      : 'تحلیل عمیق آواشناسی برای صدای ضعیف و لهجه'}
                  </span>
                </span>
              </div>

              {/* Progress Indicator */}
              {isExtracting && (
                <div className="w-full mt-1 bg-purple-50 dark:bg-purple-950/40 p-2.5 rounded-lg border border-purple-200 dark:border-purple-900/50">
                  <div className="flex justify-between text-[11px] text-purple-700 dark:text-purple-300 mb-1.5 font-semibold">
                    <span>{extractProgressText}</span>
                    <span>{extractProgressPercent}%</span>
                  </div>
                  <div className="w-full bg-purple-200 dark:bg-purple-900/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-600 dark:bg-purple-400 h-full transition-all duration-300 rounded-full" style={{ width: `${extractProgressPercent}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Styling Controls & Timestamp Offset Tool (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Subtitle Visual Style Controls */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 transition-colors">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {uiLang === 'en' ? 'Visual Subtitle Styling' : uiLang === 'ar' ? 'تنسيق خط ومظهر الترجمة' : 'تخصيص ظاهر و فونت زیرنویس'}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              
              {/* Font Family */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {uiLang === 'en' ? 'Font Family' : 'نوع فونت'}
                </label>
                <select
                  value={styleConfig.fontFamily}
                  onChange={(e) => setStyleConfig({ ...styleConfig, fontFamily: e.target.value })}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Vazirmatn">Vazirmatn (وزیرمتن)</option>
                  <option value="Inter">Inter</option>
                  <option value="Arial">Arial / System</option>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Courier New">Courier New (Monospace)</option>
                </select>
              </div>

              {/* Font Size */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {uiLang === 'en' ? 'Font Size' : 'اندازه فونت'} ({styleConfig.fontSize}px)
                </label>
                <input
                  type="range"
                  min="14"
                  max="44"
                  value={styleConfig.fontSize}
                  onChange={(e) => setStyleConfig({ ...styleConfig, fontSize: Number(e.target.value) })}
                  className="accent-indigo-500 cursor-pointer my-auto"
                />
              </div>

              {/* Text Color */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {uiLang === 'en' ? 'Text Color' : 'رنگ متن'}
                </label>
                <div className="flex items-center gap-1.5">
                  {['#FFFFFF', '#FFFF00', '#00FFFF', '#00FF00', '#FFAA00'].map((col) => (
                    <button
                      key={col}
                      onClick={() => setStyleConfig({ ...styleConfig, textColor: col })}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${styleConfig.textColor === col ? 'border-indigo-500 scale-110' : 'border-slate-300 dark:border-slate-700 opacity-80'}`}
                      style={{ backgroundColor: col }}
                      title={col}
                    />
                  ))}
                </div>
              </div>

              {/* Background Style */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {uiLang === 'en' ? 'Background & Shadow' : 'پس‌زمینه و سایه'}
                </label>
                <select
                  value={styleConfig.bgStyle}
                  onChange={(e) => setStyleConfig({ ...styleConfig, bgStyle: e.target.value as SubtitleStyleConfig['bgStyle'] })}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="semi-box">{uiLang === 'en' ? 'Semi-Transparent Box' : 'باکس مشکی نیمه‌شفاف'}</option>
                  <option value="solid-box">{uiLang === 'en' ? 'Solid Black Box' : 'باکس مشکی کامل'}</option>
                  <option value="shadow">{uiLang === 'en' ? 'Text Shadow' : 'سایه متن'}</option>
                  <option value="none">{uiLang === 'en' ? 'None' : 'بدون پس‌زمینه'}</option>
                </select>
              </div>

            </div>
          </div>

          {/* Bilingual Subtitle Controls in Video Preview */}
          {bilingualConfig && setBilingualConfig && (
            <div className="bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 flex flex-col gap-3 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {t.bilingualSubtitles}
                  </h4>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bilingualConfig.enabled}
                    onChange={(e) => setBilingualConfig({ ...bilingualConfig, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {bilingualConfig.enabled
                  ? (uiLang === 'en'
                    ? `Active: ${bilingualConfig.order === 'original-top' ? 'Original on Top' : 'Translated on Top'}`
                    : `فعال: ${bilingualConfig.order === 'original-top' ? 'متن اصلی بالا' : 'ترجمه بالا'}`)
                  : (uiLang === 'en'
                    ? 'Display original and translated subtitles together on screen.'
                    : 'نمایش همزمان زیرنویس اصلی و ترجمه شده روی ویدیو.')}
              </p>

              {onOpenBilingualModal && (
                <button
                  type="button"
                  onClick={onOpenBilingualModal}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>{t.bilingualSettings}</span>
                </button>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
