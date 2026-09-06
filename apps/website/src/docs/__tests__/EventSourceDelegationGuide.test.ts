import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences } from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guideFile = "event-source-delegation.md";

describe("EventSource delegation guide", () => {
  it("documents renderer-local delegation without repeating the application event guide", () => {
    const guide = parseGuideDocumentation(
      guideFile,
      fs.readFileSync(path.join(websiteRoot, "content/guides", guideFile), "utf8"),
    );

    expect(guide).toMatchObject({
      slug: "event-source-delegation",
      section: "Template internals",
      kind: "deep-dive",
    });
    const examples = extractTypeScriptFences(guide.body).join("\n");
    for (const term of ["makeEventSource", "addEventListener", "events.setup", "Scope.Scope", "currentTarget", "once", "capture", "passive", "signal"]) {
      expect(examples).toContain(term);
    }
    expect(guide.body).toContain("/explore/native-events-with-effect");
    expect(extractTypeScriptFences(guide.body)).not.toHaveLength(0);
  });

  it("keeps every TypeScript example independently compilable", () => {
    const guide = parseGuideDocumentation(
      guideFile,
      fs.readFileSync(path.join(websiteRoot, "content/guides", guideFile), "utf8"),
    );
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".event-source-guide-check-"));

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
