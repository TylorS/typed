import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";
import { observeTheme } from "./theme.js";

observeTheme((theme) => {
  const dark = theme === "matrix";
  addons.setConfig({
    theme: create({
      base: dark ? "dark" : "light",
      brandTitle: "Typed UI",
      fontBase: "Inter, ui-sans-serif, system-ui, sans-serif",
      colorPrimary: dark ? "#4ee58b" : "#007a47",
      colorSecondary: dark ? "#4ee58b" : "#007a47",
      appBg: dark ? "#030806" : "#f5faf6",
      appContentBg: dark ? "#08110d" : "#e9f3ec",
      appPreviewBg: dark ? "#08110d" : "#e9f3ec",
      appBorderColor: dark ? "#183226" : "#d5e5da",
      textColor: dark ? "#f3f8f5" : "#102118",
      barBg: dark ? "#08110d" : "#e9f3ec",
      barTextColor: dark ? "#9fb4a6" : "#526d5d",
      barSelectedColor: dark ? "#4ee58b" : "#007a47",
      inputBg: dark ? "#030806" : "#f5faf6",
      inputBorder: dark ? "#183226" : "#d5e5da",
      inputTextColor: dark ? "#f3f8f5" : "#102118",
    }),
  });
});
