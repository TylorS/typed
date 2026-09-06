import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences, validateAuthoredExampleQuality } from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guideFile = "wire-and-rendered-dom-output.md";
const guidePath = path.join(websiteRoot, "content/guides", guideFile);

const readGuide = () => {
  expect(fs.existsSync(guidePath)).toBe(true);
  return parseGuideDocumentation(guideFile, fs.readFileSync(guidePath, "utf8"));
};

describe("Wire and Rendered DOM output guide", () => {
  it("separates the stable application boundary from advanced published renderer helpers", () => {
    const guide = readGuide();

    expect(guide).toMatchObject({
      slug: "wire-and-rendered-dom-output",
      section: "Template internals",
      kind: "deep-dive",
    });
    const examples = extractTypeScriptFences(guide.body).join("\n");
    for (const term of ["DomRenderEvent", "persistent", "fromComments", "createDocumentFragment"]) {
      expect(examples).toContain(term);
    }
    for (const operation of ["getElements", "toHtml", "valueOf()", "internal-but-published"]) {
      expect(guide.body).toContain(operation);
    }
    expect(guide.body).toContain("/explore/dom-updates-and-reconciliation");
    expect(extractTypeScriptFences(guide.body)).not.toHaveLength(0);
    expect(validateAuthoredExampleQuality([guide])).toEqual([]);
  });

  it("keeps every public-contract example independently compilable", () => {
    const guide = readGuide();
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".wire-rendered-guide-check-"));

    try {
      const examples = extractTypeScriptFences(guide.body).map((code, index) => {
        const file = path.join(staging, `example-${index}.ts`);
        fs.writeFileSync(file, code);
        return file;
      });
      const program = ts.createProgram(examples, {
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
});
