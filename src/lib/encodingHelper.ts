import jschardet from 'jschardet';

/**
 * Intelligent file encoding detector and decoder supporting legacy Windows-1256 (Persian/Arabic ANSI),
 * UTF-8 with and without BOM, UTF-16 LE/BE, and fallback charsets.
 */
export function detectEncodingAndDecodeText(buffer: ArrayBuffer): { text: string; encoding: string; confidence: number } {
  const bytes = new Uint8Array(buffer);

  // 1. Check for UTF-8 Byte Order Mark (EF BB BF)
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    const decoder = new TextDecoder('utf-8');
    return { text: decoder.decode(buffer.slice(3)), encoding: 'UTF-8 (BOM)', confidence: 1 };
  }

  // 2. Check for UTF-16 LE BOM (FF FE)
  if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
    const decoder = new TextDecoder('utf-16le');
    return { text: decoder.decode(buffer.slice(2)), encoding: 'UTF-16LE', confidence: 1 };
  }

  // 3. Check for UTF-16 BE BOM (FE FF)
  if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
    const decoder = new TextDecoder('utf-16be');
    return { text: decoder.decode(buffer.slice(2)), encoding: 'UTF-16BE', confidence: 1 };
  }

  // 4. Try strict UTF-8 decoding first
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    const decoded = utf8Decoder.decode(buffer);
    return { text: decoded, encoding: 'UTF-8', confidence: 0.99 };
  } catch {
    // If strict UTF-8 fails, use jschardet for statistical heuristic detection
  }

  // 5. Convert sample of binary buffer to binary string for jschardet
  try {
    const sampleSize = Math.min(bytes.length, 65536);
    let binaryStr = '';
    for (let i = 0; i < sampleSize; i++) {
      binaryStr += String.fromCharCode(bytes[i]);
    }

    const detected = jschardet.detect(binaryStr);
    if (detected && detected.encoding) {
      const enc = detected.encoding.toLowerCase();
      
      // Normalize common Persian/Arabic ANSI code pages
      if (enc.includes('windows-1256') || enc.includes('cp1256') || enc.includes('arabic') || enc.includes('1256')) {
        const decoder = new TextDecoder('windows-1256');
        return { text: decoder.decode(buffer), encoding: 'Windows-1256 (Persian/Arabic ANSI)', confidence: detected.confidence || 0.9 };
      }
      
      if (enc.includes('windows-1252') || enc.includes('iso-8859') || enc.includes('ascii')) {
        // Many Persian subtitles in ANSI are misidentified as windows-1252, let's test windows-1256 decoder
        try {
          const win1256Decoder = new TextDecoder('windows-1256');
          const testDecoded = win1256Decoder.decode(buffer);
          // Check if decoded text contains Persian/Arabic unicode characters
          if (/[\u0600-\u06FF]/.test(testDecoded)) {
            return { text: testDecoded, encoding: 'Windows-1256 (Persian ANSI)', confidence: 0.95 };
          }
        } catch {}
      }

      try {
        const customDecoder = new TextDecoder(detected.encoding);
        return { text: customDecoder.decode(buffer), encoding: detected.encoding, confidence: detected.confidence || 0.8 };
      } catch {}
    }
  } catch (err) {
    console.warn('Encoding detection heuristic failed, falling back to Windows-1256/ISO-8859-1:', err);
  }

  // 6. Direct fallback: Try Windows-1256 for Persian subtitles/game strings
  try {
    const win1256Decoder = new TextDecoder('windows-1256');
    const decoded = win1256Decoder.decode(buffer);
    return { text: decoded, encoding: 'Windows-1256', confidence: 0.7 };
  } catch {
    // 7. Last resort fallback
    const isoDecoder = new TextDecoder('iso-8859-1');
    return { text: isoDecoder.decode(buffer), encoding: 'ISO-8859-1', confidence: 0.5 };
  }
}

/**
 * Creates a UTF-8 with BOM Blob for safe CSV / text download,
 * guaranteeing no Persian/RTL characters become '????' in Excel.
 */
export function createUtf8BomBlob(content: string, mimeType = 'text/csv;charset=utf-8'): Blob {
  // Prepend UTF-8 BOM (\uFEFF)
  const bom = '\uFEFF';
  const fullContent = content.startsWith(bom) ? content : bom + content;
  return new Blob([fullContent], { type: mimeType });
}

/**
 * Standard UTF-8 blob creator
 */
export function createUtf8Blob(content: string, mimeType = 'text/plain;charset=utf-8'): Blob {
  return new Blob([content], { type: mimeType });
}
