import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import i18n, { Language } from '../services/i18n';

const LanguageSelector: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(i18n.getCurrentLanguage());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleLanguageChange = (language: Language) => {
      setCurrentLanguage(language);
    };

    i18n.addLanguageChangeListener(handleLanguageChange);
    
    return () => {
      i18n.removeLanguageChangeListener(handleLanguageChange);
    };
  }, []);

  const languages = [
    { code: 'en' as Language, name: 'English', nativeName: 'English' },
    { code: 'ar' as Language, name: 'Arabic', nativeName: 'العربية' },
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  const handleLanguageChange = (language: Language) => {
    i18n.setLanguage(language);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors focus-visible"
        aria-label={i18n.t('a11y.menuToggle')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe size={16} aria-hidden="true" />
        <span className="hidden sm:inline">{currentLang?.nativeName}</span>
        <ChevronDown 
          size={14} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="py-1" role="menu" aria-orientation="vertical">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full text-start px-4 py-2 text-sm transition-colors focus-visible ${
                    currentLanguage === language.code
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  role="menuitem"
                  aria-current={currentLanguage === language.code ? 'true' : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span>{language.nativeName}</span>
                    {currentLanguage === language.code && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full" aria-hidden="true" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {language.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector; 