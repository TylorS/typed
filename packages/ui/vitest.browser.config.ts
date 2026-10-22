import { playwright } from "@vitest/browser-playwright";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig } from "vitest/config";

// Firefox 157 still reads the installed browser's macOS-protected app data.
// https://github.com/microsoft/playwright/issues/42768 (fixed upstream in Firefox 158)
const firefoxAppData =
  process.platform === "darwin" ? mkdtempSync(join(tmpdir(), "typed-ui-firefox-")) : undefined;

if (firefoxAppData) {
  process.once("exit", () => rmSync(firefoxAppData, { recursive: true, force: true }));
}

export default defineConfig({
  test: {
    include: ["src/**/__tests__/**/*.browser.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        { browser: "chromium" },
        {
          browser: "firefox",
          setupFiles: [join(import.meta.dirname, "vitest.browser.setup.ts")],
          provider: playwright({
            launchOptions: firefoxAppData
              ? {
                  env: {
                    ...process.env,
                    MOZ_APP_DATA: firefoxAppData,
                    MOZ_LOCAL_APP_DATA: firefoxAppData,
                  },
                }
              : {},
          }),
        },
        { browser: "webkit" },
      ],
      headless: true,
    },
  },
});
