import React, { useState, useEffect } from 'react';
import { UILanguage, TRANSLATIONS } from '../lib/i18n';
import { StoredApiKey, getStoredApiKeys, saveStoredApiKeys } from '../lib/apiKeyManager';
import { 
  Key, 
  X, 
  Check, 
  Trash2, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ExternalLink, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Plus,
  Layers,
  Star,
  RefreshCw
} from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  userApiKey?: string;
  onSaveKey: (key: string) => void;
  onClearKey: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  uiLang,
  userApiKey = '',
  onSaveKey,
  onClearKey,
}) => {
  const [keysList, setKeysList] = useState<StoredApiKey[]>([]);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [isTestingAll, setIsTestingAll] = useState(false);

  const t = TRANSLATIONS[uiLang];

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredApiKeys();
      if (stored.length === 0 && userApiKey) {
        const initial: StoredApiKey = {
          id: `key_${Date.now()}`,
          label: 'Primary Key',
          key: userApiKey,
          status: 'untested',
          isPrimary: true,
        };
        setKeysList([initial]);
        saveStoredApiKeys([initial]);
      } else {
        setKeysList(stored);
      }
      setNewKeyInput('');
      setNewKeyLabel('');
    }
  }, [isOpen, userApiKey]);

  if (!isOpen) return null;

  const handleToggleShow = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = newKeyInput.trim();
    if (!cleanKey) return;

    const newId = `key_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const labelToSet = newKeyLabel.trim() || `API Key #${keysList.length + 1}`;
    const isFirst = keysList.length === 0;

    const newEntry: StoredApiKey = {
      id: newId,
      label: labelToSet,
      key: cleanKey,
      status: 'untested',
      isPrimary: isFirst,
    };

    const updated = [...keysList, newEntry];
    setKeysList(updated);
    saveStoredApiKeys(updated);

    const primary = updated.find((k) => k.isPrimary) || updated[0];
    if (primary) {
      onSaveKey(primary.key);
    }

    setNewKeyInput('');
    setNewKeyLabel('');

    // Immediately test newly added key
    await handleTestSingleKey(newId, cleanKey);
  };

  const handleDeleteKey = (id: string) => {
    const updated = keysList.filter((k) => k.id !== id);
    if (updated.length > 0 && !updated.some((k) => k.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setKeysList(updated);
    saveStoredApiKeys(updated);

    if (updated.length > 0) {
      const primary = updated.find((k) => k.isPrimary) || updated[0];
      onSaveKey(primary.key);
    } else {
      onClearKey();
    }
  };

  const handleSetPrimary = (id: string) => {
    const updated = keysList.map((k) => ({
      ...k,
      isPrimary: k.id === id,
    }));
    setKeysList(updated);
    saveStoredApiKeys(updated);

    const primary = updated.find((k) => k.id === id);
    if (primary) {
      onSaveKey(primary.key);
    }
  };

  const handleTestSingleKey = async (id: string, keyStr: string) => {
    setTestingKeyId(id);
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyStr }),
      });
      const data = await res.json();
      const isValid = res.ok && data.success;

      setKeysList((prevKeys) => {
        const updated = prevKeys.map((k) =>
          k.id === id
            ? {
                ...k,
                status: (isValid ? 'valid' : 'invalid') as 'valid' | 'invalid',
                lastError: isValid ? undefined : data.error || (uiLang === 'en' ? 'Connection or Key Error' : 'ارتباط برقرار نشد یا کلید خراب است'),
              }
            : k
        );
        saveStoredApiKeys(updated);
        return updated;
      });
    } catch (err: any) {
      const errorMsg = uiLang === 'en' 
        ? `Connection failed: ${err?.message || 'Network error'}`
        : `ارتباط برقرار نشد: ${err?.message || 'خطای شبکه'}`;
      setKeysList((prevKeys) => {
        const updated = prevKeys.map((k) =>
          k.id === id
            ? { ...k, status: 'invalid' as const, lastError: errorMsg }
            : k
        );
        saveStoredApiKeys(updated);
        return updated;
      });
    } finally {
      setTestingKeyId(null);
    }
  };

  const handleTestAllKeys = async () => {
    if (keysList.length === 0) return;
    setIsTestingAll(true);

    try {
      const rawKeys = keysList.map((k) => k.key);
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeys: rawKeys }),
      });

      const data = await res.json();
      if (res.ok && data.results && Array.isArray(data.results)) {
        const resultMap = new Map<string, { success: boolean; error?: string }>();
        data.results.forEach((r: any) => resultMap.set(r.key, r));

        setKeysList((prevKeys) => {
          const updated = prevKeys.map((k) => {
            const resObj = resultMap.get(k.key);
            if (resObj) {
              return {
                ...k,
                status: (resObj.success ? 'valid' : 'invalid') as 'valid' | 'invalid',
                lastError: resObj.success
                  ? undefined
                  : resObj.error || (uiLang === 'en' ? 'Connection or Key Error' : 'ارتباط برقرار نشد یا کلید خراب است'),
              };
            }
            return k;
          });
          saveStoredApiKeys(updated);
          return updated;
        });
      }
    } catch (err: any) {
      console.error('Batch testing error:', err);
    } finally {
      setIsTestingAll(false);
    }
  };

  const getKeyLinkText = () => {
    if (uiLang === 'en') return 'Get Free Gemini Keys';
    if (uiLang === 'ar') return 'احصل على مفاتيح Gemini مجانیة';
    return 'دریافت کلیدهای رایگان Gemini';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative flex flex-col gap-5 transition-colors max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{uiLang === 'en' ? 'Multi API Key Manager & Auto Failover' : uiLang === 'ar' ? 'مدير المفاتيح المتعددة والتناوب التلقائي' : 'مدیریت چند کلید API و چرخش خودکار'}</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-800">
                  {keysList.length} {uiLang === 'en' ? 'Keys' : 'کلید'}
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {uiLang === 'en' 
                  ? 'Store multiple Gemini API keys. On 429 quota limits, system automatically rotates to the next key.'
                  : uiLang === 'ar'
                  ? 'قم بتخزين مفاتيح متعددة. عند حدوث ضغط على الحصة، يتم التناوب تلقائياً إلى المفتاح التالي.'
                  : 'چند کلید API ذخیره کنید. در صورت بروز محدودیت quota، سیستم خودکار به کلید بعدی منتقل می‌شود.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {keysList.length > 0 
                ? (uiLang === 'en' ? 'Auto-rotation active across all saved keys' : 'چرخش خودکار روی کلیدهای ثبت‌شده فعال است')
                : t.defaultKeyActive}
            </span>
          </div>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 font-semibold underline underline-offset-2 shrink-0"
          >
            <span>{getKeyLinkText()}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Saved Keys List */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>{uiLang === 'en' ? 'Saved API Keys Pool' : uiLang === 'ar' ? 'مجموعة المفاتيح' : 'لیست کلیدهای ذخیره‌شده'}</span>
            </h4>

            {keysList.length > 0 && (
              <button
                type="button"
                onClick={handleTestAllKeys}
                disabled={isTestingAll}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isTestingAll ? 'animate-spin text-indigo-500' : ''}`} />
                <span>{isTestingAll ? (uiLang === 'en' ? 'Testing All...' : 'در حال تست همه...') : (uiLang === 'en' ? 'Test All Keys' : 'تست همزمان تمام کلیدها')}</span>
              </button>
            )}
          </div>

          {keysList.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500">
              {uiLang === 'en' ? 'No custom API keys saved yet. Add your first key below.' : 'هنوز هیچ کلیدی ثبت نشده است. کلید جدید را در فرم زیر وارد کنید.'}
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              {keysList.map((k) => {
                const isMasked = !showKeys[k.id];
                const maskedKey = k.key.length > 10 ? `${k.key.slice(0, 6)}...${k.key.slice(-4)}` : '••••••••••••';

                return (
                  <div
                    key={k.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col gap-2.5 ${
                      k.isPrimary
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(k.id)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            k.isPrimary
                              ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
                              : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:text-amber-500'
                          }`}
                          title={k.isPrimary ? 'Primary Key' : 'Set as Primary'}
                        >
                          <Star className={`w-3.5 h-3.5 ${k.isPrimary ? 'fill-amber-500' : ''}`} />
                        </button>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {k.label}
                            </span>
                            {k.isPrimary && (
                              <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.2 rounded border border-amber-500/20">
                                {uiLang === 'en' ? 'Primary' : 'اصلی'}
                              </span>
                            )}
                            {k.status === 'valid' && (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-emerald-500/20 flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" /> {uiLang === 'en' ? 'Valid' : 'معتبر و فعال'}
                              </span>
                            )}
                            {k.status === 'invalid' && (
                              <span className="text-[9px] bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold px-1.5 py-0.2 rounded border border-rose-500/20 flex items-center gap-0.5">
                                <AlertCircle className="w-2.5 h-2.5" /> {uiLang === 'en' ? 'Key Error' : 'خطای ارتباط یا کلید'}
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {isMasked ? maskedKey : k.key}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleShow(k.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-200/60 dark:bg-slate-800 rounded-lg transition-colors text-xs"
                        >
                          {isMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTestSingleKey(k.id, k.key)}
                          disabled={testingKeyId === k.id}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {testingKeyId === k.id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                          ) : (
                            <Activity className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{uiLang === 'en' ? 'Test' : 'بررسی کلید'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                          title="Delete Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {k.lastError && (
                      <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 leading-relaxed break-words">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span className="font-medium flex-1">{k.lastError}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add New Key Form */}
        <form onSubmit={handleAddKey} className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-500" />
            <span>{uiLang === 'en' ? 'Add Another Gemini Key' : uiLang === 'ar' ? 'إضافة مفتاح جديد' : 'افزودن کلید جدید'}</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              placeholder={uiLang === 'en' ? 'Key Label (e.g. Work Key)' : 'عنوان کلید (مثلا کلید دوم)'}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <input
              type="text"
              value={newKeyInput}
              onChange={(e) => setNewKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="sm:col-span-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!newKeyInput.trim()}
            className="self-end px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{uiLang === 'en' ? 'Add Key to Pool' : 'افزودن کلید به لیست'}</span>
          </button>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};

