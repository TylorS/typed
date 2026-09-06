import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guidePath = path.join(websiteRoot, "content/guides/dom-updates-and-reconciliation.md");

describe("template cost guide", () => {
  it("classifies lifecycle and reconciliation costs by template part family", () => {
    const guide = fs.readFileSync(guidePath, "utf8");

    // Assert cost dimensions and integration boundaries, not prose headings or table layout.
    for (const dimension of [
      "Template mount", "Captured text", "Class contribution", "Dataset contribution",
      "Spread installation/replacement", "Retained reactive spread entry", "Event setup",
      "Dynamic node range", "Keyed collection emission", "Hydration", "O(`a + b`)",
      "moveBefore", "insertBefore",
    ]) {
      expect(guide).toContain(dimension);
    }
    expect(guide).toContain("/explore/keyed-template-collections");
    expect(guide).toContain("/explore/render-scheduling");
    expect(guide).toContain("/explore/dom-parts-and-attributes");
  });
});
