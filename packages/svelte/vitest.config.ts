import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";
import { bridgeSource } from "./test.config.js";

export default defineConfig({
  plugins: [bridgeSource(), svelte()],
  test: {
    include: ["src/**/__tests__/**/*.{test,spec}.ts"],
    exclude: ["**/*.browser.test.ts", "**/node_modules/**", "**/dist/**"],
  },
});
