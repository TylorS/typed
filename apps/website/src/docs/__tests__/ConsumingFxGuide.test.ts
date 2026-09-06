import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ts from "typescript-compiler";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences } from "../Recipes.js";
import { expectExampleCalls, runGuideExample } from "./FxGuideTestSupport.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guidePath = path.join(websiteRoot, "content/guides/consuming-fx.md");

describe("Consuming Fx guide", () => {
  it("teaches runner choice through concrete scenarios", () => {
    const guide = parseGuideDocumentation("consuming-fx.md", fs.readFileSync(guidePath, "utf8"));

    expect(guide).toMatchObject({
      slug: "consuming-fx",
      section: "Fx",
      kind: "guide",
      order: 1.99,
    });
    expect(guide.body).toContain("Fx.observe");
    expect(guide.body).toContain("Fx.drain");
    expect(guide.body).toContain("Fx.first");
    expect(guide.body).toContain("Fx.collectAll");
    expect(guide.body).toContain("Fx.collectUpTo");
    expect(guide.body).toContain("Fx.toStream");
    expect(guide.body).toContain("Fx.runPromiseExit");
    expect(guide.body).not.toContain("Effect.forkScoped");
    expect(guide.body).not.toContain("Effect.never");
    expectExampleCalls(guide.body, [
      "Fx.observe",
      "Fx.drain",
      "Fx.first",
      "Fx.collectAll",
      "Fx.collectUpTo",
      "Fx.toStream",
      "Effect.runPromise",
      "Fx.runPromiseExit",
    ]);
  });

  it("keeps every TypeScript example independently compilable", () => {
    const guide = parseGuideDocumentation("consuming-fx.md", fs.readFileSync(guidePath, "utf8"));
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".consuming-fx-check-"));

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
  it("returns the first authored selection as the workflow result", async () => {
    const source = fs.readFileSync(guidePath, "utf8");
    const result = await runGuideExample(
      websiteRoot,
      source,
      "const selections =",
      "Effect.runPromise(selectedWorkspace)",
    );
    expect(result).toEqual("typed");
  });
});
