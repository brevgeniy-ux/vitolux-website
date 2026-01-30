"use client";

import { useLanguage } from "@/context/LanguageContext";

export function AboutClient() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-primary-dark mb-6">{t.about.title}</h1>
      <p className="text-gray-700 mb-4">{t.about.intro}</p>
      <p className="text-gray-700 mb-4">{t.about.directions}</p>
      <p className="text-gray-700">{t.about.service}</p>
    </div>
  );
}
