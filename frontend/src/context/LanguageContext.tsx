import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'te';

interface LanguageContextProps {
  language: Language;
  changeLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  // Sync state with cookie on load
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const googtrans = getCookie('googtrans');
    const localLang = localStorage.getItem('agricare_lang') as Language | null;

    if (googtrans === '/en/te' || localLang === 'te') {
      setLanguage('te');
    } else {
      setLanguage('en');
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('agricare_lang', lang);

    // Google Translate cookie: googtrans=/source_lang/target_lang
    const cookieValue = lang === 'en' ? '' : `/en/${lang}`;

    // Set cookie on root path and root domain to ensure it propagates everywhere
    document.cookie = `googtrans=${cookieValue}; path=/;`;
    document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname};`;

    // Trigger select element inside the hidden Google Translate iframe/widget
    const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (selectEl) {
      selectEl.value = lang;
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // Fallback: Reload to let the page load the translated content using the new cookie value
      window.location.reload();
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
