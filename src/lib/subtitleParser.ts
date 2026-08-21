import { SubtitleFormat, SubtitleItem } from '../types';
import { detectEncodingAndDecodeText } from './encodingHelper';

/**
 * Detect text encoding from ArrayBuffer using enhanced detector with jschardet and Persian Windows-1256 fallback
 */
export function detectEncodingAndDecode(buffer: ArrayBuffer): { text: string; encoding: string } {
  const result = detectEncodingAndDecodeText(buffer);
  return { text: result.text, encoding: result.encoding };
}

/**
 * Convert timestamp (e.g. "00:01:20,500" or "00:01:20.500" or "0:01:20.50") to seconds
 */
export function timestampToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().replace(',', '.');
  const parts = cleaned.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  return parseFloat(cleaned) || 0;
}

/**
 * Format seconds to SRT format: "00:01:20,500"
 */
export function secondsToSRT(seconds: number): string {
  const pad = (num: number, size: number) => num.toString().padStart(size, '0');
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

/**
 * Format seconds to VTT format: "00:01:20.500"
 */
export function secondsToVTT(seconds: number): string {
  return secondsToSRT(seconds).replace(',', '.');
}

/**
 * Format seconds to ASS/SSA format: "0:01:20.50"
 */
export function secondsToASS(seconds: number): string {
  const pad = (num: number, size: number) => num.toString().padStart(size, '0');
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor(((seconds % 1) * 100)); // centiseconds
  return `${h}:${pad(m, 2)}:${pad(s, 2)}.${pad(cs, 2)}`;
}

/**
 * Format seconds to MicroDVD frame format (assuming 25 FPS default)
 */
export function secondsToFrame(seconds: number, fps = 25): number {
  return Math.round(seconds * fps);
}

/**
 * Detect format from filename or content
 */
export function detectFormat(filename: string, content: string): SubtitleFormat {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'vtt') return 'vtt';
  if (ext === 'ass') return 'ass';
  if (ext === 'ssa') return 'ssa';
  if (ext === 'sub') return 'sub';
  if (ext === 'srt') return 'srt';

  if (content.startsWith('WEBVTT')) return 'vtt';
  if (content.includes('[Script Info]') || content.includes('Dialogue:')) return 'ass';
  if (/^\{\d+\}\{\d+\}/.test(content.trim())) return 'sub';

  return 'srt';
}

/**
 * Main parser for subtitle files
 */
export function parseSubtitleFile(content: string, filename: string): {
  items: SubtitleItem[];
  format: SubtitleFormat;
  rawHeader?: string;
} {
  const format = detectFormat(filename, content);
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  switch (format) {
    case 'vtt':
      return parseVTT(normalized);
    case 'ass':
    case 'ssa':
      return parseASS(normalized, format);
    case 'sub':
      return parseSUB(normalized);
    case 'srt':
    default:
      return parseSRT(normalized);
  }
}

/**
 * SRT Parser - Timestamp Regex Anchored Block Extraction
 */
function parseSRT(content: string): { items: SubtitleItem[]; format: SubtitleFormat } {
  const text = content.trim();
  const items: SubtitleItem[] = [];

  // Match SRT timestamp line e.g. "00:00:01,200 --> 00:00:04,500" or "0:00:01.20 --> 0:00:04.50"
  const timestampRegex = /(\d{1,2}:\d{2}:\d{2}[.,]\d{2,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[.,]\d{2,3})/g;
  
  const matches: { index: number; startStr: string; endStr: string; fullMatch: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = timestampRegex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      startStr: match[1],
      endStr: match[2],
      fullMatch: match[0],
    });
  }

  if (matches.length === 0) {
    return parseSRTFallback(text);
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextMatchIndex = i + 1 < matches.length ? matches[i + 1].index : text.length;

    // Subtitle text is located after current timestamp line and before the start/index of next timestamp
    const afterTimestampIndex = current.index + current.fullMatch.length;
    let blockTextPart = text.substring(afterTimestampIndex, nextMatchIndex);

    // If there is a next match, strip off any trailing block index number (e.g., "\n2\n") that belongs to next match
    if (i + 1 < matches.length) {
      const textLines = blockTextPart.split('\n');
      while (textLines.length > 0 && textLines[textLines.length - 1].trim() === '') {
        textLines.pop();
      }
      if (textLines.length > 0 && /^\d+$/.test(textLines[textLines.length - 1].trim())) {
        textLines.pop();
      }
      blockTextPart = textLines.join('\n');
    }

    const cleanedText = blockTextPart.trim();
    const startSec = timestampToSeconds(current.startStr);
    const endSec = timestampToSeconds(current.endStr);

    items.push({
      id: i + 1,
      startTime: current.startStr,
      endTime: current.endStr,
      startSeconds: startSec,
      endSeconds: endSec,
      originalText: cleanedText,
      translatedText: '',
    });
  }

  return { items, format: 'srt' };
}

/**
 * Fallback block-splitting parser for SRT if regex misses
 */
function parseSRTFallback(text: string): { items: SubtitleItem[]; format: SubtitleFormat } {
  const blocks = text.split(/\n\s*\n+/);
  const items: SubtitleItem[] = [];
  let autoId = 1;

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    let timeLineIdx = 0;
    if (/^\d+$/.test(lines[0])) {
      timeLineIdx = 1;
    }

    const timeLine = lines[timeLineIdx];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const [startStr, endStr] = timeLine.split('-->').map(s => s.trim());
    const textLines = lines.slice(timeLineIdx + 1).join('\n');

    items.push({
      id: autoId++,
      startTime: startStr,
      endTime: endStr,
      startSeconds: timestampToSeconds(startStr),
      endSeconds: timestampToSeconds(endStr),
      originalText: textLines,
      translatedText: '',
    });
  }

  return { items, format: 'srt' };
}

/**
 * WebVTT Parser
 */
function parseVTT(content: string): { items: SubtitleItem[]; format: SubtitleFormat } {
  const lines = content.trim().split('\n');
  const items: SubtitleItem[] = [];
  let autoId = 1;

  let currentBlock: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === 'WEBVTT' || line.startsWith('NOTE') || line.startsWith('STYLE')) {
      continue;
    }

    if (line === '') {
      if (currentBlock.length > 0) {
        processVTTBlock(currentBlock, autoId++, items);
        currentBlock = [];
      }
    } else {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length > 0) {
    processVTTBlock(currentBlock, autoId++, items);
  }

  return { items, format: 'vtt' };
}

function processVTTBlock(lines: string[], id: number, items: SubtitleItem[]) {
  let timeLineIdx = 0;
  if (!lines[0].includes('-->') && lines.length > 1 && lines[1].includes('-->')) {
    timeLineIdx = 1;
  }

  const timeLine = lines[timeLineIdx];
  if (!timeLine || !timeLine.includes('-->')) return;

  const parts = timeLine.split('-->').map(s => s.trim().split(' ')[0]);
  const startStr = parts[0];
  const endStr = parts[1];

  const textLines = lines.slice(timeLineIdx + 1).join('\n');

  items.push({
    id,
    startTime: startStr,
    endTime: endStr,
    startSeconds: timestampToSeconds(startStr),
    endSeconds: timestampToSeconds(endStr),
    originalText: textLines,
    translatedText: '',
  });
}

/**
 * ASS/SSA Parser
 */
function parseASS(content: string, format: SubtitleFormat): {
  items: SubtitleItem[];
  format: SubtitleFormat;
  rawHeader?: string;
} {
  const lines = content.split('\n');
  const items: SubtitleItem[] = [];
  const headerLines: string[] = [];
  let inEvents = false;
  let autoId = 1;

  for (const line of lines) {
    if (line.trim().startsWith('[Events]')) {
      inEvents = true;
      headerLines.push(line);
      continue;
    }

    if (!inEvents) {
      headerLines.push(line);
      continue;
    }

    if (line.trim().startsWith('Format:')) {
      headerLines.push(line);
      continue;
    }

    if (line.trim().startsWith('Dialogue:')) {
      const firstCommaIdx = line.indexOf(':');
      if (firstCommaIdx === -1) continue;

      const rest = line.substring(firstCommaIdx + 1).trim();
      const parts = rest.split(',');

      if (parts.length >= 9) {
        const startStr = parts[1].trim();
        const endStr = parts[2].trim();
        const stylePrefix = parts.slice(0, 9).join(',');
        const text = parts.slice(9).join(',').replace(/\\N/g, '\n');

        items.push({
          id: autoId++,
          startTime: startStr,
          endTime: endStr,
          startSeconds: timestampToSeconds(startStr),
          endSeconds: timestampToSeconds(endStr),
          originalText: text,
          translatedText: '',
          styleTags: stylePrefix,
        });
      }
    }
  }

  return {
    items,
    format,
    rawHeader: headerLines.join('\n'),
  };
}

/**
 * SUB Parser
 */
function parseSUB(content: string): { items: SubtitleItem[]; format: SubtitleFormat } {
  const lines = content.trim().split('\n');
  const items: SubtitleItem[] = [];
  let autoId = 1;
  const fps = 25;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const microDvdMatch = trimmed.match(/^\{(\d+)\}\{(\d+)\}(.*)/);
    if (microDvdMatch) {
      const startFrame = parseInt(microDvdMatch[1], 10);
      const endFrame = parseInt(microDvdMatch[2], 10);
      const startSec = startFrame / fps;
      const endSec = endFrame / fps;
      const text = microDvdMatch[3].replace(/\|/g, '\n');

      items.push({
        id: autoId++,
        startTime: secondsToSRT(startSec),
        endTime: secondsToSRT(endSec),
        startSeconds: startSec,
        endSeconds: endSec,
        originalText: text,
        translatedText: '',
      });
      continue;
    }

    if (trimmed.includes('-->') || trimmed.includes(',')) {
      const parts = trimmed.split(/-->|,/).map(s => s.trim());
      if (parts.length >= 2 && parts[0].includes(':')) {
        const startSec = timestampToSeconds(parts[0]);
        const endSec = timestampToSeconds(parts[1]);
        items.push({
          id: autoId++,
          startTime: parts[0],
          endTime: parts[1],
          startSeconds: startSec,
          endSeconds: endSec,
          originalText: '',
          translatedText: '',
        });
      }
    }
  }

  return { items, format: 'sub' };
}

export const RTL_LANGUAGES = ['fa', 'ar', 'he', 'ur', 'ps'];

/**
 * Ensures proper rendering of RTL punctuation in media players
 */
export function fixRTLPunctuation(text: string): string {
  if (!text) return text;
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.endsWith('\u200F')) return trimmed;
      return `${trimmed}\u200F`;
    })
    .join('\n');
}

/**
 * Export subtitles to requested format
 */
export function exportSubtitleFile(
  items: SubtitleItem[],
  targetFormat: SubtitleFormat,
  rawHeader?: string,
  isRTL?: boolean
): string {
  const processedItems = items.map((item) => {
    const rawText = item.translatedText.trim() || item.originalText.trim();
    const containsRTL = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(rawText);
    const applyRTLFix = isRTL !== undefined ? isRTL : containsRTL;
    const textWithFix = applyRTLFix ? fixRTLPunctuation(rawText) : rawText;

    if (item.translatedText.trim()) {
      return { ...item, translatedText: textWithFix };
    }
    return { ...item, originalText: textWithFix };
  });

  switch (targetFormat) {
    case 'vtt':
      return exportVTT(processedItems);
    case 'ass':
    case 'ssa':
      return exportASS(processedItems, targetFormat, rawHeader);
    case 'sub':
      return exportSUB(processedItems);
    case 'srt':
    default:
      return exportSRT(processedItems);
  }
}

function exportSRT(items: SubtitleItem[]): string {
  return items.map((item, index) => {
    const text = item.translatedText.trim() || item.originalText.trim();
    const start = secondsToSRT(item.startSeconds);
    const end = secondsToSRT(item.endSeconds);
    return `${index + 1}\n${start} --> ${end}\n${text}\n`;
  }).join('\n');
}

function exportVTT(items: SubtitleItem[]): string {
  const body = items.map((item) => {
    const text = item.translatedText.trim() || item.originalText.trim();
    const start = secondsToVTT(item.startSeconds);
    const end = secondsToVTT(item.endSeconds);
    return `${start} --> ${end}\n${text}\n`;
  }).join('\n');

  return `WEBVTT\n\n${body}`;
}

function exportASS(items: SubtitleItem[], format: SubtitleFormat, rawHeader?: string): string {
  const header = rawHeader || `[Script Info]
Title: Translated Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Vazirmatn,22,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const eventLines = items.map(item => {
    const start = secondsToASS(item.startSeconds);
    const end = secondsToASS(item.endSeconds);
    const text = (item.translatedText.trim() || item.originalText.trim()).replace(/\n/g, '\\N');
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

function exportSUB(items: SubtitleItem[]): string {
  const fps = 25;
  return items.map(item => {
    const startFrame = secondsToFrame(item.startSeconds, fps);
    const endFrame = secondsToFrame(item.endSeconds, fps);
    const text = (item.translatedText.trim() || item.originalText.trim()).replace(/\n/g, '|');
    return `{${startFrame}}{${endFrame}}${text}`;
  }).join('\n');
}
