import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences, validateAuthoredExampleQuality } from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guideFile = "template-spreads-data.md";
const guidePath = path.join(websiteRoot, "content/guides", guideFile);
const templateSource = path.join(websiteRoot, "../../packages/template/src");

describe("Template spread and data guide", () => {
  it("documents capability replacement and keeps every example compilable", () => {
    const source = fs.readFileSync(guidePath, "utf8");
    const guide = parseGuideDocumentation(guideFile, source);

    expect(guide).toMatchObject({
      slug: "template-spreads-data",
      section: "Template bindings",
      kind: "guide",
    });
    for (const term of ["?disabled", ".data", "onclick", "ref", "replacement", "serialization"]) {
      expect(source).toContain(term);
    }
    expect(guide.body).toContain("/explore/template-element-bindings");
    expect(guide.body).toContain("/explore/template-references-and-element-access");

    const examples = extractTypeScriptFences(source);
    expect(examples).not.toHaveLength(0);
    expect(validateAuthoredExampleQuality([guide])).toEqual([]);

    const staging = fs.mkdtempSync(path.join(websiteRoot, ".template-spreads-data-check-"));
    try {
      const files = examples.map((code, index) => {
        const file = path.join(staging, `example-${index}.ts`);
        fs.writeFileSync(file, code);
        return file;
      });
      const program = ts.createProgram(files, {
        esModuleInterop: true,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        target: ts.ScriptTarget.ES2022,
      });
      const diagnostics = ts.getPreEmitDiagnostics(program);

      expect(
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
          getCanonicalFileName: (fileName) => fileName,
          getCurrentDirectory: () => websiteRoot,
          getNewLine: () => "\n",
        }),
      ).toBe("");
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  });

  it("keeps the exhaustive spread security and serialization contract with the renderer", () => {
    const domRenderer = fs.readFileSync(path.join(templateSource, "Render.ts"), "utf8");
    const htmlRenderer = fs.readFileSync(path.join(templateSource, "HtmlChunk.ts"), "utf8");

    for (const property of ["checked", "indeterminate", "selected", "selectedIndex", "value"]) {
      expect(domRenderer).toContain(`"${property}"`);
    }
    for (const key of ["__proto__", "prototype", "constructor"]) {
      expect(domRenderer).toContain(`"${key}"`);
      expect(htmlRenderer).toContain(`"${key}"`);
    }
    expect(htmlRenderer).toContain("isSerializableSpreadKey");
    expect(htmlRenderer).toContain("DOM properties, event handlers, refs, `on*` attributes");
  });
});
