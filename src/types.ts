/**
 * Types for Universal Subtitle & Game Localization Translator
 */

export type AppMode = 'cinema' | 'game';

export type TranslationMethod = 'batch' | 'stream';

export type AIModelId = 
  | 'gemini-3.6-flash'
  | 'gemini-live-stream'
  | 'gemini-3.1-pro'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash';

export interface AIModelOption {
  id: AIModelId;
  name: string;
  badge: string;
  badgeColor: string;
  descriptionFa: string;
  descriptionEn: string;
  descriptionAr: string;
  isStreaming?: boolean;
}

export type SubtitleFormat = 'srt' | 'vtt' | 'ass' | 'ssa' | 'sub';
export type GameFormat = 'csv' | 'json' | 'txt' | 'xlsx';

export type ToneOption = 
  | 'cinematic' 
  | 'conversational' 
  | 'formal' 
  | 'humorous' 
  | 'educational' 
  | 'epic' 
  | 'custom';

export interface ToneInfo {
  id: ToneOption;
  labelFa: string;
  labelEn: string;
  descriptionFa: string;
  iconName: string;
}

export interface LanguageOption {
  code: string;
  nameFa: string;
  nameEn: string;
  nameAr?: string;
  flag: string;
}

export interface SubtitleItem {
  id: number;
  startTime: string;  // e.g. "00:01:20,500" or "00:01:20.50"
  endTime: string;    // e.g. "00:01:24,100"
  startSeconds: number;
  endSeconds: number;
  originalText: string;
  translatedText: string;
  styleTags?: string; // ASS/SSA styling or header tags if any
  isEditing?: boolean;
  sourceModified?: boolean;
  gameKey?: string;
  context?: string;
  variables?: string[];
  rawRowData?: Record<string, any>;
}

export interface GameLocalizationItem {
  id: number;
  key?: string;           // Identifier / Key name / ID
  originalText: string;
  translatedText: string;
  context?: string;       // Speaker name, category, or notes
  variables?: string[];   // Detected code tokens like {player_name}, {0}, %s, $amount, etc.
  rawRowData?: Record<string, any>; // Underlying row representation for accurate reconstruction
  isEditing?: boolean;
  sourceModified?: boolean;
}

export interface GameColumnMapping {
  sourceColumn: string;
  targetColumn: string;
  keyColumn?: string;
  contextColumn?: string;
  hasHeaders: boolean;
}

export interface VerifyTranslationRequest {
  items: Array<{ id: number; originalText: string; translatedText: string }>;
  targetLanguage: string;
  tone: ToneOption;
  customPrompt?: string;
  mode?: AppMode;
}

export interface VerifyTranslationResponse {
  reviewedItems: { id: number; translatedText: string; notes?: string }[];
  lineCountMatch: boolean;
  refinedCount: number;
  untranslatedFixedCount: number;
  error?: string;
}

export interface BatchTranslateRequest {
  items: { id: number; text: string; key?: string; context?: string }[];
  sourceLanguage?: string;
  targetLanguage: string;
  tone: ToneOption;
  customPrompt?: string;
  mode?: AppMode;
}

export interface BatchTranslateResponse {
  translations: { id: number; text: string }[];
  detectedSourceLanguage?: string;
  error?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export type BilingualOrder = 'original-top' | 'translated-top';
export type BilingualSeparator = '\n' | ' - ' | ' / ' | ' | ' | ' • ';
export type BilingualWrap = 'none' | 'parentheses' | 'brackets' | 'curly';

export interface BilingualConfig {
  enabled: boolean;
  order: BilingualOrder;
  separator: BilingualSeparator;
  wrapSecondary: BilingualWrap;
  secondaryColor: string; // e.g. '#FFFF00'
  secondarySizePercent: number; // e.g. 85
  primaryColor?: string; // e.g. '#FFFFFF'
}

export type BatchSizeOption = 25 | 35 | 50 | 100;

export interface AdvancedSettings {
  batchSize: BatchSizeOption;
  skipCodeOnly: boolean;
  appendRTLMarkers: boolean;
}



