import type { Preview } from "@storybook/html-vite";
import "./preview.css";
import { observeTheme } from "./theme.js";

const stop = observeTheme(() => {});
if (import.meta.hot) import.meta.hot.dispose(stop);

const preview = {
  parameters: {
    a11y: {
      options: {
        runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
      },
      test: "error",
    },
    layout: "fullscreen",
  },
} satisfies Preview;

export default preview;
