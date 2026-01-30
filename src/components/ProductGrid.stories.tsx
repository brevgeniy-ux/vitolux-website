import type { Meta, StoryObj } from "@storybook/react";
import { ProductGrid } from "./ProductGrid";
import { products } from "@/data/products";

const meta: Meta<typeof ProductGrid> = {
  title: "Catalog/ProductGrid",
  component: ProductGrid,
  parameters: {
    layout: "padded",
  },
};

export default meta;

type Story = StoryObj<typeof ProductGrid>;

export const WithProducts: Story = {
  args: {
    products: products.slice(0, 6),
  },
};

export const Empty: Story = {
  args: {
    products: [],
  },
};
