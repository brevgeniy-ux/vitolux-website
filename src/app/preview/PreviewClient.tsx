"use client";

import { CategoryMenu } from "@/components/CategoryMenu";
import { ProductGrid } from "@/components/ProductGrid";
import type { Product } from "@/data/types";

type Props = {
  promoProducts: Product[];
  sampleProducts: Product[];
};

export function PreviewClient({ promoProducts, sampleProducts }: Props) {
  return (
    <div className="container mx-auto px-4 py-8">
      <p className="text-gray-500 mb-6">
        This page shows key blocks. Header and footer are above/below (site layout).
      </p>
      <h1 className="text-3xl font-bold text-primary-dark mb-8">Preview – key blocks</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-primary-dark mb-4">Product categories / Продуктові категорії</h2>
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-64 shrink-0">
            <CategoryMenu activeCategoryId={null} asLinks compact />
          </aside>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-primary-dark mb-4">Product cards (UAH / EUR)</h2>
        <ProductGrid products={sampleProducts} showPromoBadge />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-primary-dark mb-4">Promotions / Промоції</h2>
        <ProductGrid products={promoProducts.length > 0 ? promoProducts : sampleProducts.slice(0, 3)} showPromoBadge />
      </section>
    </div>
  );
}
