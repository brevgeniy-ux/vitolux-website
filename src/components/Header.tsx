"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

const navItems = [
  { href: "/", key: "home" as const },
  { href: "/products", key: "products" as const },
  { href: "/promos", key: "promos" as const },
  { href: "/about", key: "about" as const },
  { href: "/contacts", key: "contacts" as const },
];

export function Header() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <header className="bg-primary-dark text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl md:text-2xl font-bold tracking-tight hover:text-accent transition">
              Vitolux
            </Link>
            <div className="md:hidden">
              <LanguageSwitcher />
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <nav className="flex flex-wrap gap-2 md:gap-4">
              {navItems.map(({ href, key }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded transition text-sm md:text-base ${pathname === href ? "bg-accent text-white" : "hover:bg-primary-light/50"}`}
                >
                  {t.nav[key]}
                </Link>
              ))}
            </nav>
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/20 flex flex-wrap gap-4 text-sm text-white/90">
          <a href={`tel:${t.header.phone}`} className="hover:text-accent transition">
            {t.header.phone}
          </a>
          <a href={`mailto:${t.header.email}`} className="hover:text-accent transition">
            {t.header.email}
          </a>
          <span>{t.header.workingHours}</span>
        </div>
      </div>
    </header>
  );
}
