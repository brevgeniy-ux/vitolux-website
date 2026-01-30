import type { Meta, StoryObj } from "@storybook/react";
import { HomeClient } from "./HomeClient";

const meta: Meta<typeof HomeClient> = {
  title: "Pages/Home",
  component: HomeClient,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof HomeClient>;

export const Default: Story = {};
