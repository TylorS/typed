import { join, dirname } from "path";

/** @type { import('@typed/storybook').StorybookConfig } */
const config = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: dirname(require.resolve("@typed/storybook/package.json")),
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
};
export default config;
