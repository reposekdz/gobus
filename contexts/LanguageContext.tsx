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
  t: (key: string, values?: { [key: string]: string | number }) => string;
  languages: Language[];
}

const defaultLanguage: LanguageCode = 'RW';

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

  const t = (key: string, values?: { [key: string]: string | number }): string => {
    let translation = translations[language][key] || translations[defaultLanguage][key] || key;
    if (values) {
        Object.keys(values).forEach(valueKey => {
            const regex = new RegExp(`{${valueKey}}`, 'g');
            translation = translation.replace(regex, String(values[valueKey]));
        });
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);