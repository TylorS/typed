import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences } from "../Recipes.js";
import { expectExampleCalls, runGuideExample } from "./FxGuideTestSupport.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guidePath = path.join(websiteRoot, "content/guides/transforming-fx.md");

describe("Transforming Fx guide", () => {
  const source = fs.readFileSync(guidePath, "utf8");
  const guide = parseGuideDocumentation("transforming-fx.md", source);

  it("teaches pure and Effectful transformation with executable service requirements", () => {
    expect(guide).toMatchObject({
      slug: "transforming-fx",
      section: "Fx",
      kind: "guide",
      order: 1.2,
    });
    expect(source).toContain("Fx.filterMap");
    expect(source).toContain("Fx.mapEffect");
    expect(source).toContain("Data.TaggedError");
    expect(source).toContain("Context.Service");
    expect(source).toContain("Fx.provideService");
    expect(source).toContain("Fx.skipRepeats");
    expect(source).toContain("Fx.debounce");
    expect(source).not.toContain("declare ");
    expectExampleCalls(source, [
      "Fx.filterMap",
      "Fx.map",
      "Fx.mapEffect",
      "Fx.provideService",
      "Fx.debounce",
    ]);
  });

  it("keeps every example independently compilable", () => {
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".transforming-fx-check-"));

    try {
      const files = extractTypeScriptFences(guide.body).map((code, index) => {
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
  it("filters and formats the authored product records", async () => {
    const source = fs.readFileSync(guidePath, "utf8");
    const result = await runGuideExample(websiteRoot, source, "interface Product", "result");
    expect(result).toEqual([{ id: "desk", title: "Standing desk", price: "$499.00" }]);
  });
});
