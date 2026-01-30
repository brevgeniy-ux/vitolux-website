"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { CategoryMenu } from "@/components/CategoryMenu";
import { ProductGrid } from "@/components/ProductGrid";
import { products } from "@/data/products";
import type { Locale } from "@/data/types";

export function ProductsClient() {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category") ?? "";
  const { locale, t } = useLanguage();
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    let list = products;
    if (categoryFromUrl) {
      list = list.filter((p) => p.categoryId === categoryFromUrl);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const nameUk = (p: (typeof products)[0]) => p.name_uk.toLowerCase().includes(q);
      const nameEn = (p: (typeof products)[0]) => p.name_en.toLowerCase().includes(q);
      list = list.filter((p) => nameUk(p) || nameEn(p));
    }
    return list;
  }, [categoryFromUrl, search]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary-dark mb-6">{t.products.title}</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 shrink-0">
          <div className="sticky top-4">
            <CategoryMenu activeCategoryId={categoryFromUrl || null} asLinks />
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <input
              type="search"
              placeholder={t.products.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
              aria-label="Search products"
            />
          </div>
          <ProductGrid products={filteredProducts} />
        </div>
      </div>
    </div>
  );
}
