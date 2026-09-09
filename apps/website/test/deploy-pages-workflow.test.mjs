import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { test } from "node:test";

const workflow = path.resolve(import.meta.dirname, "../../../.github/workflows/deploy-pages.yml");

test("Pages installs Playwright Chromium without the runner's Google Chrome repository", async () => {
  const source = await fs.readFile(workflow, "utf8");
  const cleanup = source.indexOf("sudo rm -f /etc/apt/sources.list.d/google-chrome.list");
  const install = source.indexOf("playwright install --with-deps chromium");

  assert.ok(cleanup >= 0, "the workflow must remove the Google Chrome apt source");
  assert.ok(cleanup < install, "the source must be removed before Playwright installs dependencies");
});
