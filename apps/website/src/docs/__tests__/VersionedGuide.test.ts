import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ts from "typescript-compiler";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFenceDocuments } from "../RecipeValidation.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guideFile = "versioned-state.md";

describe("Versioned guide", () => {
  it("documents the public Versioned contract with compilable companion modules", () => {
    const guide = parseGuideDocumentation(
      guideFile,
      fs.readFileSync(path.join(websiteRoot, "content/guides", guideFile), "utf8"),
    );

    expect(guide).toMatchObject({
      slug: "versioned-state",
      section: "State",
      kind: "guide",
    });
    const documents = extractTypeScriptFenceDocuments(guide.body);
    expect(documents.map(({ fileName }) => fileName)).toEqual(["Settings.ts", "Settings.test.ts"]);
    expect(documents[0].code).toContain("Versioned.make");
    expect(documents[0].code).toContain("Fx.callback");
    expect(documents[0].code).toContain("listeners.delete(publish)");
    expect(documents[1].code).toContain("store.state.version");
    expect(documents[1].code).toContain("Fx.first(store.state)");

    const staging = fs.mkdtempSync(path.join(websiteRoot, ".versioned-guide-check-"));
    try {
      const examples = extractTypeScriptFenceDocuments(guide.body).map(({ code, fileName, extension }, index) => {
        const file = path.join(staging, guide.slug, fileName ?? `example-${index}.${extension}`);
        fs.mkdirSync(path.dirname(file), { recursive: true });
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
