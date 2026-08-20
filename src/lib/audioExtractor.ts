/**
 * Client-side Audio Extraction Utility using Web Audio API
 * Optimized for low memory footprint and high performance with large video/audio files.
 */

export interface AudioExtractionResult {
  audioBlob: Blob;
  base64Audio: string;
  durationSeconds: number;
}

export interface AudioChunk {
  chunkIndex: number;
  startTimeSeconds: number;
  durationSeconds: number;
  base64Audio: string;
}

export interface AudioChunkingResult {
  totalDurationSeconds: number;
  chunksCount: number;
}

/**
 * Fast ArrayBuffer to Base64 converter using 32KB chunking to avoid memory spikes
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 0x8000; // 32KB chunking
  for (let i = 0; i < len; i += chunkSize) {
    const sub = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, sub as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Encodes a slice of an audio buffer into 16-bit PCM Mono WAV format directly
 * without allocating intermediate Float32 arrays or creating OfflineAudioContext instances.
 */
export function bufferToMonoWavSlice(
  buffer: AudioBuffer,
  startSample: number,
  endSample: number,
  targetSampleRate = 16000
): ArrayBuffer {
  const originalSampleRate = buffer.sampleRate;
  const originalLength = Math.max(0, endSample - startSample);
  if (originalLength <= 0) return new ArrayBuffer(44);

  const channelCount = buffer.numberOfChannels;
  const channelsData: Float32Array[] = [];
  for (let c = 0; c < channelCount; c++) {
    channelsData.push(buffer.getChannelData(c));
  }

  const sampleRateRatio = originalSampleRate / targetSampleRate;
  const resampledLength = Math.max(1, Math.round(originalLength / sampleRateRatio));

  // 44-byte WAV header + 2 bytes per sample (16-bit PCM)
  const wavBuffer = new ArrayBuffer(44 + resampledLength * 2);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF chunk descriptor */
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + resampledLength * 2, true);
  writeString(8, 'WAVE');

  /* fmt sub-chunk */
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 mono)
  view.setUint32(24, targetSampleRate, true); // SampleRate
  view.setUint32(28, targetSampleRate * 2, true); // ByteRate (16000 * 1 * 2)
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample (16)

  /* data sub-chunk */
  writeString(36, 'data');
  view.setUint32(40, resampledLength * 2, true);

  // Write PCM samples on the fly
  let offset = 44;
  for (let i = 0; i < resampledLength; i++, offset += 2) {
    const originIdx = startSample + Math.floor(i * sampleRateRatio);
    const safeIdx = Math.min(originIdx, endSample - 1);

    // Mix channels down to mono
    let mixed = 0;
    for (let c = 0; c < channelCount; c++) {
      mixed += channelsData[c][safeIdx];
    }
    mixed /= channelCount;

    // Clamp [-1, 1] and write Int16 PCM sample
    const s = Math.max(-1, Math.min(1, mixed));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return wavBuffer;
}

/**
 * Extracts audio from a video/audio file and converts to 16kHz Mono WAV base64 payload.
 */
export async function extractAudioFromVideoFile(
  file: File,
  onProgress?: (progress: number, stepText: string) => void
): Promise<AudioExtractionResult> {
  if (onProgress) onProgress(10, 'Reading file buffer...');
  let fileArrayBuffer: ArrayBuffer | null = await file.arrayBuffer();

  if (onProgress) onProgress(30, 'Decoding audio track with Web Audio API...');
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextClass();

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioContext.decodeAudioData(fileArrayBuffer);
  } catch (err) {
    fileArrayBuffer = null;
    await audioContext.close();
    throw new Error('Could not decode audio from video file. Ensure file contains a valid audio stream.');
  } finally {
    fileArrayBuffer = null; // Immediately release raw file buffer
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  }

  if (onProgress) onProgress(60, 'Optimizing & downsampling audio to 16kHz Mono...');
  const wavArrayBuffer = bufferToMonoWavSlice(audioBuffer, 0, audioBuffer.length, 16000);
  const audioBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });

  if (onProgress) onProgress(85, 'Encoding audio payload...');
  const base64Audio = arrayBufferToBase64(wavArrayBuffer);

  if (onProgress) onProgress(100, 'Audio extraction complete.');

  return {
    audioBlob,
    base64Audio,
    durationSeconds: audioBuffer.duration,
  };
}

/**
 * Memory-optimized sequential chunk processor for long videos/audio files.
 * Processes chunk-by-chunk without storing all chunks in RAM simultaneously.
 */
export async function processAudioChunksSequentially(
  file: File,
  chunkDurationSeconds = 60,
  onChunkProcessed: (chunk: {
    chunkIndex: number;
    chunksCount: number;
    startTimeSeconds: number;
    durationSeconds: number;
    base64Audio: string;
  }) => Promise<void>,
  onProgress?: (progress: number, stepText: string) => void
): Promise<{ totalDurationSeconds: number; chunksCount: number }> {
  if (onProgress) onProgress(5, 'Reading file buffer...');
  let fileArrayBuffer: ArrayBuffer | null = await file.arrayBuffer();

  if (onProgress) onProgress(15, 'Decoding audio track with Web Audio API...');
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextClass();

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioContext.decodeAudioData(fileArrayBuffer);
  } catch (err) {
    fileArrayBuffer = null;
    await audioContext.close();
    throw new Error('Could not decode audio from video file. Ensure file contains a valid audio stream.');
  } finally {
    fileArrayBuffer = null; // Release raw file buffer memory immediately!
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  }

  const sampleRate = audioBuffer.sampleRate;
  const totalLength = audioBuffer.length;
  const totalDuration = audioBuffer.duration;
  const samplesPerChunk = Math.round(chunkDurationSeconds * sampleRate);
  const chunksCount = Math.max(1, Math.ceil(totalLength / samplesPerChunk));

  for (let i = 0; i < chunksCount; i++) {
    const startSample = i * samplesPerChunk;
    const endSample = Math.min((i + 1) * samplesPerChunk, totalLength);
    const chunkSampleCount = endSample - startSample;
    if (chunkSampleCount <= 0) continue;

    if (onProgress) {
      const currentPercent = Math.min(85, Math.round(15 + ((i + 1) / chunksCount) * 70));
      onProgress(currentPercent, `Processing 1-min chunk ${i + 1} of ${chunksCount}...`);
    }

    // Direct slice to mono 16kHz WAV ArrayBuffer
    const wavBuffer = bufferToMonoWavSlice(audioBuffer, startSample, endSample, 16000);
    const base64Audio = arrayBufferToBase64(wavBuffer);

    const startTimeSeconds = i * chunkDurationSeconds;
    const durationSeconds = chunkSampleCount / sampleRate;

    // Process chunk sequentially (transcribe via API)
    await onChunkProcessed({
      chunkIndex: i,
      chunksCount,
      startTimeSeconds,
      durationSeconds,
      base64Audio,
    });
  }

  if (onProgress) onProgress(90, 'Audio processing complete.');

  return {
    totalDurationSeconds: totalDuration,
    chunksCount,
  };
}


