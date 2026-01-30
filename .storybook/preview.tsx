import type { Preview } from "@storybook/react";
import "../src/app/globals.css";
import { LanguageProvider } from "../src/context/LanguageContext";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <LanguageProvider>
        <div className="min-h-screen bg-white">
          <Story />
        </div>
      </LanguageProvider>
    ),
  ],
};

export default preview;
