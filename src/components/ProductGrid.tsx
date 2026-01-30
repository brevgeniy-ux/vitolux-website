"use client";

import { useLanguage } from "@/context/LanguageContext";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/data/types";

type ProductGridProps = {
  products: Product[];
  showPromoBadge?: boolean;
};

export function ProductGrid({ products, showPromoBadge = true }: ProductGridProps) {
  const { t } = useLanguage();
  if (products.length === 0) {
    return (
      <p className="text-gray-500 col-span-full text-center py-12">
        {t.products.noProducts}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} showPromoBadge={showPromoBadge} />
      ))}
    </div>
  );
}
