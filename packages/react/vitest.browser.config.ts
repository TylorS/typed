import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react-dom/server",
      "@typed/router/RouterTest",
      "effect/Random",
      "effect/SchemaIssue",
      "effect/SchemaParser",
      "effect/SchemaTransformation",
      "effect/testing/TestClock",
    ],
  },
  test: {
    include: ["src/**/__tests__/**/*.browser.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
      headless: true,
      commands: {
        async renderReactProviderFixture() {
          const fixture = await import(
            new URL("./src/__tests__/fixtures/server.ts", import.meta.url).href
          );
          return fixture.renderProviderFixture();
        },
      },
    },
  },
});
