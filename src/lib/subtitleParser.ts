import { SubtitleFormat, SubtitleItem } from '../types';
import { detectEncodingAndDecodeText } from './encodingHelper';

/**
 * Detect text encoding from ArrayBuffer using enhanced detector with jschardet and Persian Windows-1256 fallback
 */
export function detectEncodingAndDecode(buffer: ArrayBuffer, forcedEncoding?: string): { text: string; encoding: string } {
  const result = detectEncodingAndDecodeText(buffer, forcedEncoding);
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
    const total = hours * 3600 + minutes * 60 + seconds;
    return isFinite(total) && total >= 0 ? total : 0;
  }
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    const total = minutes * 60 + seconds;
    return isFinite(total) && total >= 0 ? total : 0;
  }
  const direct = parseFloat(cleaned) || 0;
  return isFinite(direct) && direct >= 0 ? direct : 0;
}

/**
 * Validates and sanitizes start/end timecodes ensuring non-negative, finite numbers and end >= start
 */
export function validateAndSanitizeTimecodes(startSec: number, endSec: number): { start: number; end: number } {
  const safeStart = isFinite(startSec) && startSec >= 0 ? startSec : 0;
  let safeEnd = isFinite(endSec) && endSec >= 0 ? endSec : safeStart + 2;
  if (safeEnd < safeStart) {
    safeEnd = safeStart + 0.5;
  }
  return { start: safeStart, end: safeEnd };
}

/**
 * Format seconds to SRT format: "00:01:20,500"
 * Uses mathematical total millisecond rollover so ms never equals 1000 and s never equals 60.
 */
export function secondsToSRT(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const totalMs = Math.round(seconds * 1000);
  const ms = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  const pad = (num: number, size: number) => num.toString().padStart(size, '0');
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

/**
 * Format seconds to VTT format: "00:01:20.500"
 */
export function secondsToVTT(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const totalMs = Math.round(seconds * 1000);
  const ms = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  const pad = (num: number, size: number) => num.toString().padStart(size, '0');
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)}.${pad(ms, 3)}`;
}

/**
 * Format seconds to ASS/SSA format: "0:01:20.50"
 * Uses mathematical total centisecond rollover so cs never equals 100 and s never equals 60.
 */
export function secondsToASS(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const totalCs = Math.round(seconds * 100);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  const pad = (num: number, size: number) => num.toString().padStart(size, '0');
  return `${h}:${pad(m, 2)}:${pad(s, 2)}.${pad(cs, 2)}`;
}

/**
 * Format seconds to MicroDVD frame format with configurable FPS
 */
export function secondsToFrame(seconds: number, fps = 25): number {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
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

  if (content.startsWith('WEBVTT') || content.includes('\nWEBVTT')) return 'vtt';
  if (content.includes('[Script Info]') || content.includes('Dialogue:')) return 'ass';
  if (/^\{\d+\}\{\d+\}/m.test(content.trim())) return 'sub';

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
 * SRT Parser - Timestamp Regex Anchored Block Extraction with timecode validation
 */
function parseSRT(content: string): { items: SubtitleItem[]; format: SubtitleFormat } {
  const text = content.trim();
  const items: SubtitleItem[] = [];

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

    const afterTimestampIndex = current.index + current.fullMatch.length;
    let blockTextPart = text.substring(afterTimestampIndex, nextMatchIndex);

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
    const rawStart = timestampToSeconds(current.startStr);
    const rawEnd = timestampToSeconds(current.endStr);
    const { start: startSec, end: endSec } = validateAndSanitizeTimecodes(rawStart, rawEnd);

    items.push({
      id: i + 1,
      startTime: current.startStr.replace('.', ','),
      endTime: current.endStr.replace('.', ','),
      startSeconds: startSec,
      endSeconds: endSec,
      originalText: cleanedText,
      translatedText: '',
    });
  }

  return { items, format: 'srt' };
}

function parseSRTFallback(text: string): { items: SubtitleItem[]; format: SubtitleFormat } {
  const blocks = text.split(/\n\s*\n+/);
  const items: SubtitleItem[] = [];
  let autoId = 1;

  for (const block of blocks) {
    const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    let timeLineIdx = 0;
    if (/^\d+$/.test(lines[0])) {
      timeLineIdx = 1;
    }

    const timeLine = lines[timeLineIdx];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    const textLines = lines.slice(timeLineIdx + 1).join('\n');

    const rawStart = timestampToSeconds(startStr);
    const rawEnd = timestampToSeconds(endStr);
    const { start: startSec, end: endSec } = validateAndSanitizeTimecodes(rawStart, rawEnd);

    items.push({
      id: autoId++,
      startTime: startStr.replace('.', ','),
      endTime: endStr.replace('.', ','),
      startSeconds: startSec,
      endSeconds: endSec,
      originalText: textLines,
      translatedText: '',
    });
  }

  return { items, format: 'srt' };
}

/**
 * WebVTT Parser preserving NOTE, STYLE, REGION header sections and cue settings
 */
function parseVTT(content: string): { items: SubtitleItem[]; format: SubtitleFormat; rawHeader?: string } {
  const lines = content.split('\n');
  const items: SubtitleItem[] = [];
  const headerBlocks: string[] = [];
  let autoId = 1;

  let inHeader = true;
  let currentBlock: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Check if line is timestamp line
    if (line.includes('-->')) {
      inHeader = false;
      if (currentBlock.length > 0) {
        // If currentBlock had cue identifier before this timestamp line, keep it with the cue
        const prevLines = [...currentBlock];
        currentBlock = [];
        // Extract any leading lines that were not cue identifiers into header if still at top
        currentBlock.push(...prevLines);
      }
      currentBlock.push(rawLine);
      continue;
    }

    if (inHeader) {
      headerBlocks.push(rawLine);
      continue;
    }

    if (line === '') {
      if (currentBlock.length > 0) {
        processVTTBlock(currentBlock, autoId++, items);
        currentBlock = [];
      }
    } else {
      currentBlock.push(rawLine);
    }
  }

  if (currentBlock.length > 0) {
    processVTTBlock(currentBlock, autoId++, items);
  }

  return {
    items,
    format: 'vtt',
    rawHeader: headerBlocks.join('\n').trim(),
  };
}

function processVTTBlock(lines: string[], id: number, items: SubtitleItem[]) {
  let timeLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('-->')) {
      timeLineIdx = i;
      break;
    }
  }

  if (timeLineIdx === -1) return;

  const timeLine = lines[timeLineIdx];
  const parts = timeLine.split('-->');
  if (parts.length < 2) return;

  const startPart = parts[0].trim();
  const endWithSettings = parts[1].trim();

  // WebVTT settings follow after end timestamp e.g. "00:01:25.000 line:0 position:20% align:start"
  const endTokens = endWithSettings.split(/\s+/);
  const endPart = endTokens[0];
  const settings = endTokens.slice(1).join(' ');

  const textLines = lines.slice(timeLineIdx + 1).join('\n').trim();

  const rawStart = timestampToSeconds(startPart);
  const rawEnd = timestampToSeconds(endPart);
  const { start: startSec, end: endSec } = validateAndSanitizeTimecodes(rawStart, rawEnd);

  items.push({
    id,
    startTime: startPart,
    endTime: endPart,
    startSeconds: startSec,
    endSeconds: endSec,
    originalText: textLines,
    translatedText: '',
    styleTags: settings || undefined,
  });
}

/**
 * ASS/SSA Parser with dynamic Format: column mapping
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
  let eventFormatCols: string[] = ['layer', 'start', 'end', 'style', 'name', 'marginl', 'marginr', 'marginv', 'effect', 'text'];
  let autoId = 1;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('[Events]')) {
      inEvents = true;
      headerLines.push(line);
      continue;
    }

    if (!inEvents) {
      headerLines.push(line);
      continue;
    }

    if (trimmed.startsWith('Format:')) {
      headerLines.push(line);
      const colsRaw = trimmed.substring(7).trim();
      eventFormatCols = colsRaw.split(',').map((c) => c.trim().toLowerCase());
      continue;
    }

    if (trimmed.startsWith('Dialogue:') || trimmed.startsWith('Comment:')) {
      const isComment = trimmed.startsWith('Comment:');
      const firstColonIdx = line.indexOf(':');
      if (firstColonIdx === -1) continue;

      const rest = line.substring(firstColonIdx + 1).trim();
      
      // Dynamic column parsing based on Format: specification
      const startColIdx = eventFormatCols.indexOf('start');
      const endColIdx = eventFormatCols.indexOf('end');
      const textColIdx = eventFormatCols.indexOf('text');
      const expectedFieldCount = eventFormatCols.length;

      // Split up to expectedFieldCount - 1 commas so text can contain commas
      const splitLimit = Math.max(textColIdx !== -1 ? textColIdx : expectedFieldCount - 1, 1);
      const parts: string[] = [];
      let currentIdx = 0;

      for (let p = 0; p < splitLimit; p++) {
        const nextComma = rest.indexOf(',', currentIdx);
        if (nextComma === -1) break;
        parts.push(rest.substring(currentIdx, nextComma).trim());
        currentIdx = nextComma + 1;
      }
      parts.push(rest.substring(currentIdx)); // Remainder is text

      const startIdx = startColIdx !== -1 ? startColIdx : 1;
      const endIdx = endColIdx !== -1 ? endColIdx : 2;
      const textIdx = textColIdx !== -1 ? textColIdx : parts.length - 1;

      const startStr = parts[startIdx] || '0:00:00.00';
      const endStr = parts[endIdx] || '0:00:05.00';
      const rawText = parts[textIdx] || '';
      const text = rawText.replace(/\\N/g, '\n').replace(/\\n/g, '\n');

      const rawStart = timestampToSeconds(startStr);
      const rawEnd = timestampToSeconds(endStr);
      const { start: startSec, end: endSec } = validateAndSanitizeTimecodes(rawStart, rawEnd);

      // Store non-text columns for faithful reconstruction
      const prefixParts = parts.slice(0, textIdx);

      items.push({
        id: autoId++,
        startTime: startStr,
        endTime: endStr,
        startSeconds: startSec,
        endSeconds: endSec,
        originalText: isComment ? `{Comment} ${text}` : text,
        translatedText: '',
        styleTags: prefixParts.join(','),
      });
    } else {
      headerLines.push(line);
    }
  }

  return {
    items,
    format,
    rawHeader: headerLines.join('\n'),
  };
}

/**
 * MicroDVD (.sub) Parser with header FPS auto-detection
 */
function parseSUB(content: string): { items: SubtitleItem[]; format: SubtitleFormat } {
  const lines = content.trim().split('\n');
  const items: SubtitleItem[] = [];
  let autoId = 1;
  let detectedFps = 25;

  // Scan first 5 lines for {1}{1}23.976 or {1}{1}25.000 or {0}{0}25 FPS header
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const headerMatch = lines[i].trim().match(/^\{[01]\}\{[01]\}([0-9.]+)/);
    if (headerMatch) {
      const parsedFps = parseFloat(headerMatch[1]);
      if (isFinite(parsedFps) && parsedFps > 10 && parsedFps < 120) {
        detectedFps = parsedFps;
        break;
      }
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip the FPS definition line itself if present
    if (/^\{[01]\}\{[01]\}[0-9.]+$/.test(trimmed)) {
      continue;
    }

    const microDvdMatch = trimmed.match(/^\{(\d+)\}\{(\d+)\}(.*)/);
    if (microDvdMatch) {
      const startFrame = parseInt(microDvdMatch[1], 10);
      const endFrame = parseInt(microDvdMatch[2], 10);
      const rawStartSec = startFrame / detectedFps;
      const rawEndSec = endFrame / detectedFps;
      const { start: startSec, end: endSec } = validateAndSanitizeTimecodes(rawStartSec, rawEndSec);
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
      const parts = trimmed.split(/-->|,/).map((s) => s.trim());
      if (parts.length >= 2 && parts[0].includes(':')) {
        const rawStart = timestampToSeconds(parts[0]);
        const rawEnd = timestampToSeconds(parts[1]);
        const { start: startSec, end: endSec } = validateAndSanitizeTimecodes(rawStart, rawEnd);
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
  isRTL?: boolean,
  appendRTLMarkers = true
): string {
  const processedItems = items.map((item) => {
    const rawText = item.translatedText.trim() || item.originalText.trim();
    const containsRTL = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(rawText);
    const applyRTLFix = appendRTLMarkers && (isRTL !== undefined ? isRTL : containsRTL);
    const textWithFix = applyRTLFix ? fixRTLPunctuation(rawText) : rawText;

    if (item.translatedText.trim()) {
      return { ...item, translatedText: textWithFix };
    }
    return { ...item, originalText: textWithFix };
  });

  switch (targetFormat) {
    case 'vtt':
      return exportVTT(processedItems, rawHeader);
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
  return items
    .map((item, index) => {
      const text = item.translatedText.trim() || item.originalText.trim();
      const start = secondsToSRT(item.startSeconds);
      const end = secondsToSRT(item.endSeconds);
      return `${index + 1}\n${start} --> ${end}\n${text}\n`;
    })
    .join('\n');
}

function exportVTT(items: SubtitleItem[], rawHeader?: string): string {
  const header = rawHeader && rawHeader.startsWith('WEBVTT') ? rawHeader : 'WEBVTT';
  const body = items
    .map((item) => {
      const text = item.translatedText.trim() || item.originalText.trim();
      const start = secondsToVTT(item.startSeconds);
      const end = secondsToVTT(item.endSeconds);
      const settingsStr = item.styleTags ? ` ${item.styleTags}` : '';
      return `${start} --> ${end}${settingsStr}\n${text}\n`;
    })
    .join('\n');

  return `${header}\n\n${body}`;
}

function exportASS(items: SubtitleItem[], _format: SubtitleFormat, rawHeader?: string): string {
  const header =
    rawHeader ||
    `[Script Info]
Title: Translated Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Vazirmatn,22,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const eventLines = items
    .map((item) => {
      const start = secondsToASS(item.startSeconds);
      const end = secondsToASS(item.endSeconds);
      const cleanText = (item.translatedText.trim() || item.originalText.trim()).replace(/\n/g, '\\N');
      let prefix = item.styleTags;
      if (prefix) {
        const parts = prefix.split(',');
        if (parts.length >= 3) {
          parts[1] = start;
          parts[2] = end;
          prefix = parts.join(',');
        } else {
          prefix = `0,${start},${end},Default,,0,0,0,`;
        }
      } else {
        prefix = `0,${start},${end},Default,,0,0,0,`;
      }
      return `Dialogue: ${prefix},${cleanText}`;
    })
    .join('\n');

  return `${header}\n${eventLines}\n`;
}

function exportSUB(items: SubtitleItem[]): string {
  const fps = 25;
  const header = `{1}{1}${fps}\n`;
  const body = items
    .map((item) => {
      const startFrame = secondsToFrame(item.startSeconds, fps);
      const endFrame = secondsToFrame(item.endSeconds, fps);
      const text = (item.translatedText.trim() || item.originalText.trim()).replace(/\n/g, '|');
      return `{${startFrame}}{${endFrame}}${text}`;
    })
    .join('\n');
  return `${header}${body}`;
}
