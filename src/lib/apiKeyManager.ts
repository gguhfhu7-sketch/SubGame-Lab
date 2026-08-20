export interface StoredApiKey {
  id: string;
  label: string;
  key: string;
  status: 'valid' | 'invalid' | 'untested';
  lastError?: string;
  isPrimary?: boolean;
}

const LOCAL_STORAGE_KEYS_LIST = 'gemini_api_keys_v2';
const LOCAL_STORAGE_SINGLE_KEY = 'gemini_api_key';

export function getStoredApiKeys(): StoredApiKey[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse stored API keys:', err);
  }

  // Fallback to legacy single key if present
  const singleKey = localStorage.getItem(LOCAL_STORAGE_SINGLE_KEY);
  if (singleKey && singleKey.trim()) {
    const defaultList: StoredApiKey[] = [
      {
        id: 'default_key_1',
        label: 'Primary Key',
        key: singleKey.trim(),
        status: 'untested',
        isPrimary: true,
      },
    ];
    saveStoredApiKeys(defaultList);
    return defaultList;
  }

  return [];
}

export function saveStoredApiKeys(keys: StoredApiKey[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS_LIST, JSON.stringify(keys));
    // Keep legacy key in sync with primary key for backwards compatibility
    const primary = keys.find((k) => k.isPrimary) || keys[0];
    if (primary && primary.key) {
      localStorage.setItem(LOCAL_STORAGE_SINGLE_KEY, primary.key);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_SINGLE_KEY);
    }
  } catch (err) {
    console.error('Failed to save API keys to localStorage:', err);
  }
}

export function getActiveApiKeysArray(): string[] {
  const keys = getStoredApiKeys();
  return keys.map((k) => k.key.trim()).filter(Boolean);
}

export function getApiKeyArrayForHeader(): string[] {
  return getActiveApiKeysArray();
}
