"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { categories } from "@/data/categories";
import type { Locale } from "@/data/types";

type CategoryMenuProps = {
  activeCategoryId?: string | null;
  onCategoryClick?: (categoryId: string) => void;
  /** If true, render as links to /products?category=id; otherwise as buttons for filtering */
  asLinks?: boolean;
  compact?: boolean;
};

export function CategoryMenu({
  activeCategoryId,
  onCategoryClick,
  asLinks = true,
  compact = false,
}: CategoryMenuProps) {
  const { locale, t } = useLanguage();
  const nameKey = (locale === "uk" ? "name_uk" : "name_en") as keyof (typeof categories)[0];

  return (
    <nav className={compact ? "space-y-1" : "space-y-2"}>
      <h3 className="font-semibold text-primary-dark mb-2 text-sm uppercase tracking-wide">
        {t.home.productCategories}
      </h3>
      <ul className="space-y-1">
        {asLinks && (
          <li>
            <Link
              href="/products"
              className={`block px-3 py-2 rounded text-sm transition ${!activeCategoryId ? "bg-accent text-white" : "hover:bg-gray-100 text-gray-700"}`}
            >
              {t.products.allCategories}
            </Link>
          </li>
        )}
        {!asLinks && onCategoryClick && (
          <li>
            <button
              type="button"
              onClick={() => onCategoryClick("")}
              className={`block w-full text-left px-3 py-2 rounded text-sm transition ${!activeCategoryId ? "bg-accent text-white" : "hover:bg-gray-100 text-gray-700"}`}
            >
              {t.products.allCategories}
            </button>
          </li>
        )}
        {categories.map((cat) => {
          const name = cat[nameKey] as string;
          const isActive = activeCategoryId === cat.id;
          const href = asLinks ? `/products?category=${cat.id}` : undefined;
          const content = (
            <span className={compact ? "line-clamp-2" : ""}>{name}</span>
          );
          if (asLinks && href) {
            return (
              <li key={cat.id}>
                <Link
                  href={href}
                  className={`block px-3 py-2 rounded text-sm transition ${isActive ? "bg-accent text-white" : "hover:bg-gray-100 text-gray-700"}`}
                >
                  {content}
                </Link>
              </li>
            );
          }
          return (
            <li key={cat.id}>
              <button
                type="button"
                onClick={() => onCategoryClick?.(cat.id)}
                className={`block w-full text-left px-3 py-2 rounded text-sm transition ${isActive ? "bg-accent text-white" : "hover:bg-gray-100 text-gray-700"}`}
              >
                {content}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
