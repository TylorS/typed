import { playwright } from "@vitest/browser-playwright";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";
import { bridgeSource } from "./test.config.js";

export default defineConfig({
  plugins: [bridgeSource(), svelte()],
  optimizeDeps: { include: ["effect/testing/TestClock"] },
  test: {
    include: ["src/**/__tests__/**/*.browser.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
      headless: true,
      commands: {
        async renderSvelteFixture({ project }, scenario: string, label: string) {
          const fixture = await project.vite.ssrLoadModule("/src/__tests__/fixtures/server.ts");
          return fixture.renderFixture(scenario, label);
        },
      },
    },
  },
});
