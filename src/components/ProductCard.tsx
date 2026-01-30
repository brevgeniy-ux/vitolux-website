"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { formatPriceDual } from "@/lib/formatPrice";
import type { Product } from "@/data/types";

type ProductCardProps = {
  product: Product;
  showPromoBadge?: boolean;
};

export function ProductCard({ product, showPromoBadge = true }: ProductCardProps) {
  const { locale, t } = useLanguage();
  const name = locale === "uk" ? product.name_uk : product.name_en;
  const isPromo = product.isPromo ?? false;

  return (
    <article className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition flex flex-col">
      <Link href={`/products/${product.slug}`} className="block flex-1 flex flex-col">
        <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
          <span className="text-gray-400 text-4xl font-light">VITO</span>
          {isPromo && showPromoBadge && (
            <span className="absolute top-2 right-2 bg-accent text-white text-xs font-semibold px-2 py-1 rounded">
              {t.promos.badge}
            </span>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-primary-dark line-clamp-2 mb-2">{name}</h3>
          <div className="mt-auto pt-2 border-t border-gray-100">
            {product.oldPriceUAH != null && product.oldPriceEUR != null ? (
              <div className="space-y-1">
                <span className="text-gray-400 line-through text-sm">
                  {formatPriceDual(product.oldPriceUAH, product.oldPriceEUR)}
                </span>
                <p className="text-accent font-semibold text-sm">
                  {formatPriceDual(product.priceUAH, product.priceEUR)}
                </p>
              </div>
            ) : (
              <p className="text-primary-dark font-semibold text-sm">
                {formatPriceDual(product.priceUAH, product.priceEUR)}
              </p>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
