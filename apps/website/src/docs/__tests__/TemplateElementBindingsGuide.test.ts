import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences, validateAuthoredExampleQuality } from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fileName = "template-element-bindings.md";
const guidePath = path.join(websiteRoot, "content/guides", fileName);

describe("Template element bindings guide", () => {
  it("documents exact attribute, property, and boolean contracts", () => {
    const source = fs.readFileSync(guidePath, "utf8");
    const guide = parseGuideDocumentation(fileName, source);

    expect(guide).toMatchObject({
      section: "Template bindings",
      kind: "deep-dive",
    });
    const examples = extractTypeScriptFences(guide.body).join("\n");
    for (const syntax of ["title=${description}", ".value=${query}", "oninput=${readQuery}", "?disabled=${readOnly}"]) {
      expect(examples).toContain(syntax);
    }
    expect(guide.body).toContain("/explore/dom-parts-and-attributes");
    expect(guide.body).toContain("/explore/template-spreads-data");
    expect(extractTypeScriptFences(guide.body)).not.toHaveLength(0);
    expect(validateAuthoredExampleQuality([guide])).toEqual([]);
  });
});
