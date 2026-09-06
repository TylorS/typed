import type { StorybookConfig } from "@storybook/html-vite";
import tailwindcss from "@tailwindcss/vite";

const config = {
  stories: ["../stories/**/*.stories.ts"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: "@storybook/html-vite",
  async viteFinal(vite) {
    vite.plugins = [...(vite.plugins ?? []), tailwindcss()];
    return vite;
  },
} satisfies StorybookConfig;

export default config;
