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
}

const STORAGE_KEY = 'wavehaven_preferred_language';

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
      document.documentElement.dir = activeLangOption?.isRTL || language === 'ar' ? 'rtl' : 'ltr';
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

  // Compute translated dictionary reacting to language and version state
  const t = useMemo(() => {
    // version dependency ensures re-evaluation when translations change
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
    };
  }
  return context;
}
