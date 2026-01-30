import { uk } from "./uk/common";
import { en } from "./en/common";
import type { Locale } from "@/data/types";

export const translations = { uk, en } as const;

export type TranslationKeys = typeof uk;

export function getTranslations(locale: Locale): TranslationKeys {
  return translations[locale] ?? translations.uk;
}
