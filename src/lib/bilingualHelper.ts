import { SubtitleItem, SubtitleFormat, BilingualConfig } from '../types';
import { 
  exportSubtitleFile, 
  secondsToSRT, 
  secondsToVTT, 
  secondsToASS, 
  secondsToFrame, 
  fixRTLPunctuation 
} from './subtitleParser';

export const DEFAULT_BILINGUAL_CONFIG: BilingualConfig = {
  enabled: false,
  order: 'original-top',
  separator: '\n',
  wrapSecondary: 'none',
  secondaryColor: '#FFFF00', // Yellow
  secondarySizePercent: 85,
  primaryColor: '#FFFFFF',
};

/**
 * Wraps secondary text according to wrap setting (parentheses, brackets, curly)
 */
export function wrapText(text: string, wrap: BilingualConfig['wrapSecondary']): string {
  if (!text) return '';
  switch (wrap) {
    case 'parentheses':
      return `(${text})`;
    case 'brackets':
      return `[${text}]`;
    case 'curly':
      return `{${text}}`;
    case 'none':
    default:
      return text;
  }
}

/**
 * Checks if a string contains RTL characters (Persian, Arabic, Hebrew, etc.)
 */
export function containsRTLText(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/**
 * Extracts and cleans actual translation if originalText was accidentally prepended or duplicated
 */
export function sanitizeTranslation(original: string, translated: string): string {
  if (!translated) return '';
  let cleanT = translated.trim();
  const cleanO = (original || '').trim();
  if (!cleanO) return cleanT;

  // If translatedText is identical to original, it means it's untranslated
  if (cleanT === cleanO) {
    return '';
  }

  // If translatedText repeatedly starts with the original text (e.g. from previous corrupted merges)
  let changed = true;
  while (changed) {
    changed = false;
    if (cleanT.startsWith(cleanO + '\n')) {
      cleanT = cleanT.substring(cleanO.length).replace(/^[\r\n\s]+/, '');
      changed = true;
    } else if (cleanT.startsWith(cleanO + '\r\n')) {
      cleanT = cleanT.substring(cleanO.length).replace(/^[\r\n\s]+/, '');
      changed = true;
    } else if (cleanT.startsWith(cleanO + ' - ')) {
      cleanT = cleanT.substring((cleanO + ' - ').length).trim();
      changed = true;
    } else if (cleanT.startsWith(cleanO + ' | ')) {
      cleanT = cleanT.substring((cleanO + ' | ').length).trim();
      changed = true;
    } else if (cleanT.startsWith(cleanO + ' • ')) {
      cleanT = cleanT.substring((cleanO + ' • ').length).trim();
      changed = true;
    }
  }

  return cleanT;
}

/**
 * Repairs a list of subtitle items by stripping any corrupted duplicated original text from translatedText
 */
export function repairCorruptedSubtitleItems(items: SubtitleItem[]): SubtitleItem[] {
  return items.map((item) => {
    const cleanedTranslation = sanitizeTranslation(item.originalText, item.translatedText);
    return {
      ...item,
      translatedText: cleanedTranslation,
    };
  });
}

/**
 * Generates combined bilingual text string from original and translated lines with clear line separation
 */
export function formatBilingualText(
  original: string,
  translated: string,
  config?: BilingualConfig,
  isTargetRTL?: boolean
): string {
  const safeConfig: BilingualConfig = { ...DEFAULT_BILINGUAL_CONFIG, ...(config || {}) };
  const cleanOriginal = (original || '').trim();
  const cleanTranslated = sanitizeTranslation(cleanOriginal, translated);

  // If one of them is empty, return the available text
  if (!cleanOriginal && cleanTranslated) {
    const applyRTL = isTargetRTL !== undefined ? isTargetRTL : containsRTLText(cleanTranslated);
    return applyRTL ? fixRTLPunctuation(cleanTranslated) : cleanTranslated;
  }
  if (cleanOriginal && !cleanTranslated) {
    return cleanOriginal;
  }
  if (!cleanOriginal && !cleanTranslated) {
    return '';
  }

  const applyRTLTranslated = isTargetRTL !== undefined ? isTargetRTL : containsRTLText(cleanTranslated);
  const formattedTranslated = applyRTLTranslated ? fixRTLPunctuation(cleanTranslated) : cleanTranslated;

  let firstText: string;
  let secondText: string;

  if (safeConfig.order === 'original-top') {
    firstText = cleanOriginal;
    secondText = wrapText(formattedTranslated, safeConfig.wrapSecondary);
  } else {
    firstText = formattedTranslated;
    secondText = wrapText(cleanOriginal, safeConfig.wrapSecondary);
  }

  const separator = safeConfig.separator || '\n';
  return `${firstText.trim()}${separator}${secondText.trim()}`;
}

/**
 * Converts Hex color (e.g. #FFFF00) to ASS format (&H0000FFFF&)
 * Note: ASS colors are BGR: &H00BBGGRR&
 */
export function hexToASSColor(hex: string): string {
  const clean = (hex || '').replace('#', '');
  if (clean.length === 6) {
    const r = clean.substring(0, 2);
    const g = clean.substring(2, 4);
    const b = clean.substring(4, 6);
    return `&H00${b}${g}${r}&`;
  }
  return '&H0000FFFF&'; // fallback yellow
}

/**
 * Format bilingual text specifically for ASS/SSA styling tags
 */
export function formatBilingualForASS(
  original: string,
  translated: string,
  config?: BilingualConfig,
  isTargetRTL?: boolean
): string {
  const safeConfig: BilingualConfig = { ...DEFAULT_BILINGUAL_CONFIG, ...(config || {}) };
  const cleanOriginal = (original || '').trim();
  const cleanTranslated = sanitizeTranslation(cleanOriginal, translated);

  if (!cleanOriginal) return cleanTranslated.replace(/\n/g, '\\N');
  if (!cleanTranslated) return cleanOriginal.replace(/\n/g, '\\N');

  const applyRTL = isTargetRTL !== undefined ? isTargetRTL : containsRTLText(cleanTranslated);
  const fixedTranslated = applyRTL ? fixRTLPunctuation(cleanTranslated) : cleanTranslated;

  const secondaryColorASS = hexToASSColor(safeConfig.secondaryColor);
  const fontScaleTag = safeConfig.secondarySizePercent !== 100 
    ? `{\\fscx${safeConfig.secondarySizePercent}\\fscy${safeConfig.secondarySizePercent}}` 
    : '';

  let firstPart: string;
  let secondPart: string;

  if (safeConfig.order === 'original-top') {
    firstPart = cleanOriginal.replace(/\n/g, '\\N');
    const wrapped = wrapText(fixedTranslated, safeConfig.wrapSecondary).replace(/\n/g, '\\N');
    secondPart = `{\\c${secondaryColorASS}}${fontScaleTag}${wrapped}{\\r}`;
  } else {
    firstPart = fixedTranslated.replace(/\n/g, '\\N');
    const wrapped = wrapText(cleanOriginal, safeConfig.wrapSecondary).replace(/\n/g, '\\N');
    secondPart = `{\\c${secondaryColorASS}}${fontScaleTag}${wrapped}{\\r}`;
  }

  const sep = safeConfig.separator === '\n' ? '\\N' : safeConfig.separator;
  return `${firstPart}${sep}${secondPart}`;
}

/**
 * Produces a list of SubtitleItem where translatedText contains the combined bilingual string
 */
export function generateBilingualSubtitleItems(
  items: SubtitleItem[],
  config?: BilingualConfig,
  isTargetRTL?: boolean
): SubtitleItem[] {
  const safeConfig: BilingualConfig = { ...DEFAULT_BILINGUAL_CONFIG, ...(config || {}) };
  return items.map((item) => {
    const bilingualText = formatBilingualText(
      item.originalText,
      item.translatedText,
      safeConfig,
      isTargetRTL
    );
    return {
      ...item,
      translatedText: bilingualText,
    };
  });
}

/**
 * Direct export for Bilingual Subtitle file
 */
export function exportBilingualSubtitleFile(
  items: SubtitleItem[],
  targetFormat: SubtitleFormat,
  config?: BilingualConfig,
  rawHeader?: string,
  isTargetRTL?: boolean
): string {
  const safeConfig: BilingualConfig = { ...DEFAULT_BILINGUAL_CONFIG, ...(config || {}) };
  if (targetFormat === 'ass' || targetFormat === 'ssa') {
    const header = rawHeader || `[Script Info]
Title: Bilingual Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Vazirmatn,22,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

    const eventLines = items.map((item) => {
      const start = secondsToASS(item.startSeconds);
      const end = secondsToASS(item.endSeconds);
      const text = formatBilingualForASS(item.originalText, item.translatedText, safeConfig, isTargetRTL);
      let prefix = item.styleTags;
      if (prefix) {
        const parts = prefix.split(',');
        if (parts.length >= 9) {
          parts[1] = start;
          parts[2] = end;
          prefix = parts.join(',');
        } else {
          prefix = `0,${start},${end},Default,,0,0,0,`;
        }
      } else {
        prefix = `0,${start},${end},Default,,0,0,0,`;
      }
      return `Dialogue: ${prefix},${text}`;
    }).join('\n');

    return `${header}\n${eventLines}\n`;
  }

  // For SRT, VTT, SUB: create bilingual items and export
  const bilingualItems = generateBilingualSubtitleItems(items, safeConfig, isTargetRTL);
  return exportSubtitleFile(bilingualItems, targetFormat, rawHeader, isTargetRTL);
}
