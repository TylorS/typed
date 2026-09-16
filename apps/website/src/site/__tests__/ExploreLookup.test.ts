import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const source = readFileSync(new URL("../pages/explore/index.astro", import.meta.url), "utf8");

it("links the Explore lookup to the package reference rather than a single package", () => {
  expect(source.match(/"\/reference"/g)).toHaveLength(1);
  expect(source).toContain('"/reference"');
  expect(source).not.toContain('"@typed/id"');
});
