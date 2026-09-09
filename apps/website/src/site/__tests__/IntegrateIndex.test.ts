import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const source = readFileSync(new URL("../pages/integrate/index.astro", import.meta.url), "utf8");

it("keeps integration sections aligned and places streaming SSR after the core recipes", () => {
  expect(source).toContain('<section class="integration-section">');
  expect(source.indexOf("families.map")).toBeLessThan(source.indexOf("STREAMING SSR"));
});
