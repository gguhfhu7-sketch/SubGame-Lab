import React, { useRef, useState } from 'react';
import { SubtitleFormat, GameFormat, AppMode } from '../types';
import { UILanguage, TRANSLATIONS } from '../lib/i18n';
import { 
  Upload, 
  FileCode2, 
  Sparkles, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Settings2,
  Gamepad2,
  Film
} from 'lucide-react';
import { SAMPLE_SRT_CONTENT, SAMPLE_GAME_CSV_DATA, SAMPLE_GAME_JSON_DATA } from '../constants';

interface FileUploadProps {
  mode: AppMode;
  onFileSelect: (content: string, fileName: string, encoding: string) => void;
  selectedEncoding: string;
  setSelectedEncoding: (enc: string) => void;
  detectedEncoding?: string;
  currentFileName?: string;
  currentFileSize?: number;
  itemCount?: number;
  currentFormat?: SubtitleFormat | GameFormat;
  uiLang: UILanguage;
  onLoadGameSample?: (type: 'csv' | 'json') => void;
  onLoadSubtitleSample?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  mode,
  onFileSelect,
  selectedEncoding,
  setSelectedEncoding,
  detectedEncoding,
  currentFileName,
  currentFileSize,
  itemCount,
  currentFormat,
  uiLang,
  onLoadGameSample,
  onLoadSubtitleSample,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[uiLang];

  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    const movieExtensions = ['srt', 'vtt', 'ass', 'ssa', 'sub', 'txt'];
    const gameExtensions = ['csv', 'json', 'txt', 'xlsx'];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (mode === 'cinema') {
      if (!ext || !movieExtensions.includes(ext)) {
        setErrorMsg(uiLang === 'en' ? 'Invalid format for Movie mode. Supported: .srt, .vtt, .ass, .ssa, .sub, .txt' : uiLang === 'ar' ? 'صيغة غير صالحة لنمط الأفلام: .srt, .vtt, .ass, .ssa, .sub' : 'فرمت نامعتبر برای حالت فیلم. فرمت‌های پشتیبانی شده: .srt, .vtt, .ass, .ssa, .sub, .txt');
        return;
      }
    } else {
      if (!ext || !gameExtensions.includes(ext)) {
        setErrorMsg(uiLang === 'en' ? 'Invalid format for Game mode. Supported: .csv, .json, .txt, .xlsx' : uiLang === 'ar' ? 'صيغة غير صالحة لنمط الألعاب: .csv, .json, .txt, .xlsx' : 'فرمت نامعتبر برای حالت بازی. فرمت‌های پشتیبانی شده: .csv, .json, .txt, .xlsx');
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        setErrorMsg(uiLang === 'en' ? 'Error reading file content.' : uiLang === 'ar' ? 'خطأ في قراءة ملف الترجمة.' : 'خطا در خواندن محتوای فایل.');
        return;
      }

      onFileSelect('', file.name, selectedEncoding);
      const customEvent = new CustomEvent('processBuffer', {
        detail: { buffer, fileName: file.name, fileSize: file.size, mode }
      });
      window.dispatchEvent(customEvent);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6 shadow-md dark:shadow-xl backdrop-blur-sm transition-colors">
      
      {/* Header with Title & Encoding */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {mode === 'game' ? (
            <Gamepad2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <Film className="w-5 h-5 text-indigo-500" />
          )}
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {mode === 'game' ? t.uploadGameTitle : t.uploadTitle}
          </h2>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
            mode === 'game' 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
          }`}>
            {mode === 'game' ? 'GAME MODE' : 'CINEMA MODE'}
          </span>
        </div>

        {/* Encoding Selector */}
        <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-between sm:justify-end">
          <label className="text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
            <Settings2 className="w-3.5 h-3.5" />
            <span>{t.encoding}:</span>
          </label>
          <select
            value={selectedEncoding}
            onChange={(e) => setSelectedEncoding(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
          >
            <option value="auto">{t.autoDetect}</option>
            <option value="UTF-8">UTF-8</option>
            <option value="Windows-1256">Windows-1256 (Persian/Arabic)</option>
            <option value="UTF-16LE">UTF-16 LE</option>
            <option value="ISO-8859-1">ISO-8859-1 (Latin)</option>
          </select>
        </div>
      </div>

      {/* Upload Drop Zone */}
      {!currentFileName ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 lg:p-10 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? mode === 'game' 
                ? 'border-purple-500 bg-purple-500/10 scale-[1.01]'
                : 'border-blue-500 bg-blue-500/10 scale-[1.01]'
              : mode === 'game'
              ? 'border-slate-300 dark:border-slate-700 hover:border-purple-500/60 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-purple-50/10 dark:hover:bg-purple-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-500/60 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-blue-50/10 dark:hover:bg-blue-950/20'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            accept={mode === 'game' ? '.csv,.json,.txt,.xlsx' : '.srt,.vtt,.ass,.ssa,.sub,.txt'}
            className="hidden"
          />

          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner ${
            mode === 'game'
              ? 'bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400'
              : 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400'
          }`}>
            <Upload className="w-7 h-7" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t.dragDropOrClick}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {mode === 'game' ? t.uploadGameSubtitle : t.uploadSubtitle}
            </p>
          </div>

          {/* Formats Supported Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
            {mode === 'game'
              ? ['.CSV', '.JSON', '.XLSX', '.TXT'].map((fmt) => (
                  <span key={fmt} className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {fmt}
                  </span>
                ))
              : ['.SRT', '.VTT', '.ASS', '.SSA', '.SUB'].map((fmt) => (
                  <span key={fmt} className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {fmt}
                  </span>
                ))}
          </div>

          {/* Quick Sample Load Buttons */}
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 w-full flex items-center justify-center gap-2 flex-wrap">
            {mode === 'game' ? (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onLoadGameSample && onLoadGameSample('csv'); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>{t.loadGameSample} (CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onLoadGameSample && onLoadGameSample('json'); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-500/30 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400" />
                  <span>{t.loadGameSample} (JSON)</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onLoadSubtitleSample && onLoadSubtitleSample(); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{t.loadSubtitleSample}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Loaded File Summary Card */
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
              mode === 'game'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
            }`}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono truncate max-w-[240px] sm:max-w-[360px]">
                  {currentFileName}
                </h3>
                <span className={`uppercase text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border ${
                  mode === 'game'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                }`}>
                  {currentFormat}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>Size: {formatBytes(currentFileSize)}</span>
                <span>•</span>
                <span>{itemCount || 0} {t.linesCount}</span>
                {detectedEncoding && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">{t.encoding}: {detectedEncoding}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-3 py-1.5 rounded-lg font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{uiLang === 'en' ? 'Loaded & Parsed' : 'فایل آماده ترجمه'}</span>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline px-2 py-1 font-medium"
            >
              {uiLang === 'en' ? 'Change file' : 'تغییر فایل'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              accept={mode === 'game' ? '.csv,.json,.txt,.xlsx' : '.srt,.vtt,.ass,.ssa,.sub,.txt'}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

    </div>
  );
};
