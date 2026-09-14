import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { GameFormat, GameLocalizationItem, GameColumnMapping } from '../types';
import { detectEncodingAndDecodeText, createUtf8BomBlob, createUtf8Blob } from './encodingHelper';

/**
 * Regex for identifying in-game variables, formatting tags, and placeholders
 * e.g. {player_name}, {0}, %s, %d, $amount, \n, \r, \t, <b>, <color=#FF0000>, <font=Title>
 */
export const GAME_VARIABLE_REGEX = /(\{[a-zA-Z0-9_.-]+\}|\{\d+\}|%[0-9]*[sdif]|%[a-zA-Z0-9_]+|\$[a-zA-Z0-9_]+|<[^>]+>|\\n|\\r|\\t|\[[a-zA-Z0-9_]+\])/g;

export function extractVariables(text: string): string[] {
  if (!text) return [];
  const matches = text.match(GAME_VARIABLE_REGEX);
  if (!matches) return [];
  return Array.from(new Set(matches));
}

export const extractGameVariables = extractVariables;

/**
 * Validates variable preservation between source and translated strings as a multiset (Finding 16B)
 */
export interface VariableValidationResult {
  isValid: boolean;
  missingVariables: string[];
  extraVariables: string[];
}

export function validateVariablesMultiset(source: string, target: string): VariableValidationResult {
  const getCounts = (str: string) => {
    const counts = new Map<string, number>();
    const matches = str.match(GAME_VARIABLE_REGEX) || [];
    for (const m of matches) {
      counts.set(m, (counts.get(m) || 0) + 1);
    }
    return counts;
  };

  const srcCounts = getCounts(source);
  const tgtCounts = getCounts(target);

  const missingVariables: string[] = [];
  const extraVariables: string[] = [];

  srcCounts.forEach((srcCount, token) => {
    const tgtCount = tgtCounts.get(token) || 0;
    if (tgtCount < srcCount) {
      for (let i = 0; i < srcCount - tgtCount; i++) {
        missingVariables.push(token);
      }
    }
  });

  tgtCounts.forEach((tgtCount, token) => {
    const srcCount = srcCounts.get(token) || 0;
    if (tgtCount > srcCount) {
      for (let i = 0; i < tgtCount - srcCount; i++) {
        extraVariables.push(token);
      }
    }
  });

  return {
    isValid: missingVariables.length === 0 && extraVariables.length === 0,
    missingVariables,
    extraVariables,
  };
}

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

  const { text } = detectEncodingAndDecodeText(buffer, forcedEncoding);
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
 * Preserves detected delimiter and headerless state (Finding 08B)
 */
function parseCSV(content: string): ParseGameResult {
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

  let parsed = Papa.parse(cleanContent, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
    delimitersToGuess: [',', '\t', ';', '|'],
    transformHeader: (h) => (h ? h.trim() : ''),
  });

  const detectedDelimiter = parsed.meta.delimiter || ',';
  let columns = (parsed.meta.fields || []).filter((c) => c && c.trim() !== '');
  let rawRows = (parsed.data as Record<string, any>[]).filter(
    (row) => row && typeof row === 'object' && Object.values(row).some((val) => val !== undefined && val !== null && String(val).trim() !== '')
  );

  let hasHeaders = true;

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
      const firstRow = rawData[0];
      const hasHeaderCandidate = firstRow.every((cell) => typeof cell === 'string' && cell.length < 100);

      if (hasHeaderCandidate && rawData.length > 1) {
        hasHeaders = true;
        columns = firstRow.map((c, i) => String(c || `Column_${i + 1}`).trim());
        rawRows = rawData.slice(1).map((rowArr) => {
          const rowObj: Record<string, any> = {};
          columns.forEach((col, idx) => {
            rowObj[col] = rowArr[idx] !== undefined && rowArr[idx] !== null ? String(rowArr[idx]) : '';
          });
          return rowObj;
        });
      } else {
        hasHeaders = false;
        const maxCols = Math.max(...rawData.map((r) => r.length), 2);
        columns = Array.from({ length: maxCols }, (_, i) => `Col_${i + 1}`);
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

  rawRows = rawRows.map((row) => {
    const cleanRow: Record<string, any> = { ...row };
    columns.forEach((col) => {
      if (cleanRow[col] === undefined || cleanRow[col] === null) {
        cleanRow[col] = '';
      }
    });
    return cleanRow;
  });

  let sourceCol = '';
  let targetCol = '';
  let keyCol = '';
  let contextCol = '';

  const lowerCols = columns.map((c) => c.toLowerCase());

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

  const keyKeywords = ['string_id', 'id', 'key', 'name', 'code', 'tag', 'identifier', 'entry', 'guid', 'label'];
  for (const kw of keyKeywords) {
    const foundIdx = lowerCols.findIndex((c, colIndex) => (c === kw || c.endsWith('_id') || c.startsWith('id_') || c === 'key') && columns[colIndex] !== sourceCol);
    if (foundIdx !== -1) {
      keyCol = columns[foundIdx];
      break;
    }
  }

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
      hasHeaders,
    },
    originalRawStructure: { rawRows, columns, delimiter: detectedDelimiter, hasHeaders },
  };
}

/**
 * Parse XLSX files preserving all worksheet columns and sheet metadata (Finding 07B)
 * FIX (B15): header row is no longer blindly assumed — the same heuristic as the CSV parser
 * decides whether row 1 is a header or DATA, so headerless game workbooks keep every record.
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

  // FIX (B15): decide whether row 1 is a header or data.
  // Heuristic (mirrors parseCSV): the first row is treated as a header when every cell is a
  // short string AND it does not look like plain dialogue data (header cells are usually unique
  // identifiers, data rows frequently contain sentence-like text or numbers).
  const firstRow = rows[0];
  const looksLikeHeader =
    rows.length > 1 &&
    firstRow.every((cell) => typeof cell === 'string' && cell.trim().length > 0 && cell.trim().length < 100 && !/^\d+([.,]\d+)?$/.test(cell.trim())) &&
    firstRow.some((cell) => {
      const c = String(cell).trim().toLowerCase();
      return ['source', 'text', 'original', 'id', 'key', 'target', 'translation', 'translated', 'fa', 'dialogue', 'string', 'name', 'comment', 'notes', 'speaker'].some((kw) => c === kw || c.includes(kw));
    });
  const hasHeaders = looksLikeHeader;

  const headerRow = hasHeaders
    ? firstRow.map((h, i) => String(h || `Column_${i + 1}`).trim())
    : firstRow.map((_, i) => `Column_${i + 1}`);
  const dataRows = hasHeaders ? rows.slice(1) : rows;

  const rawRows: Record<string, any>[] = dataRows.map((r) => {
    const rowObj: Record<string, any> = {};
    headerRow.forEach((colName, idx) => {
      rowObj[colName] = r[idx] !== undefined ? r[idx] : '';
    });
    return rowObj;
  });

  const lowerCols = headerRow.map((c) => c.toLowerCase());
  let sourceCol = headerRow[0];
  let targetCol = headerRow.length > 1 ? headerRow[1] : 'Translation';
  let keyCol = '';
  let contextCol = '';

  if (!hasHeaders) {
    // FIX (B15): with no headers, positional mapping is the only sensible choice
    sourceCol = headerRow[0];
    targetCol = headerRow.length > 1 ? headerRow[1] : headerRow[0];
  }

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
      hasHeaders,
    },
    originalRawStructure: { rawRows, headerRow, sheetName: worksheet.name, hasHeaders },
  };
}

/**
 * Parse JSON files (flat dictionary, nested keys, or array of dialogue objects)
 * Supports dotted keys without false nesting and guards null values (Findings 02B, 05B)
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
          rawRowData: { value: obj, isRawString: true, index: idx },
        });
      } else if (typeof obj === 'object' && obj !== null) {
        const textKey = Object.keys(obj).find((k) => ['text', 'dialogue', 'original', 'msg', 'source', 'en', 'value', 'line'].includes(k.toLowerCase())) || Object.keys(obj)[0];
        const transKey = Object.keys(obj).find((k) => ['translation', 'translated', 'target', 'fa', 'persian'].includes(k.toLowerCase()));
        const idKey = Object.keys(obj).find((k) => ['id', 'key', 'name', 'tag', 'identifier'].includes(k.toLowerCase()));
        const speakerKey = Object.keys(obj).find((k) => ['speaker', 'character', 'actor', 'name'].includes(k.toLowerCase()) && k !== idKey);

        const origText = String(obj[textKey] ?? '');
        const transText = transKey ? String(obj[transKey] ?? '') : '';
        const keyName = idKey ? String(obj[idKey]) : `ROW_${idx + 1}`;
        const speakerName = speakerKey ? String(obj[speakerKey]) : undefined;

        items.push({
          id: autoId++,
          key: keyName,
          originalText: origText,
          translatedText: transText,
          context: speakerName,
          variables: extractVariables(origText),
          rawRowData: {
            ...obj,
            _sourceKey: textKey,
            _targetKey: transKey || 'translation',
            _index: idx,
          },
        });
      }
    });

    return {
      items,
      format: 'json',
      originalRawStructure: { type: 'array', data: parsed },
    };
  }

  // FIX (B3) NOTE for the array case above: non-string/non-object elements (numbers, booleans,
  // null) intentionally produce NO item, and `exportGameJSON` now maps translations back by the
  // ORIGINAL array index (stored in rawRowData.index / rawRowData._index) instead of positional
  // matching, so mixed-type arrays keep their shape and translations land on the right element.

  // Case 2: Object hierarchy / Key-Value map
  if (typeof parsed === 'object' && parsed !== null) {
    function flattenObject(obj: Record<string, any>, pathTokens: string[] = []) {
      for (const key of Object.keys(obj)) {
        const currentTokens = [...pathTokens, key];
        const val = obj[key];

        if (typeof val === 'string') {
          items.push({
            id: autoId++,
            key: currentTokens.join('.'),
            originalText: val,
            translatedText: '',
            variables: extractVariables(val),
            rawRowData: { pathTokens: currentTokens },
          });
        } else if (typeof val === 'number' || typeof val === 'boolean' || val === null) {
          continue;
        } else if (typeof val === 'object') {
          if (Array.isArray(val)) {
            val.forEach((arrItem, arrIdx) => {
              if (arrItem === null || arrItem === undefined) return;
              const arrTokens = [...currentTokens, `[${arrIdx}]`];
              if (typeof arrItem === 'string') {
                items.push({
                  id: autoId++,
                  key: `${currentTokens.join('.')}[${arrIdx}]`,
                  originalText: arrItem,
                  translatedText: '',
                  variables: extractVariables(arrItem),
                  rawRowData: { pathTokens: arrTokens },
                });
              } else if (typeof arrItem === 'object') {
                flattenObject(arrItem, arrTokens);
              }
            });
          } else {
            flattenObject(val, currentTokens);
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
 * Parse plain text files (.txt) preserving comments, blank lines, and original delimiters (Finding 06B)
 * FIX (B11): key/value detection is now STRICT — the key must look like an identifier and lines
 * like URLs (https://...), file paths, or timestamps are kept as plain text instead of being
 * torn into a fake key/value pair. The EXACT original separator (with its spacing) is stored so
 * reconstruction is byte-faithful for strict game-engine parsers.
 */
function parseTXT(content: string): ParseGameResult {
  const lines = content.split('\n');
  const items: GameLocalizationItem[] = [];
  const rawEntries: any[] = [];
  let autoId = 1;

  // A plausible identifier key: starts with a letter/underscore, may contain word chars, dots,
  // dashes and single spaces. Rejects "https", "00", "C:" (digit start), timestamps, etc.
  const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_.\- ]*$/;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Preserve blank lines
    if (!trimmed) {
      rawEntries.push({ type: 'blank', raw: rawLine });
      continue;
    }

    // Preserve comments starting with #, //, or ;
    if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith(';')) {
      rawEntries.push({ type: 'comment', raw: rawLine });
      continue;
    }

    // Match KEY := Value, KEY = Value, or KEY: Value (capture the EXACT separator with spacing)
    const kvMatch = rawLine.match(/^([^:=]+?)(\s*(:=|=|:)\s*)(.*)$/);
    let kvAccepted = false;
    let key = '';
    let delimiter = '';
    let rawSep = '';
    let val = '';

    if (kvMatch) {
      key = kvMatch[1].trim();
      rawSep = kvMatch[2];
      delimiter = kvMatch[3];
      val = kvMatch[4];

      // FIX (B11) strictness guards — anything failing these is plain text, not KEY=value:
      // 1) key must be a sane identifier
      const keyLooksValid = KEY_PATTERN.test(key) && key.length <= 128;
      // 2) the value must not start like a URL path/protocol remainder (https://x → val "//x")
      //    nor like a filesystem path (C:\x → val "\x")
      const valueLooksLikePathOrUrl = /^\/{1,2}/.test(val.trim()) || /^\\/.test(val.trim());
      // 3) the line must not be a timestamp cue (00:12:34,500 --> ...)
      const looksLikeTimestamp = /\d{1,2}:\d{2}:\d{2}/.test(key) || trimmed.includes('-->');

      kvAccepted = keyLooksValid && !valueLooksLikePathOrUrl && !looksLikeTimestamp;
    }

    if (kvAccepted) {
      const itemId = autoId++;
      items.push({
        id: itemId,
        key,
        originalText: val,
        translatedText: '',
        variables: extractVariables(val),
        rawRowData: { delimiter, rawSep, rawLine },
      });
      rawEntries.push({ type: 'item', itemId, key, delimiter, rawSep });
    } else {
      const itemId = autoId++;
      items.push({
        id: itemId,
        key: `LINE_${itemId}`,
        originalText: trimmed,
        translatedText: '',
        variables: extractVariables(trimmed),
        rawRowData: { delimiter: '', rawSep: '', rawLine },
      });
      rawEntries.push({ type: 'item', itemId, key: `LINE_${itemId}`, delimiter: '', rawSep: '' });
    }
  }

  return {
    items,
    format: 'txt',
    originalRawStructure: { type: 'txt', rawEntries },
  };
}

/**
 * Rebuild and Export Game CSV with UTF-8 BOM, preserving all structural columns in exact order and delimiter (Finding 08B)
 */
export function exportGameCSV(
  items: GameLocalizationItem[],
  mapping: GameColumnMapping,
  originalStructure?: any,
  appendRTLMarkers = true
): Blob {
  const sourceCol = mapping.sourceColumn || 'Source';
  const targetCol = mapping.targetColumn || 'Translation';
  const keyCol = mapping.keyColumn;
  const originalColumns: string[] = originalStructure?.columns || [];
  const delimiter = originalStructure?.delimiter || ',';
  const hasHeaders = mapping.hasHeaders !== false && originalStructure?.hasHeaders !== false;

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
    const rowObj: Record<string, any> = item.rawRowData ? { ...item.rawRowData } : {};

    if (keyCol && item.key) {
      rowObj[keyCol] = item.key;
    }
    rowObj[sourceCol] = item.originalText;
    const finalTrans = item.translatedText || item.originalText;
    rowObj[targetCol] = appendRTLMarkers ? appendHiddenRTLMarker(finalTrans) : stripHiddenRTLMarker(finalTrans);

    finalFields.forEach((field) => {
      if (rowObj[field] === undefined || rowObj[field] === null) {
        rowObj[field] = '';
      }
    });

    return rowObj;
  });

  const csvString = Papa.unparse(
    {
      fields: hasHeaders && finalFields.length > 0 ? finalFields : undefined,
      data: rows,
    },
    {
      delimiter,
      quotes: true,
      header: hasHeaders,
      newline: '\r\n',
    }
  );

  return createUtf8BomBlob(csvString, 'text/csv;charset=utf-8');
}

/**
 * Rebuild and Export Game JSON with preserved structure and keys
 * Never overwrites source column when target column is configured (Finding 04B, 05B)
 */
export function exportGameJSON(
  items: GameLocalizationItem[],
  originalStructure?: any,
  appendRTLMarkers = true
): Blob {
  if (originalStructure?.type === 'array' && Array.isArray(originalStructure.data)) {
    // FIX (B3): positional mapping corrupted mixed-type arrays (numbers/booleans/null create NO
    // item, so every index after one shifted). Each item remembers its ORIGINAL array index
    // (strings: rawRowData.index, objects: rawRowData._index) and we map through that instead.
    const itemByOriginalIndex = new Map<number, GameLocalizationItem>();
    items.forEach((it) => {
      const rd: any = it.rawRowData || {};
      const origIdx = typeof rd._index === 'number' ? rd._index : typeof rd.index === 'number' ? rd.index : undefined;
      if (origIdx !== undefined) {
        itemByOriginalIndex.set(origIdx, it);
      }
    });

    const resultArr = originalStructure.data.map((origObj: any, index: number) => {
      const item = itemByOriginalIndex.get(index);
      if (!item) return origObj; // non-text element (number/boolean/null) — untouched

      const translated = item.translatedText || item.originalText;
      const finalTrans = appendRTLMarkers ? appendHiddenRTLMarker(translated) : stripHiddenRTLMarker(translated);

      if (typeof origObj === 'string' || item.rawRowData?.isRawString) {
        return finalTrans;
      }

      const copy = { ...origObj };
      const targetKey = item.rawRowData?._targetKey || 'translation';
      const sourceKey = item.rawRowData?._sourceKey || 'text';

      if (targetKey !== sourceKey) {
        copy[targetKey] = finalTrans;
      } else {
        copy[sourceKey] = finalTrans;
      }
      return copy;
    });

    const jsonStr = JSON.stringify(resultArr, null, 2);
    return createUtf8Blob(jsonStr, 'application/json;charset=utf-8');
  }

  if (originalStructure?.type === 'object' && originalStructure.data) {
    const rootObj = JSON.parse(JSON.stringify(originalStructure.data));

    function setDeepValue(obj: any, pathTokens: string[], value: string) {
      let current = obj;
      for (let i = 0; i < pathTokens.length - 1; i++) {
        const token = pathTokens[i];
        if (token.startsWith('[') && token.endsWith(']')) {
          const idx = parseInt(token.slice(1, -1), 10);
          if (!current[idx]) current[idx] = {};
          current = current[idx];
        } else {
          if (!current[token]) current[token] = {};
          current = current[token];
        }
      }

      const lastToken = pathTokens[pathTokens.length - 1];
      if (lastToken.startsWith('[') && lastToken.endsWith(']')) {
        const idx = parseInt(lastToken.slice(1, -1), 10);
        if (Array.isArray(current)) {
          current[idx] = value;
        }
      } else {
        current[lastToken] = value;
      }
    }

    items.forEach((item) => {
      const trans = item.translatedText || item.originalText;
      const finalTrans = appendRTLMarkers ? appendHiddenRTLMarker(trans) : stripHiddenRTLMarker(trans);
      const tokens: string[] = item.rawRowData?.pathTokens || (item.key ? item.key.split('.') : []);
      if (tokens.length > 0) {
        setDeepValue(rootObj, tokens, finalTrans);
      }
    });

    const jsonStr = JSON.stringify(rootObj, null, 2);
    return createUtf8Blob(jsonStr, 'application/json;charset=utf-8');
  }

  // Fallback dictionary
  const dictObj: Record<string, string> = {};
  items.forEach((item) => {
    const trans = item.translatedText || item.originalText;
    dictObj[item.key || `STRING_${item.id}`] = appendRTLMarkers ? appendHiddenRTLMarker(trans) : stripHiddenRTLMarker(trans);
  });

  const jsonStr = JSON.stringify(dictObj, null, 2);
  return createUtf8Blob(jsonStr, 'application/json;charset=utf-8');
}

/**
 * Rebuild and Export Game XLSX workbook preserving all original columns and formatting (Finding 07B)
 * FIX (B15): headerless workbooks are exported WITHOUT a header row and WITHOUT consuming the
 * first data row, exactly mirroring the parse behavior.
 */
export async function exportGameXLSX(
  items: GameLocalizationItem[],
  mapping: GameColumnMapping,
  originalStructure?: any,
  appendRTLMarkers = true
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SubGame Lab';
  workbook.created = new Date();

  const sheetName = originalStructure?.sheetName || 'Localization';
  const worksheet = workbook.addWorksheet(sheetName);

  const sourceCol = mapping.sourceColumn || 'Source';
  const targetCol = mapping.targetColumn || 'Translation';
  const keyCol = mapping.keyColumn;
  // FIX (B15): respect the detected/stored hasHeaders state
  const hasHeaders = originalStructure?.hasHeaders === false || mapping.hasHeaders === false ? false : true;
  const originalColumns: string[] = originalStructure?.headerRow || [];

  const finalColumns: string[] = [];
  if (originalColumns.length > 0) {
    originalColumns.forEach((c) => {
      if (!finalColumns.includes(c)) finalColumns.push(c);
    });
    if (targetCol && !finalColumns.includes(targetCol)) {
      finalColumns.push(targetCol);
    }
  } else {
    if (keyCol) finalColumns.push(keyCol);
    finalColumns.push(sourceCol);
    if (targetCol !== sourceCol) finalColumns.push(targetCol);
  }

  worksheet.columns = finalColumns.map((colName) => ({
    header: hasHeaders ? colName : undefined,
    key: colName,
    width: colName === sourceCol || colName === targetCol ? 45 : 20,
  }));

  if (hasHeaders) {
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
  }

  items.forEach((item) => {
    const rowObj: Record<string, any> = item.rawRowData ? { ...item.rawRowData } : {};
    if (keyCol && item.key) {
      rowObj[keyCol] = item.key;
    }
    rowObj[sourceCol] = item.originalText;
    const finalTrans = item.translatedText || item.originalText;
    rowObj[targetCol] = appendRTLMarkers ? appendHiddenRTLMarker(finalTrans) : stripHiddenRTLMarker(finalTrans);
    worksheet.addRow(rowObj);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Rebuild and Export Game TXT preserving comments, blank lines, and original delimiters (Finding 06B)
 * FIX (B12 usage / B11): when the original structure is provided the exact raw separator
 * (including original spacing) is reused, so strict engine parsers see byte-identical lines.
 * FIX (B22): TXT output no longer carries a UTF-8 BOM — strict game parsers treated it as part
 * of the first key. (CSV keeps its BOM on purpose for Excel compatibility.)
 * FIX (B17): when appendRTLMarkers is false, previously-added \u200F markers are stripped.
 */
export function exportGameTXT(
  items: GameLocalizationItem[],
  originalStructure?: any,
  appendRTLMarkers = true
): Blob {
  const rawEntries = originalStructure?.rawEntries;
  let content = '';

  if (Array.isArray(rawEntries) && rawEntries.length > 0) {
    const itemsMap = new Map<number, GameLocalizationItem>();
    items.forEach((it) => itemsMap.set(it.id, it));

    const lines: string[] = [];
    for (const entry of rawEntries) {
      if (entry.type === 'blank') {
        lines.push('');
      } else if (entry.type === 'comment') {
        lines.push(entry.raw);
      } else if (entry.type === 'item') {
        const item = itemsMap.get(entry.itemId);
        if (item) {
          const trans = item.translatedText || item.originalText;
          const finalTrans = appendRTLMarkers ? appendHiddenRTLMarker(trans) : stripHiddenRTLMarker(trans);
          // FIX (B11): reuse the exact original separator ("KEY:value" stays "KEY:value")
          const rawSep: string = entry.rawSep ?? (item.rawRowData?.rawSep ?? '');
          const delimiter = rawSep || (entry.delimiter ? ` ${entry.delimiter} ` : '');
          if (item.key && !item.key.startsWith('LINE_')) {
            lines.push(`${item.key}${delimiter}${finalTrans}`);
          } else {
            lines.push(finalTrans);
          }
        }
      }
    }
    content = lines.join('\n');
  } else {
    const lines = items.map((item) => {
      const trans = item.translatedText || item.originalText;
      const finalTrans = appendRTLMarkers ? appendHiddenRTLMarker(trans) : stripHiddenRTLMarker(trans);
      // FIX (B11): prefer the exact original separator captured at parse time
      const rawSep: string = item.rawRowData?.rawSep || '';
      const delimiter = rawSep || (item.rawRowData?.delimiter ? ` ${item.rawRowData.delimiter} ` : ' = ');
      if (item.key && !item.key.startsWith('LINE_')) {
        return `${item.key}${delimiter}${finalTrans}`;
      }
      return finalTrans;
    });
    content = lines.join('\n');
  }

  // FIX (B22): no BOM for game TXT files
  return createUtf8Blob(content, 'text/plain;charset=utf-8');
}

/**
 * Checks if a game localization string or subtitle line is purely code, numbers, punctuation, or placeholder.
 * Fully multilingual using Unicode property escapes \p{L} and \p{N} so Russian, Chinese, Japanese, Korean,
 * Hebrew, Arabic, etc. are NOT skipped as code! (Finding 01B)
 */
export function isCodeOnlyOrSkippable(text: string): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;

  // Pure digits, hex, or decimal numbers (e.g. "123", "99.9", "0x1A", "#FFFFFF")
  if (/^0x[0-9a-fA-F]+$/.test(trimmed) || /^#[0-9a-fA-F]{3,8}$/.test(trimmed) || /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return true;
  }

  // Pure symbol / punctuation line without any linguistic characters (\p{L}) or digits (\p{N})
  if (/^[^\p{L}\p{N}]+$/u.test(trimmed)) {
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
  if (text.endsWith('\u200F')) return text;
  const hasRTL = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  if (hasRTL) {
    return `${text}\u200F`;
  }
  return text;
}

/**
 * FIX (B17): removes hidden RTL directional marks (\u200F) previously embedded in the text.
 * Used on every game/cinema export path when the "Append RTL markers" option is OFF so the
 * toggle truly guarantees a marker-free output file (string comparisons and search inside the
 * game engine stay clean).
 */
export function stripHiddenRTLMarker(text: string): string {
  if (!text) return text;
  return text.replace(/\u200F/g, '');
}
