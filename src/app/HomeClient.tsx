"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { CategoryMenu } from "@/components/CategoryMenu";
import { ProductGrid } from "@/components/ProductGrid";
import { getPromoProducts } from "@/data";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import type { Locale } from "@/data/types";

export function HomeClient() {
  const { t, locale } = useLanguage();
  const promoProducts = getPromoProducts();
  const nameKey = (locale === "uk" ? "name_uk" : "name_en") as keyof (typeof categories)[0];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <section className="bg-primary text-white rounded-2xl p-8 md:p-12 mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{t.home.heroTitle}</h1>
        <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">{t.home.heroSubtitle}</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent-hover transition"
          >
            {t.home.viewProducts}
          </Link>
          <Link
            href="/contacts"
            className="inline-flex items-center justify-center px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition border border-white/40"
          >
            {t.nav.contacts}
          </Link>
        </div>
      </section>

      {/* Product categories */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-primary-dark mb-6">{t.home.productCategories}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.id}`}
              className="block p-4 rounded-lg border border-gray-200 hover:border-accent hover:shadow-md transition bg-white"
            >
              <h3 className="font-semibold text-primary-dark line-clamp-2 text-sm">
                {cat[nameKey] as string}
              </h3>
            </Link>
          ))}
        </div>
        <div className="mt-4">
          <Link href="/products" className="text-accent font-medium hover:underline">
            {t.products.allCategories} →
          </Link>
        </div>
      </section>

      {/* Promotions */}
      <section>
        <h2 className="text-2xl font-bold text-primary-dark mb-6">{t.home.promotions}</h2>
        <ProductGrid products={promoProducts.length > 0 ? promoProducts : products.slice(0, 4)} showPromoBadge />
      </section>
    </div>
  );
}
