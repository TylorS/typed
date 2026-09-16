import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { test } from "node:test";

const workflow = path.resolve(import.meta.dirname, "../../../.github/workflows/deploy-pages.yml");

test("Pages validates the generated artifact without a browser-install step", async () => {
  const source = await fs.readFile(workflow, "utf8");
  const validation = source.indexOf("pnpm --filter typed-website test:static:integrity");
  const upload = source.indexOf("actions/upload-pages-artifact@v5");

  assert.ok(validation >= 0, "the deployment validates the built artifact");
  assert.ok(upload > validation, "the artifact is uploaded only after its integrity checks pass");
  assert.equal(source.includes("playwright install --with-deps chromium"), false);
});
