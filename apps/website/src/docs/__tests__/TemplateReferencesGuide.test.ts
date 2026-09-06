import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences } from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guideFile = "template-references-and-element-access.md";

describe("Template references guide", () => {
  it("documents native element access, cleanup, and hydration without inventing a component ref API", () => {
    const guide = parseGuideDocumentation(
      guideFile,
      fs.readFileSync(path.join(websiteRoot, "content/guides", guideFile), "utf8"),
    );

    expect(guide).toMatchObject({
      slug: "template-references-and-element-access",
      section: "Template bindings",
      kind: "guide",
    });
    const examples = extractTypeScriptFences(guide.body).join("\n");
    for (const term of ["Fx.callback", "RefSubject.set", "observer.disconnect()", "RefSubject.hydrate", "RefSubject.hydrateAll", "ref=${"]) {
      expect(examples).toContain(term);
    }
    expect(guide.body).toContain("/explore/hydrating-typed-html");
    expect(guide.body).toContain("/explore/template-spreads-data");
    expect(extractTypeScriptFences(guide.body)).not.toHaveLength(0);
  });

  it("keeps every TypeScript example independently compilable", () => {
    const guide = parseGuideDocumentation(
      guideFile,
      fs.readFileSync(path.join(websiteRoot, "content/guides", guideFile), "utf8"),
    );
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".template-refs-guide-check-"));

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
