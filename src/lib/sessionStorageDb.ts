import Dexie, { type Table } from 'dexie';
import { AppMode, ModeSessionState } from '../types';

export interface SavedSessionRecord {
  mode: AppMode;
  state: ModeSessionState;
  updatedAt: number;
}

class SubGameLabDatabase extends Dexie {
  sessions!: Table<SavedSessionRecord, string>;

  constructor() {
    super('SubGameLabDB');
    this.version(1).stores({
      sessions: 'mode, updatedAt',
    });
  }
}

export const db = new SubGameLabDatabase();

export function createDefaultSession(mode: AppMode): ModeSessionState {
  return {
    fileName: '',
    fileSize: 0,
    sourceFormat: mode === 'cinema' ? 'srt' : 'csv',
    targetFormat: mode === 'cinema' ? 'srt' : 'csv',
    rawHeader: undefined,
    selectedEncoding: 'auto',
    detectedEncoding: '',
    items: [],
    gameColumns: [],
    gameMapping: {
      sourceColumn: 'Source',
      targetColumn: 'Translation',
      hasHeaders: true,
    },
    gameOriginalStructure: null,
    sourceLanguage: 'auto',
    detectedSourceLang: '',
    targetLanguage: 'fa',
    selectedTone: mode === 'cinema' ? 'cinematic' : 'epic',
    customPrompt: '',
    isTranslating: false,
    isPaused: false,
    currentBatch: 0,
    totalBatches: 0,
    translatedCount: 0,
    activeJobId: undefined,
    lastUploadedBuffer: null,
  };
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export async function saveSessionToDb(mode: AppMode, state: ModeSessionState): Promise<void> {
  try {
    // Avoid saving large raw buffer to IndexedDB to keep it fast
    const { lastUploadedBuffer: _omitted, ...serializableState } = state;
    await db.sessions.put({
      mode,
      state: {
        ...serializableState,
        isTranslating: false, // Do not persist transient translating state
        isPaused: false,
      },
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn(`[SubGameLabDB] Could not auto-save ${mode} session:`, err);
  }
}

export function debounceSaveSession(mode: AppMode, state: ModeSessionState, delayMs = 1200): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveSessionToDb(mode, state);
  }, delayMs);
}

export async function loadSessionFromDb(mode: AppMode): Promise<ModeSessionState | null> {
  try {
    const record = await db.sessions.get(mode);
    if (record && record.state && Array.isArray(record.state.items)) {
      return record.state;
    }
  } catch (err) {
    console.warn(`[SubGameLabDB] Could not load ${mode} session:`, err);
  }
  return null;
}

export async function clearSessionInDb(mode: AppMode): Promise<void> {
  try {
    await db.sessions.delete(mode);
  } catch (err) {
    console.warn(`[SubGameLabDB] Could not clear ${mode} session:`, err);
  }
}
