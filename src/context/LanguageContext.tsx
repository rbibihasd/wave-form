import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { SupportedLanguage } from '../types';
import { 
  translations, 
  Translations, 
  getTranslations, 
  formatTemplate, 
  getAllSupportedLanguages,
  saveCustomLanguage,
  deleteCustomLanguage as removeCustomLanguage,
  saveLanguageTranslations,
  importLanguageTranslations,
  resetLanguageTranslations,
  LanguageOption 
} from '../i18n/translations';

export type AIProviderType = 'gemini' | 'openrouter' | 'chatgpt';

export interface AIProviderInfo {
  id: AIProviderType;
  name: string;
  shortName: string;
  modelLabel: string;
  badgeColor: string;
  description: string;
}

export const AI_TRANSLATION_PROVIDERS: AIProviderInfo[] = [
  {
    id: 'gemini',
    name: 'Google Gemini AI',
    shortName: 'Gemini',
    modelLabel: 'gemini-4-hydrogen',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
    description: 'Fast, context-aware neural translation powered by Gemini 4 Hydrogen',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter Multi-Model',
    shortName: 'OpenRouter',
    modelLabel: 'openrouter/auto',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    description: 'Unified OpenRouter routing across top multilingual LLMs',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT (OpenAI)',
    shortName: 'ChatGPT',
    modelLabel: 'gpt-4o-mini',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'Hospitality-tuned localization powered by OpenAI ChatGPT',
  },
];

export const AI_GLOBAL_LANGUAGE_PRESETS: LanguageOption[] = [
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', isRTL: false, isCustom: true },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', isRTL: false, isCustom: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', isRTL: false, isCustom: true },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', isRTL: false, isCustom: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', isRTL: false, isCustom: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', isRTL: false, isCustom: true },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', isRTL: false, isCustom: true },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', isRTL: false, isCustom: true },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', isRTL: false, isCustom: true },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', isRTL: false, isCustom: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', isRTL: false, isCustom: true },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', isRTL: false, isCustom: true },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', isRTL: true, isCustom: true },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', isRTL: false, isCustom: true },
];

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translations;
  format: (template: string, vars: Record<string, string | number>) => string;
  languages: LanguageOption[];
  reloadLanguages: () => void;
  addLanguage: (option: LanguageOption, initialTranslations?: Partial<Translations>) => void;
  deleteLanguage: (code: string) => void;
  updateTranslations: (lang: SupportedLanguage, overrides: Record<string, any>) => void;
  importTranslations: (lang: SupportedLanguage, jsonString: string) => boolean;
  resetTranslations: (lang: SupportedLanguage) => void;
  // AI Translation capabilities
  aiProvider: AIProviderType;
  setAiProvider: (provider: AIProviderType) => void;
  autoTranslateOnSwitch: boolean;
  setAutoTranslateOnSwitch: (enabled: boolean) => void;
  isTranslating: boolean;
  translationStatus: string | null;
  lastTranslatedBy: Record<string, { provider: AIProviderType; timestamp: string }>;
  switchLanguageByAI: (
    targetLangCode: string,
    options?: {
      name?: string;
      nativeName?: string;
      flag?: string;
      isRTL?: boolean;
      provider?: AIProviderType;
      forceRetranslate?: boolean;
    }
  ) => Promise<boolean>;
}

const STORAGE_KEY = 'wavehaven_preferred_language';
const AI_PROVIDER_STORAGE_KEY = 'wavehaven_ai_translation_provider';
const AI_AUTO_TRANSLATE_KEY = 'wavehaven_ai_auto_translate';
const AI_TRANSLATED_META_KEY = 'wavehaven_ai_translated_meta';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export interface LanguageProviderProps {
  children: ReactNode;
  initialDefaultLanguage?: SupportedLanguage;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  initialDefaultLanguage = 'en',
}) => {
  const [languagesList, setLanguagesList] = useState<LanguageOption[]>(() => getAllSupportedLanguages());
  const [version, setVersion] = useState(0);

  const [aiProvider, setAiProviderState] = useState<AIProviderType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(AI_PROVIDER_STORAGE_KEY) as AIProviderType | null;
      if (saved === 'gemini' || saved === 'openrouter' || saved === 'chatgpt') {
        return saved;
      }
    }
    return 'gemini';
  });

  const [autoTranslateOnSwitch, setAutoTranslateState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(AI_AUTO_TRANSLATE_KEY);
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const [isTranslating, setIsTranslating] = useState(false);
  const [translationStatus, setTranslationStatus] = useState<string | null>(null);
  const [lastTranslatedBy, setLastTranslatedBy] = useState<Record<string, { provider: AIProviderType; timestamp: string }>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(AI_TRANSLATED_META_KEY);
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore
      }
    }
    return {};
  });

  const setAiProvider = useCallback((provider: AIProviderType) => {
    setAiProviderState(provider);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AI_PROVIDER_STORAGE_KEY, provider);
    }
  }, []);

  const setAutoTranslateOnSwitch = useCallback((enabled: boolean) => {
    setAutoTranslateState(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AI_AUTO_TRANSLATE_KEY, String(enabled));
    }
  }, []);

  const reloadLanguages = useCallback(() => {
    setLanguagesList(getAllSupportedLanguages());
    setVersion(v => v + 1);
  }, []);

  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (stored) {
        return stored;
      }
    }
    return initialDefaultLanguage;
  });

  // Synchronize document lang & dir attributes for RTL / LTR accessibility
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      const activeLangOption = languagesList.find(l => l.code === language);
      document.documentElement.dir = activeLangOption?.isRTL || language === 'ar' || language === 'he' ? 'rtl' : 'ltr';
    }
  }, [language, languagesList]);

  // Keep in sync if settings default language changes and no local preference exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored && initialDefaultLanguage) {
        setLanguageState(initialDefaultLanguage);
      }
    }
  }, [initialDefaultLanguage]);

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLang);
    }
  }, []);

  const addLanguage = useCallback((option: LanguageOption, initialTranslations?: Partial<Translations>) => {
    saveCustomLanguage(option);
    if (initialTranslations) {
      saveLanguageTranslations(option.code, initialTranslations);
    }
    reloadLanguages();
  }, [reloadLanguages]);

  const deleteLanguage = useCallback((code: string) => {
    removeCustomLanguage(code);
    if (language === code) {
      setLanguage('en');
    }
    reloadLanguages();
  }, [language, reloadLanguages, setLanguage]);

  const updateTranslations = useCallback((lang: SupportedLanguage, overrides: Record<string, any>) => {
    saveLanguageTranslations(lang, overrides);
    setVersion(v => v + 1);
  }, []);

  const importTranslations = useCallback((lang: SupportedLanguage, jsonString: string): boolean => {
    const success = importLanguageTranslations(lang, jsonString);
    if (success) {
      setVersion(v => v + 1);
    }
    return success;
  }, []);

  const resetTranslations = useCallback((lang: SupportedLanguage) => {
    resetLanguageTranslations(lang);
    setVersion(v => v + 1);
  }, []);

  // Switch & Translate Language Automatically via AI (Gemini, OpenRouter, or ChatGPT)
  const switchLanguageByAI = useCallback(async (
    targetLangCode: string,
    options?: {
      name?: string;
      nativeName?: string;
      flag?: string;
      isRTL?: boolean;
      provider?: AIProviderType;
      forceRetranslate?: boolean;
    }
  ): Promise<boolean> => {
    const cleanCode = targetLangCode.trim().toLowerCase();
    const chosenProvider = options?.provider || aiProvider;
    const providerInfo = AI_TRANSLATION_PROVIDERS.find(p => p.id === chosenProvider) || AI_TRANSLATION_PROVIDERS[0];

    // Find language metadata from existing list or global presets
    const existingOpt = languagesList.find(l => l.code === cleanCode) || AI_GLOBAL_LANGUAGE_PRESETS.find(l => l.code === cleanCode);
    const langOption: LanguageOption = {
      code: cleanCode,
      name: options?.name || existingOpt?.name || cleanCode.toUpperCase(),
      nativeName: options?.nativeName || existingOpt?.nativeName || options?.name || cleanCode.toUpperCase(),
      flag: options?.flag || existingOpt?.flag || '🌐',
      isRTL: options?.isRTL ?? existingOpt?.isRTL ?? (cleanCode === 'ar' || cleanCode === 'he'),
      isCustom: existingOpt ? existingOpt.isCustom : true,
    };

    // Ensure the language is registered in the supported list if it isn't already
    if (!languagesList.some(l => l.code === cleanCode)) {
      saveCustomLanguage(langOption);
      reloadLanguages();
    }

    // If English and not forced, just switch immediately
    if (cleanCode === 'en' && !options?.forceRetranslate) {
      setLanguage('en');
      return true;
    }

    // Check if built-in or already AI-translated (unless forceRetranslate is true)
    const isBuiltIn = cleanCode in translations;
    const hasCustomSaved = (() => {
      if (typeof window === 'undefined') return false;
      try {
        const raw = localStorage.getItem('wavehaven_custom_translations');
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return Boolean(parsed[cleanCode]);
      } catch {
        return false;
      }
    })();

    if (!options?.forceRetranslate && (isBuiltIn || hasCustomSaved) && !autoTranslateOnSwitch) {
      setLanguage(cleanCode);
      return true;
    }

    // If it's already translated by AI or built-in and not forced, switch immediately if it has custom AI translation
    if (!options?.forceRetranslate && hasCustomSaved) {
      setLanguage(cleanCode);
      return true;
    }

    // Perform automatic AI translation via backend proxy
    setIsTranslating(true);
    setTranslationStatus(`Translating to ${langOption.name} via ${providerInfo.shortName}...`);

    try {
      const response = await fetch('/api/ai/translate-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLangCode: cleanCode,
          targetLangName: langOption.name,
          provider: chosenProvider,
          sourceDictionary: translations.en,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.translations) {
        throw new Error(data.error || 'AI translation failed');
      }

      saveLanguageTranslations(cleanCode, data.translations);
      const updatedMeta = {
        ...lastTranslatedBy,
        [cleanCode]: {
          provider: chosenProvider,
          timestamp: new Date().toISOString(),
        },
      };
      setLastTranslatedBy(updatedMeta);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AI_TRANSLATED_META_KEY, JSON.stringify(updatedMeta));
      }

      setLanguage(cleanCode);
      setVersion(v => v + 1);
      setTranslationStatus(`Translated to ${langOption.nativeName} by ${providerInfo.shortName} ✓`);
      setTimeout(() => setTranslationStatus(null), 3500);
      setIsTranslating(false);
      return true;
    } catch (err: any) {
      console.error('AI translation error:', err);
      // Still switch language (will use built-in dictionary if available)
      setLanguage(cleanCode);
      setTranslationStatus(`Switched to ${langOption.name}`);
      setTimeout(() => setTranslationStatus(null), 3000);
      setIsTranslating(false);
      return false;
    }
  }, [aiProvider, autoTranslateOnSwitch, languagesList, lastTranslatedBy, reloadLanguages, setLanguage]);

  // Compute translated dictionary reacting to language and version state
  const t = useMemo(() => {
    return getTranslations(language);
  }, [language, version]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    format: formatTemplate,
    languages: languagesList,
    reloadLanguages,
    addLanguage,
    deleteLanguage,
    updateTranslations,
    importTranslations,
    resetTranslations,
    aiProvider,
    setAiProvider,
    autoTranslateOnSwitch,
    setAutoTranslateOnSwitch,
    isTranslating,
    translationStatus,
    lastTranslatedBy,
    switchLanguageByAI,
  }), [
    language,
    setLanguage,
    t,
    languagesList,
    reloadLanguages,
    addLanguage,
    deleteLanguage,
    updateTranslations,
    importTranslations,
    resetTranslations,
    aiProvider,
    setAiProvider,
    autoTranslateOnSwitch,
    setAutoTranslateOnSwitch,
    isTranslating,
    translationStatus,
    lastTranslatedBy,
    switchLanguageByAI,
  ]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: translations.en,
      format: formatTemplate,
      languages: getAllSupportedLanguages(),
      reloadLanguages: () => {},
      addLanguage: () => {},
      deleteLanguage: () => {},
      updateTranslations: () => {},
      importTranslations: () => false,
      resetTranslations: () => {},
      aiProvider: 'gemini',
      setAiProvider: () => {},
      autoTranslateOnSwitch: true,
      setAutoTranslateOnSwitch: () => {},
      isTranslating: false,
      translationStatus: null,
      lastTranslatedBy: {},
      switchLanguageByAI: async () => false,
    };
  }
  return context;
}

