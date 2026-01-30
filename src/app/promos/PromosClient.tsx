"use client";

import { useLanguage } from "@/context/LanguageContext";
import { ProductGrid } from "@/components/ProductGrid";
import type { Product } from "@/data/types";

type Props = { products: Product[] };

export function PromosClient({ products }: Props) {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary-dark mb-6">{t.promos.title}</h1>
      <ProductGrid products={products} showPromoBadge />
    </div>
  );
}
