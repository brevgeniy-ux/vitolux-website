"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { formatPriceDual } from "@/lib/formatPrice";
import type { Product } from "@/data/types";

type Props = { product: Product };

export function ProductDetailClient({ product }: Props) {
  const { locale, t } = useLanguage();
  const name = locale === "uk" ? product.name_uk : product.name_en;
  const description = locale === "uk" ? product.description_uk : product.description_en;
  const [formSent, setFormSent] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = (data.get("email") as string)?.trim();
    const nameField = (data.get("name") as string)?.trim();
    const message = (data.get("message") as string)?.trim();
    const errors: Record<string, string> = {};
    if (!nameField) errors.name = t.validation.required;
    if (!email) errors.email = t.validation.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = t.validation.invalidEmail;
    if (!message) errors.message = t.validation.required;
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setFormSent(true);
  };

  const specs = product.specs ?? {};
  const specKeys = Object.keys(specs);

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/products" className="hover:text-accent">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-primary-dark">{name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <span className="text-gray-400 text-5xl font-light">VITO</span>
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-dark mb-2">{name}</h1>
          {product.article && (
            <p className="text-gray-500 text-sm mb-4">
              {t.products.article}: {product.article}
            </p>
          )}
          <p className="text-gray-700 mb-4">{description}</p>
          <div className="text-xl font-semibold text-primary-dark mb-4">
            {product.oldPriceUAH != null && product.oldPriceEUR != null ? (
              <span className="block">
                <span className="text-gray-400 line-through text-base mr-2">
                  {formatPriceDual(product.oldPriceUAH, product.oldPriceEUR)}
                </span>
                {formatPriceDual(product.priceUAH, product.priceEUR)}
              </span>
            ) : (
              formatPriceDual(product.priceUAH, product.priceEUR)
            )}
          </div>
          {specKeys.length > 0 && (
            <dl className="border-t border-gray-200 pt-4">
              <dt className="font-semibold text-primary-dark mb-2">{t.products.specs}</dt>
              <dd className="space-y-1">
                {specKeys.map((key) => (
                  <div key={key} className="flex gap-2 text-sm">
                    <span className="text-gray-500 capitalize">{key}:</span>
                    <span>{locale === "uk" ? specs[key].uk : specs[key].en}</span>
                  </div>
                ))}
              </dd>
            </dl>
          )}
        </div>
      </div>

      <section className="max-w-md border border-gray-200 rounded-lg p-6 bg-gray-50">
        <h2 className="text-lg font-semibold text-primary-dark mb-4">{t.products.sendInquiry}</h2>
        {formSent ? (
          <p className="text-green-600">Your inquiry has been sent. We will contact you shortly.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t.contacts.name}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
              />
              {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t.contacts.email}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
              />
              {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                {t.contacts.message}
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
              />
              {formErrors.message && <p className="text-red-500 text-sm mt-1">{formErrors.message}</p>}
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent-hover transition"
            >
              {t.products.sendInquiry}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
