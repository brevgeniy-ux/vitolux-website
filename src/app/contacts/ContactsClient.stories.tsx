import type { Meta, StoryObj } from "@storybook/react";
import { ContactsClient } from "./ContactsClient";

const meta: Meta<typeof ContactsClient> = {
  title: "Pages/Contacts",
  component: ContactsClient,
  parameters: {
    layout: "padded",
  },
};

export default meta;

type Story = StoryObj<typeof ContactsClient>;

export const Default: Story = {};
