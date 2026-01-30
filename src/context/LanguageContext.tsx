"use client";

import React, { createContext, useContext, useCallback, useState, useEffect } from "react";
import type { Locale } from "@/data/types";
import { getTranslations, type TranslationKeys } from "@/locales";

const STORAGE_KEY = "vitolux-locale";

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("uk");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored === "uk" || stored === "en") setLocaleState(stored);
      setMounted(true);
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = getTranslations(locale);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
