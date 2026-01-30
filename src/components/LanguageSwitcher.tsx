"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/data/types";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        type="button"
        onClick={() => setLocale("uk")}
        className={`px-2 py-1 rounded transition ${locale === "uk" ? "bg-accent text-white font-medium" : "text-primary-dark hover:bg-primary-dark/10"}`}
        aria-label="Українська"
      >
        UA
      </button>
      <span className="text-gray-400">|</span>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`px-2 py-1 rounded transition ${locale === "en" ? "bg-accent text-white font-medium" : "text-primary-dark hover:bg-primary-dark/10"}`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
