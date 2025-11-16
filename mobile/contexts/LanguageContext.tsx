
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { translations } from '../translations';

export type LanguageCode = 'RW' | 'EN' | 'FR';

export type Language = {
    code: LanguageCode;
    name: string;
    flag: string;
}

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  languages: Language[];
}

const defaultLanguage: LanguageCode = 'RW';

// NOTE: This context is imported from the web folder. In a real monorepo, it would be in a shared package.
export const LanguageContext = createContext<LanguageContextType>({
  language: defaultLanguage,
  setLanguage: () => {},
  t: () => '',
  languages: [],
});

const supportedLanguages: Language[] = [
    { code: 'RW', name: 'Kinyarwanda', flag: '🇷🇼' },
    { code: 'EN', name: 'English', flag: '🇬🇧' },
    { code: 'FR', name: 'Français', flag: '🇫🇷' },
];


export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>(defaultLanguage);

  const t = (key: string): string => {
    const langKeys = translations[language] || translations[defaultLanguage];
    return langKeys[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
