import { products } from "./products";

export { categories } from "./categories";
export { products } from "./products";
export type { Category, Product, Locale } from "./types";

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug) ?? null;
}

export function getProductsByCategory(categoryId: string) {
  return products.filter((p) => p.categoryId === categoryId);
}

export function getPromoProducts() {
  return products.filter((p) => p.isPromo);
}
