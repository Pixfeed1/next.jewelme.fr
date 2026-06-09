'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Locale = 'fr' | 'en';
export const LOCALES: { code: Locale; iso: string; label: string; id_lang: number }[] = [
  { code: 'fr', iso: 'FR', label: 'Français', id_lang: 1 },
  { code: 'en', iso: 'EN', label: 'English', id_lang: 2 },
];

interface LocaleContextValue {
  locale: Locale;
  idLang: number;
  setLocale: (l: Locale) => void;
}

const LocaleCtx = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children, initialLocale = 'fr' }: { children: ReactNode; initialLocale?: Locale; }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // Lire le cookie au mount
    const m = document.cookie.match(/locale=(fr|en)/);
    if (m) setLocaleState(m[1] as Locale);
  }, []);

  const setLocale = (l: Locale) => {
    document.cookie = `locale=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setLocaleState(l);
    // Rediriger vers la même page mais dans la nouvelle langue
    const currentPath = window.location.pathname;
    // Remove existing locale prefix if present
    const stripped = currentPath.replace(/^\/(fr|en)(?=\/|$)/, '') || '/';
    const target = `/${l}${stripped === '/' ? '' : stripped}` + window.location.search;
    window.location.href = target;
  };

  const idLang = LOCALES.find(x => x.code === locale)?.id_lang ?? 1;

  return (
    <LocaleCtx.Provider value={{ locale, idLang, setLocale }}>
      {children}
    </LocaleCtx.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const v = useContext(LocaleCtx);
  if (!v) return { locale: 'fr', idLang: 1, setLocale: () => {} };
  return v;
}

// Helper SSR : lire le cookie locale côté serveur via next/headers
export function getServerLocale(cookieHeader?: string): Locale {
  if (!cookieHeader) return 'fr';
  const m = cookieHeader.match(/locale=(fr|en)/);
  return (m ? m[1] : 'fr') as Locale;
}

export function localeToIdLang(l: Locale): number {
  return LOCALES.find(x => x.code === l)?.id_lang ?? 1;
}
