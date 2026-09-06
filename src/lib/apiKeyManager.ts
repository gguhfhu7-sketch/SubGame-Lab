import { AIProvider, CustomProviderConfig } from '../types';

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
const LOCAL_STORAGE_AI_PROVIDER = 'subgame_ai_provider';
const LOCAL_STORAGE_CUSTOM_PROVIDER = 'subgame_custom_provider_config';

export function getActiveAiProvider(): AIProvider {
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_AI_PROVIDER);
    if (val === 'custom') return 'custom';
  } catch (err) {
    console.error('Failed to parse AI provider from localStorage:', err);
  }
  return 'gemini';
}

export function setActiveAiProvider(provider: AIProvider): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_AI_PROVIDER, provider);
  } catch (err) {
    console.error('Failed to save AI provider to localStorage:', err);
  }
}

export function getStoredCustomProvider(): CustomProviderConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_PROVIDER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          name: typeof parsed.name === 'string' ? parsed.name : '',
          baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : '',
          apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
          model: typeof parsed.model === 'string' ? parsed.model : '',
        };
      }
    }
  } catch (err) {
    console.error('Failed to parse custom provider config from localStorage:', err);
  }
  return {
    name: '',
    baseUrl: '',
    apiKey: '',
    model: '',
  };
}

export function saveStoredCustomProvider(config: CustomProviderConfig): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_PROVIDER, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save custom provider config to localStorage:', err);
  }
}

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
