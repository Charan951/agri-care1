import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { language, changeLanguage } = useLanguage();

  return (
    <button
      onClick={() => changeLanguage(language === 'en' ? 'te' : 'en')}
      className="flex items-center gap-1.5 text-xs font-bold border border-brand/20 bg-brand/5 text-brand px-3 py-1.5 rounded-full hover:bg-brand/10 transition-all cursor-pointer shadow-soft"
      title={language === 'en' ? 'Translate to Telugu' : 'Translate to English'}
    >
      <span>🌐</span>
      <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
    </button>
  );
};
