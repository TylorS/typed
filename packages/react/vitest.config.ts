import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/__tests__/**/*.{test,spec}.ts"],
    exclude: [
      "**/*.browser.test.ts",
      "**/node_modules/**",
      "**/dist/**",
      "**/generated/**",
      "**/fixtures/packed/**",
    ],
  },
});
