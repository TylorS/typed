import { defineConfig } from "astro/config";
import typed from "@typed/astro";
import tailwind from "@tailwindcss/vite";
import { markdown } from "./src/site/Markdown.js";

export default defineConfig({
  site: "https://tylors.github.io",
  base: process.env.SITE_BASE ?? "/typed/",
  srcDir: "./src/site",
  outDir: "./dist/site",
  trailingSlash: "always",
  integrations: [typed()],
  markdown,
  vite: { plugins: [tailwind()] },
});
