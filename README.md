# Vitolux Website

Multi-page website for **Vitolux** (generators, welding equipment, heat pumps, stabilizers, compressors, and related equipment). Built with **Next.js**, **TypeScript**, **React**, and **Tailwind CSS**.

## Features

- **Multi-language**: Ukrainian (UK) and English (EN) with language switcher in the header
- **Dual currency**: All prices in **UAH** and **EUR** with clear formatting
- **Pages**: Home, Products catalog, Product detail, Promos, About, Contacts, Terms & Conditions
- **Preview**: `/preview` – single page with key blocks (header, categories, product cards, promos, footer)
- **Admin panel**: `/admin` – manage products (create, edit, delete) with in-memory state; structure ready for auth/API
- **Storybook**: Component and page stories for visual preview

## Tech stack

- **Next.js** (App Router), **TypeScript**, **React**, **Tailwind CSS**
- Data in `src/data/` (categories, products as TypeScript modules)
- i18n via React context + `src/locales/uk` and `src/locales/en`

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run storybook` | Start Storybook (preview components) |
| `npm run build-storybook` | Build static Storybook |

## Routes

| Path | Description |
|-----|-------------|
| `/` | Home – hero, categories, promotions |
| `/products` | Product catalog with search and category filter |
| `/products/[slug]` | Product detail + inquiry form |
| `/promos` | Promo products |
| `/about` | About company |
| `/contacts` | Contact form, address, map |
| `/terms` | Terms & Conditions |
| `/preview` | All key blocks on one page |
| `/admin` | Admin panel – product CRUD (in-memory) |

## Project structure

```
src/
  app/           # Next.js App Router pages and layouts
  components/    # Header, Footer, ProductCard, ProductGrid, CategoryMenu, LanguageSwitcher, Layout
  context/      # LanguageContext (locale + translations)
  data/          # categories, products, types
  locales/       # uk/common.ts, en/common.ts
  lib/           # formatPrice
.storybook/      # Storybook config and preview (with LanguageProvider)
```

## Localization

- Locale is stored in `localStorage` (`vitolux-locale`) and used via `LanguageContext`.
- Translations: `src/locales/uk/common.ts` and `src/locales/en/common.ts`.
- Categories and products have `name_uk`, `name_en`, `description_uk`, `description_en`.

## Admin panel

- **URL**: `/admin`
- **Language**: English
- **Actions**: Search/filter products, Create, Edit, Delete
- **Fields**: name (UK/EN), description (UK/EN), category, price UAH/EUR, article, promo flag
- **Persistence**: In-memory (resets on refresh). Replace with API calls when backend is ready.

## License

Private / Vitolux.
