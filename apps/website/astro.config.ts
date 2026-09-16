import { defineConfig } from "astro/config";
import typed from "@typed/astro";
import tailwind from "@tailwindcss/vite";
import { markdown } from "./src/site/Markdown.js";

const base = process.env.SITE_BASE ?? "/typed/";

export default defineConfig({
  site: "https://tylors.github.io",
  base,
  srcDir: "./src/site",
  outDir: "./dist/site",
  trailingSlash: "always",
  redirects: {
    "/explore/ui-http-router/": `${base.replace(/\/$/, "")}/explore/integrating-matcher-with-effect-http/`,
  },
  integrations: [typed()],
  markdown,
  vite: { plugins: [tailwind()] },
});
