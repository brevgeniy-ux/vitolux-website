"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const navItems = [
  { href: "/", key: "home" as const },
  { href: "/products", key: "products" as const },
  { href: "/promos", key: "promos" as const },
  { href: "/about", key: "about" as const },
  { href: "/contacts", key: "contacts" as const },
  { href: "/terms", key: "terms" as const },
];

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary-dark text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-3">Vitolux</h3>
            <p className="text-white/80 text-sm">{t.footer.address}</p>
            <a href={`tel:${t.header.phone}`} className="block mt-2 text-sm hover:text-accent transition">
              {t.header.phone}
            </a>
            <a href={`mailto:${t.header.email}`} className="block text-sm hover:text-accent transition">
              {t.header.email}
            </a>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">{t.nav.products}</h3>
            <ul className="space-y-2">
              {navItems.map(({ href, key }) => (
                <li key={href}>
                  <Link href={href} className="text-white/80 hover:text-accent transition text-sm">
                    {key === "terms" ? t.footer.terms : t.nav[key as keyof typeof t.nav]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">{t.header.workingHours}</h3>
            <p className="text-white/80 text-sm">{t.footer.address}</p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/20 text-center text-white/70 text-sm">
          © {new Date().getFullYear()} Vitolux. {t.terms.title}.
        </div>
      </div>
    </footer>
  );
}
