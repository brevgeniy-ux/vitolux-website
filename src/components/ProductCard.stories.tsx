import type { Meta, StoryObj } from "@storybook/react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/data/types";

const sampleProduct: Product = {
  id: "1",
  slug: "vitolux-dg-5kva",
  categoryId: "diesel-generators",
  name_uk: "Дизельний генератор Vitolux 5 kVA",
  name_en: "Vitolux diesel generator 5 kVA",
  description_uk: "Безшумний дизельний генератор для зовнішнього монтажу.",
  description_en: "Silent diesel generator for outdoor installation.",
  priceUAH: 125000,
  priceEUR: 2900,
  article: "VL-DG-5K",
  isPromo: false,
};

const promoProduct: Product = {
  ...sampleProduct,
  isPromo: true,
  oldPriceUAH: 142000,
  oldPriceEUR: 3300,
};

const meta: Meta<typeof ProductCard> = {
  title: "Catalog/ProductCard",
  component: ProductCard,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof ProductCard>;

export const Default: Story = {
  args: {
    product: sampleProduct,
  },
};

export const Promo: Story = {
  args: {
    product: promoProduct,
  },
};
