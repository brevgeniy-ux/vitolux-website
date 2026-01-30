"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export function ContactsClient() {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = (data.get("name") as string)?.trim();
    const email = (data.get("email") as string)?.trim();
    const phone = (data.get("phone") as string)?.trim();
    const message = (data.get("message") as string)?.trim();
    const agree = data.get("agree") === "on";
    const err: Record<string, string> = {};
    if (!name) err.name = t.validation.required;
    if (!email) err.email = t.validation.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err.email = t.validation.invalidEmail;
    if (!phone) err.phone = t.validation.required;
    if (!message) err.message = t.validation.required;
    if (!agree) err.agree = t.validation.required;
    setErrors(err);
    if (Object.keys(err).length > 0) return;
    setSent(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary-dark mb-8">{t.contacts.title}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-primary-dark mb-4">{t.contacts.formTitle}</h2>
          {sent ? (
            <p className="text-green-600">Your message has been sent. We will reply soon.</p>
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
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
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
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.contacts.phone}
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
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
                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
              </div>
              <div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" name="agree" className="mt-1 rounded border-gray-300 text-accent focus:ring-accent" />
                  <span className="text-sm text-gray-700">{t.contacts.agreeTerms}</span>
                </label>
                {errors.agree && <p className="text-red-500 text-sm mt-1">{errors.agree}</p>}
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent-hover transition"
              >
                {t.contacts.send}
              </button>
            </form>
          )}
        </div>
        <div>
          <div className="space-y-4 text-gray-700">
            <p><strong>{t.contacts.address}</strong></p>
            <p><a href={`tel:${t.header.phone}`} className="text-accent hover:underline">{t.header.phone}</a></p>
            <p><a href={`mailto:${t.header.email}`} className="text-accent hover:underline">{t.header.email}</a></p>
            <p>{t.contacts.workingHours}</p>
          </div>
          <div className="mt-6">
            <h3 className="font-semibold text-primary-dark mb-2">{t.contacts.map}</h3>
            <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
              <iframe
                title="Map"
                src="https://www.openstreetmap.org/export/embed.html?bbox=25.5%2C41.8%2C25.6%2C41.9&layer=mapnik"
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
