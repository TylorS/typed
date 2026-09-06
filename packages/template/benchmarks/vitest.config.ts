import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: [
      "default",
      {
        onTestCaseAnnotate(_test, annotation) {
          console.log(annotation.message);
        },
      },
    ],
    include: ["benchmarks/*.bench.ts"],
    testTimeout: 120_000,
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
      headless: true,
    },
  },
});
