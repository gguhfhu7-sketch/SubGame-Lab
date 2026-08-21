import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { GameFormat, GameLocalizationItem, GameColumnMapping } from '../types';
import { detectEncodingAndDecodeText, createUtf8BomBlob, createUtf8Blob } from './encodingHelper';

/**
 * Regex for identifying in-game variables, formatting tags, and placeholders
 * e.g. {player_name}, {0}, %s, %d, $amount, \n, \r, \t, <b>, <color=#FF0000>, <font=Title>
 */
export const GAME_VARIABLE_REGEX = /(\{[a-zA-Z0-9_]+\}|\{\d+\}|%[0-9]*[sdif]|%[a-zA-Z0-9_]+|\$[a-zA-Z0-9_]+|<[^>]+>|\\n|\\r|\\t|\[[a-zA-Z0-9_]+\])/g;

export function extractVariables(text: string): string[] {
  if (!text) return [];
  const matches = text.match(GAME_VARIABLE_REGEX);
  if (!matches) return [];
  return Array.from(new Set(matches));
}

export const extractGameVariables = extractVariables;

/**
 * Detect game localization format from file name or extension
 */
export function detectGameFormat(filename: string): GameFormat {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'csv') return 'csv';
  if (ext === 'json') return 'json';
  if (ext === 'xlsx') return 'xlsx';
  return 'txt';
}

export interface ParseGameResult {
  items: GameLocalizationItem[];
  format: GameFormat;
  columns?: string[];
  suggestedMapping?: GameColumnMapping;
  originalRawStructure?: any;
}

/**
 * Parse game localization file (.csv, .json, .txt, .xlsx)
 */
export async function parseGameLocalizationFile(
  buffer: ArrayBuffer,
  fileName: string,
  forcedEncoding?: string
): Promise<ParseGameResult> {
  const format = detectGameFormat(fileName);

  if (format === 'xlsx') {
    return parseXLSX(buffer);
  }

  const { text } = detectEncodingAndDecodeText(buffer);
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  if (format === 'csv') {
    return parseCSV(normalized);
  }

  if (format === 'json') {
    return parseJSON(normalized);
  }

  return parseTXT(normalized);
}

/**
 * Parse CSV files with PapaParse supporting multiline quotes, paragraphs, and special characters
 */
function parseCSV(content: string): ParseGameResult {
  // Strip BOM if present
  const cleanContent = content.replace(/^\uFEFF/, '').trim();
  if (!cleanContent) {
    return {
      items: [],
      format: 'csv',
      columns: ['Source', 'Translation'],
      suggestedMapping: {
        sourceColumn: 'Source',
        targetColumn: 'Translation',
        hasHeaders: true,
      },
    };
  }

  // First attempt: Parse with headers enabled
  let parsed = Papa.parse(cleanContent, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
    delimitersToGuess: [',', '\t', ';', '|'],
    transformHeader: (h) => (h ? h.trim() : ''),
  });

  let columns = (parsed.meta.fields || []).filter((c) => c && c.trim() !== '');
  let rawRows = (parsed.data as Record<string, any>[]).filter(
    (row) => row && typeof row === 'object' && Object.values(row).some((val) => val !== undefined && val !== null && String(val).trim() !== '')
  );

  // Fallback if header parsing yielded no valid columns or failed
  if (columns.length === 0 || rawRows.length === 0) {
    const rawParsed = Papa.parse(cleanContent, {
      header: false,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      delimitersToGuess: [',', '\t', ';', '|'],
    });

    const rawData = (rawParsed.data as any[][]).filter(
      (r) => Array.isArray(r) && r.some((cell) => cell !== undefined && cell !== null && String(cell).trim() !== '')
    );

    if (rawData.length > 0) {
      // First row as headers if available, or generate default column names
      const firstRow = rawData[0];
      const hasHeaderCandidate = firstRow.every((cell) => typeof cell === 'string' && cell.length < 100);
      
      if (hasHeaderCandidate && rawData.length > 1) {
        columns = firstRow.map((c, i) => String(c || `Column_${i + 1}`).trim());
        rawRows = rawData.slice(1).map((rowArr) => {
          const rowObj: Record<string, any> = {};
          columns.forEach((col, idx) => {
            rowObj[col] = rowArr[idx] !== undefined && rowArr[idx] !== null ? String(rowArr[idx]) : '';
          });
          return rowObj;
        });
      } else {
        const maxCols = Math.max(...rawData.map((r) => r.length), 2);
        columns = Array.from({ length: maxCols }, (_, i) => `Column_${i + 1}`);
        rawRows = rawData.map((rowArr) => {
          const rowObj: Record<string, any> = {};
          columns.forEach((col, idx) => {
            rowObj[col] = rowArr[idx] !== undefined && rowArr[idx] !== null ? String(rowArr[idx]) : '';
          });
          return rowObj;
        });
      }
    }
  }

  // Ensure all columns exist across all rows to avoid undefined indexing
  rawRows = rawRows.map((row) => {
    const cleanRow: Record<string, any> = { ...row };
    columns.forEach((col) => {
      if (cleanRow[col] === undefined || cleanRow[col] === null) {
        cleanRow[col] = '';
      }
    });
    return cleanRow;
  });

  // Heuristically suggest source, target, and key columns
  let sourceCol = '';
  let targetCol = '';
  let keyCol = '';
  let contextCol = '';

  const lowerCols = columns.map((c) => c.toLowerCase());

  // Source column heuristic (dialogue, text, original, en, string, value, content, etc.)
  const sourceKeywords = ['source_text', 'source text', 'source', 'dialogue', 'dialog', 'speech', 'text', 'original', 'en', 'english', 'string', 'value', 'line', 'msg', 'message', 'content', 'body', 'paragraph', 'description'];
  for (const kw of sourceKeywords) {
    const foundIdx = lowerCols.findIndex((c) => c === kw || c.includes(kw));
    if (foundIdx !== -1) {
      sourceCol = columns[foundIdx];
      break;
    }
  }
  if (!sourceCol && columns.length > 0) {
    sourceCol = columns[0];
  }

  // Target column heuristic (target, translation, translated, fa, persian, loc, etc.)
  const targetKeywords = ['target_text', 'target text', 'target', 'translation', 'translated', 'persian', 'fa', 'farsi', 'loc', 'localized', 'dest', 'result'];
  for (const kw of targetKeywords) {
    const foundIdx = lowerCols.findIndex((c, colIndex) => (c === kw || c.includes(kw)) && columns[colIndex] !== sourceCol);
    if (foundIdx !== -1) {
      targetCol = columns[foundIdx];
      break;
    }
  }
  if (!targetCol) {
    targetCol = columns.find((c) => c !== sourceCol && !c.toLowerCase().includes('id') && !c.toLowerCase().includes('key')) || 'Translation';
  }

  // Key column heuristic (id, key, name, string_id, code, tag, etc.)
  const keyKeywords = ['string_id', 'id', 'key', 'name', 'code', 'tag', 'identifier', 'entry', 'guid', 'label'];
  for (const kw of keyKeywords) {
    const foundIdx = lowerCols.findIndex((c, colIndex) => (c === kw || c.endsWith('_id') || c.startsWith('id_') || c === 'key') && columns[colIndex] !== sourceCol);
    if (foundIdx !== -1) {
      keyCol = columns[foundIdx];
      break;
    }
  }

  // Context column heuristic (speaker, character, category, comment, notes, actor, type)
  const contextKeywords = ['speaker', 'character', 'context', 'category', 'comment', 'notes', 'actor', 'type', 'section'];
  for (const kw of contextKeywords) {
    const foundIdx = lowerCols.findIndex((c, colIndex) => {
      const colName = columns[colIndex];
      return (c === kw || c.includes(kw)) && colName !== sourceCol && colName !== targetCol && colName !== keyCol;
    });
    if (foundIdx !== -1) {
      contextCol = columns[foundIdx];
      break;
    }
  }

  const items: GameLocalizationItem[] = rawRows.map((row, index) => {
    const original = String(row[sourceCol] ?? '').trim();
    const translated = targetCol && row[targetCol] !== undefined ? String(row[targetCol]).trim() : '';
    const keyVal = keyCol && row[keyCol] ? String(row[keyCol]).trim() : `ROW_${index + 1}`;
    const contextVal = contextCol && row[contextCol] ? String(row[contextCol]).trim() : undefined;

    return {
      id: index + 1,
      key: keyVal,
      originalText: original,
      translatedText: translated,
      context: contextVal,
      variables: extractVariables(original),
      rawRowData: row,
    };
  });

  return {
    items,
    format: 'csv',
    columns: columns.length > 0 ? columns : ['Source', 'Translation'],
    suggestedMapping: {
      sourceColumn: sourceCol || (columns[0] || 'Source'),
      targetColumn: targetCol || 'Translation',
      keyColumn: keyCol || undefined,
      contextColumn: contextCol || undefined,
      hasHeaders: true,
    },
    originalRawStructure: { rawRows, columns },
  };
}

/**
 * Parse XLSX files using ExcelJS
 */
async function parseXLSX(buffer: ArrayBuffer): Promise<ParseGameResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0] || workbook.getWorksheet(1);
  if (!worksheet) {
    throw new Error('فایل اکسل دارای برگه داده (Worksheet) نیست.');
  }

  const rows: any[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const rowValues = Array.isArray(row.values) ? row.values.slice(1) : [];
    rows.push(rowValues.map((v) => (v === null || v === undefined ? '' : typeof v === 'object' && 'text' in v ? (v as any).text : String(v))));
  });

  if (rows.length === 0) {
    return {
      items: [],
      format: 'xlsx',
      columns: ['Source', 'Translation'],
    };
  }

  const headerRow = rows[0].map((h, i) => String(h || `Column_${i + 1}`).trim());
  const dataRows = rows.slice(1);

  const rawRows: Record<string, any>[] = dataRows.map((r) => {
    const rowObj: Record<string, any> = {};
    headerRow.forEach((colName, idx) => {
      rowObj[colName] = r[idx] !== undefined ? r[idx] : '';
    });
    return rowObj;
  });

  // Utilize the CSV mapping logic for column detection
  const lowerCols = headerRow.map((c) => c.toLowerCase());
  let sourceCol = headerRow[0];
  let targetCol = headerRow.length > 1 ? headerRow[1] : 'Translation';
  let keyCol = '';
  let contextCol = '';

  const sourceKeywords = ['source', 'text', 'original', 'en', 'english', 'dialogue', 'string', 'value'];
  for (const kw of sourceKeywords) {
    const foundIdx = lowerCols.findIndex((c) => c.includes(kw));
    if (foundIdx !== -1) {
      sourceCol = headerRow[foundIdx];
      break;
    }
  }

  const targetKeywords = ['target', 'translation', 'translated', 'fa', 'persian', 'farsi', 'loc'];
  for (const kw of targetKeywords) {
    const foundIdx = lowerCols.findIndex((c, colIndex) => c.includes(kw) && headerRow[colIndex] !== sourceCol);
    if (foundIdx !== -1) {
      targetCol = headerRow[foundIdx];
      break;
    }
  }

  const keyKeywords = ['id', 'key', 'name', 'code', 'identifier'];
  for (const kw of keyKeywords) {
    const foundIdx = lowerCols.findIndex((c, colIndex) => (c === kw || c.endsWith('_id') || c === 'key') && headerRow[colIndex] !== sourceCol);
    if (foundIdx !== -1) {
      keyCol = headerRow[foundIdx];
      break;
    }
  }

  const items: GameLocalizationItem[] = rawRows.map((row, index) => {
    const original = String(row[sourceCol] || '').trim();
    const translated = targetCol && row[targetCol] ? String(row[targetCol]).trim() : '';
    const keyVal = keyCol && row[keyCol] ? String(row[keyCol]).trim() : `ROW_${index + 1}`;

    return {
      id: index + 1,
      key: keyVal,
      originalText: original,
      translatedText: translated,
      variables: extractVariables(original),
      rawRowData: row,
    };
  });

  return {
    items,
    format: 'xlsx',
    columns: headerRow,
    suggestedMapping: {
      sourceColumn: sourceCol,
      targetColumn: targetCol,
      keyColumn: keyCol || undefined,
      contextColumn: contextCol || undefined,
      hasHeaders: true,
    },
    originalRawStructure: { rawRows, headerRow },
  };
}

/**
 * Parse JSON files (flat dictionary, nested keys, or array of dialogue objects)
 */
function parseJSON(content: string): ParseGameResult {
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (err: any) {
    throw new Error(`خطا در خواندن فایل JSON: ${err.message}`);
  }

  const items: GameLocalizationItem[] = [];
  let autoId = 1;

  // Case 1: Array of dialogue objects e.g. [ { id: "1", text: "..." }, ... ]
  if (Array.isArray(parsed)) {
    parsed.forEach((obj, idx) => {
      if (typeof obj === 'string') {
        items.push({
          id: autoId++,
          key: `ITEM_${idx + 1}`,
          originalText: obj,
          translatedText: '',
          variables: extractVariables(obj),
          rawRowData: { value: obj },
        });
      } else if (typeof obj === 'object' && obj !== null) {
        const textKey = Object.keys(obj).find((k) => ['text', 'dialogue', 'original', 'msg', 'source', 'en', 'value', 'line'].includes(k.toLowerCase())) || Object.keys(obj)[0];
        const transKey = Object.keys(obj).find((k) => ['translation', 'translated', 'target', 'fa', 'persian'].includes(k.toLowerCase()));
        const idKey = Object.keys(obj).find((k) => ['id', 'key', 'name', 'tag', 'identifier'].includes(k.toLowerCase()));
        const speakerKey = Object.keys(obj).find((k) => ['speaker', 'character', 'actor', 'name'].includes(k.toLowerCase()) && k !== idKey);

        const origText = String(obj[textKey] || '');
        const transText = transKey ? String(obj[transKey] || '') : '';
        const keyName = idKey ? String(obj[idKey]) : `ROW_${idx + 1}`;
        const speakerName = speakerKey ? String(obj[speakerKey]) : undefined;

        items.push({
          id: autoId++,
          key: keyName,
          originalText: origText,
          translatedText: transText,
          context: speakerName,
          variables: extractVariables(origText),
          rawRowData: obj,
        });
      }
    });

    return {
      items,
      format: 'json',
      originalRawStructure: { type: 'array', data: parsed },
    };
  }

  // Case 2: Object hierarchy / Key-Value map
  if (typeof parsed === 'object' && parsed !== null) {
    // Flatten nested objects into dot notation
    function flattenObject(obj: Record<string, any>, prefix = '') {
      for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const val = obj[key];

        if (typeof val === 'string') {
          items.push({
            id: autoId++,
            key: fullKey,
            originalText: val,
            translatedText: '',
            variables: extractVariables(val),
          });
        } else if (typeof val === 'number' || typeof val === 'boolean') {
          // Skip pure non-string or store as key
          continue;
        } else if (typeof val === 'object' && val !== null) {
          if (Array.isArray(val)) {
            val.forEach((arrItem, arrIdx) => {
              if (typeof arrItem === 'string') {
                items.push({
                  id: autoId++,
                  key: `${fullKey}[${arrIdx}]`,
                  originalText: arrItem,
                  translatedText: '',
                  variables: extractVariables(arrItem),
                });
              } else if (typeof arrItem === 'object') {
                flattenObject(arrItem, `${fullKey}[${arrIdx}]`);
              }
            });
          } else {
            flattenObject(val, fullKey);
          }
        }
      }
    }

    flattenObject(parsed);

    return {
      items,
      format: 'json',
      originalRawStructure: { type: 'object', data: parsed },
    };
  }

  throw new Error('فرمت ساختار JSON پشتیبانی نمی‌شود.');
}

/**
 * Parse plain text files (.txt)
 */
function parseTXT(content: string): ParseGameResult {
  const lines = content.split('\n');
  const items: GameLocalizationItem[] = [];
  let autoId = 1;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Check for "KEY = Value" or "KEY: Value" pattern common in game localization
    const kvMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\s*[:=]\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = kvMatch[2];
      items.push({
        id: autoId++,
        key,
        originalText: val,
        translatedText: '',
        variables: extractVariables(val),
        rawRowData: { delimiter: trimmed.includes(':') ? ':' : '=' },
      });
    } else {
      items.push({
        id: autoId++,
        key: `LINE_${autoId}`,
        originalText: trimmed,
        translatedText: '',
        variables: extractVariables(trimmed),
      });
    }
  }

  return {
    items,
    format: 'txt',
    originalRawStructure: { type: 'txt' },
  };
}

/**
 * Rebuild and Export Game CSV with UTF-8 BOM, preserving all structural columns in exact order
 */
export function exportGameCSV(
  items: GameLocalizationItem[],
  mapping: GameColumnMapping,
  originalStructure?: any
): Blob {
  const sourceCol = mapping.sourceColumn || 'Source';
  const targetCol = mapping.targetColumn || 'Translation';
  const keyCol = mapping.keyColumn;
  const originalColumns: string[] = originalStructure?.columns || [];

  // Determine all export fields in correct sequence
  const finalFields: string[] = [];
  if (originalColumns.length > 0) {
    originalColumns.forEach((col) => {
      if (!finalFields.includes(col)) {
        finalFields.push(col);
      }
    });
    if (targetCol && !finalFields.includes(targetCol)) {
      finalFields.push(targetCol);
    }
  } else {
    if (keyCol) finalFields.push(keyCol);
    finalFields.push(sourceCol);
    if (targetCol !== sourceCol) finalFields.push(targetCol);
  }

  const rows: Record<string, any>[] = items.map((item) => {
    // Preserve full rawRowData structure
    const rowObj: Record<string, any> = item.rawRowData ? { ...item.rawRowData } : {};
    
    if (keyCol && item.key) {
      rowObj[keyCol] = item.key;
    }
    rowObj[sourceCol] = item.originalText;
    rowObj[targetCol] = item.translatedText || item.originalText;

    // Fill missing fields with empty string for clean CSV alignment
    finalFields.forEach((field) => {
      if (rowObj[field] === undefined || rowObj[field] === null) {
        rowObj[field] = '';
      }
    });

    return rowObj;
  });

  const csvString = Papa.unparse({
    fields: finalFields.length > 0 ? finalFields : undefined,
    data: rows,
  }, {
    quotes: true, // Quote cells with quotes, commas, or line breaks/paragraphs per RFC 4180
    header: true,
    newline: '\r\n', // Standard CRLF for universal Excel & Game Engine compatibility
  });

  return createUtf8BomBlob(csvString, 'text/csv;charset=utf-8');
}

/**
 * Rebuild and Export Game JSON with preserved structure and keys
 */
export function exportGameJSON(
  items: GameLocalizationItem[],
  originalStructure?: any
): Blob {
  if (originalStructure?.type === 'array' && Array.isArray(originalStructure.data)) {
    // Reconstruct array of objects
    const resultArr = originalStructure.data.map((origObj: any, index: number) => {
      const item = items[index];
      if (!item) return origObj;

      if (typeof origObj === 'string') {
        return item.translatedText || item.originalText;
      }

      const copy = { ...origObj };
      // Locate translation field or update existing text field
      const textKey = Object.keys(copy).find((k) => ['text', 'dialogue', 'original', 'msg', 'source', 'en', 'value', 'line'].includes(k.toLowerCase())) || 'text';
      copy[textKey] = item.translatedText || item.originalText;
      return copy;
    });

    const jsonStr = JSON.stringify(resultArr, null, 2);
    return createUtf8Blob(jsonStr, 'application/json;charset=utf-8');
  }

  if (originalStructure?.type === 'object' && originalStructure.data) {
    // Deep clone original object and replace leaf string nodes
    const rootObj = JSON.parse(JSON.stringify(originalStructure.data));

    // Helper to set nested value by dot path (e.g. "dialogues.act1.title" or "menu[0]")
    function setDeepValue(obj: any, path: string, value: string) {
      const parts = path.split('.');
      let current = obj;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) current[part] = {};
        current = current[part];
      }

      const lastPart = parts[parts.length - 1];
      if (lastPart.includes('[') && lastPart.endsWith(']')) {
        const arrayKey = lastPart.substring(0, lastPart.indexOf('['));
        const arrayIdx = parseInt(lastPart.substring(lastPart.indexOf('[') + 1, lastPart.length - 1), 10);
        if (current[arrayKey] && Array.isArray(current[arrayKey])) {
          current[arrayKey][arrayIdx] = value;
        }
      } else {
        current[lastPart] = value;
      }
    }

    items.forEach((item) => {
      if (item.key) {
        setDeepValue(rootObj, item.key, item.translatedText || item.originalText);
      }
    });

    const jsonStr = JSON.stringify(rootObj, null, 2);
    return createUtf8Blob(jsonStr, 'application/json;charset=utf-8');
  }

  // Fallback: key-value dictionary object
  const dictObj: Record<string, string> = {};
  items.forEach((item) => {
    dictObj[item.key || `STRING_${item.id}`] = item.translatedText || item.originalText;
  });

  const jsonStr = JSON.stringify(dictObj, null, 2);
  return createUtf8Blob(jsonStr, 'application/json;charset=utf-8');
}

/**
 * Rebuild and Export Game XLSX workbook
 */
export async function exportGameXLSX(
  items: GameLocalizationItem[],
  mapping: GameColumnMapping
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Universal Subtitle & Game Translator';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Localization');

  const sourceCol = mapping.sourceColumn || 'Source';
  const targetCol = mapping.targetColumn || 'Translation';
  const keyCol = mapping.keyColumn || 'ID';

  // Define columns
  worksheet.columns = [
    { header: keyCol, key: 'key', width: 25 },
    { header: sourceCol, key: 'source', width: 45 },
    { header: targetCol, key: 'target', width: 45 },
  ];

  // Header row styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }, // Indigo color
  };

  // Add data rows
  items.forEach((item) => {
    worksheet.addRow({
      key: item.key || `ID_${item.id}`,
      source: item.originalText,
      target: item.translatedText || item.originalText,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Rebuild and Export Game TXT
 */
export function exportGameTXT(items: GameLocalizationItem[]): Blob {
  const lines = items.map((item) => {
    const text = item.translatedText || item.originalText;
    const delimiter = item.rawRowData?.delimiter || '=';
    if (item.key && !item.key.startsWith('LINE_')) {
      return `${item.key} ${delimiter} ${text}`;
    }
    return text;
  });

  const content = lines.join('\n');
  return createUtf8BomBlob(content, 'text/plain;charset=utf-8');
}

/**
 * Checks if a game localization string or subtitle line is purely code, numbers, punctuation, or placeholder
 */
export function isCodeOnlyOrSkippable(text: string): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;

  // Pure digits or decimal numbers (e.g. "123", "99.9", "0x1A")
  if (/^0x[0-9a-fA-F]+$/.test(trimmed) || /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return true;
  }

  // Pure symbol / punctuation line (e.g. "---", "===", "...", ">>>", "[ ]", "/***")
  if (/^[^a-zA-Z\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF0-9]+$/.test(trimmed)) {
    return true;
  }

  // Pure variable / placeholder token alone (e.g. "{player_name}", "%s", "{0}", "<br/>", "$gold", "\n")
  const stripped = trimmed
    .replace(GAME_VARIABLE_REGEX, '')
    .replace(/[\s\-_=+:;,./\\|()[\]{}<>"'`~!@#$%^&*]/g, '');

  if (stripped.length === 0) {
    return true;
  }

  // Boolean or programming literals
  if (/^(true|false|null|nil|undefined|none|nan|n\/a)$/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Appends Right-to-Left hidden directional mark (\u200F) to preserve game engine punctuation
 */
export function appendHiddenRTLMarker(text: string): string {
  if (!text) return text;
  // If text already has RTL mark or ends with right-to-left mark, don't duplicate
  if (text.endsWith('\u200F')) return text;
  // Check if string contains Persian/Arabic characters
  const hasRTL = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  if (hasRTL) {
    return `${text}\u200F`;
  }
  return text;
}

