import type { Meta, StoryObj } from "@storybook/react";
import { CategoryMenu } from "./CategoryMenu";

const meta: Meta<typeof CategoryMenu> = {
  title: "Catalog/CategoryMenu",
  component: CategoryMenu,
  parameters: {
    layout: "padded",
  },
};

export default meta;

type Story = StoryObj<typeof CategoryMenu>;

export const AsLinks: Story = {
  args: {
    asLinks: true,
    activeCategoryId: null,
  },
};

export const WithActiveCategory: Story = {
  args: {
    asLinks: true,
    activeCategoryId: "heat-pumps",
  },
};

export const Compact: Story = {
  args: {
    asLinks: true,
    activeCategoryId: null,
    compact: true,
  },
};
