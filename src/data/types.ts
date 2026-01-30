export type Locale = "uk" | "en";

export interface Category {
  id: string;
  name_uk: string;
  name_en: string;
}

export interface Product {
  id: string;
  slug: string;
  categoryId: string;
  name_uk: string;
  name_en: string;
  description_uk: string;
  description_en: string;
  priceUAH: number;
  priceEUR: number;
  /** Optional: old price for promo display */
  oldPriceUAH?: number;
  oldPriceEUR?: number;
  /** Promo flag */
  isPromo?: boolean;
  /** Article / SKU */
  article?: string;
  /** Technical params for product page */
  specs?: Record<string, { uk: string; en: string }>;
}
