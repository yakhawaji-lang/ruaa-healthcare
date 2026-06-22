// Language context: holds current lang (ar/en), toggles document dir, and
// exposes a t() helper + a pick() helper for {ar,en} content objects.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import translations from './translations.js';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ar');

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = translations[lang].dir;
  }, [lang]);

  const t = useCallback((key) => translations[lang][key] ?? key, [lang]);
  const toggle = useCallback(() => setLang((l) => (l === 'ar' ? 'en' : 'ar')), []);
  // pick the right field from a row that has *_ar / *_en columns
  const pick = useCallback(
    (obj, base) => (obj ? obj[`${base}_${lang}`] ?? obj[`${base}_ar`] : ''),
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, setLang, toggle, t, pick, dir: translations[lang].dir }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
