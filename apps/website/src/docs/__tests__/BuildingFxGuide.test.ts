import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ts from "typescript-compiler";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences } from "../Recipes.js";
import { expectExampleCalls, runGuideExample } from "./FxGuideTestSupport.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guidePath = path.join(websiteRoot, "content/guides/building-fx.md");

describe("Building Fx values guide", () => {
  it("teaches the public construction surface and its ownership boundaries", () => {
    const guide = parseGuideDocumentation("building-fx.md", fs.readFileSync(guidePath, "utf8"));

    expect(guide).toMatchObject({
      slug: "building-fx",
      section: "Fx",
      kind: "guide",
      order: 1.1,
    });
    expect(guide.body).toContain("Fx.fromEffect");
    expect(guide.body).toContain("Fx.fromIterable");
    expect(guide.body).toContain("Fx.sync");
    expect(guide.body).toContain("Fx.fromStream");
    expect(guide.body).toContain("Fx.fromSchedule");
    expect(guide.body).toContain("Fx.callback");
    expect(guide.body).toContain("Fx.genScoped");
    expect(guide.body).toContain("HttpClientError.HttpClientError");
    expect(guide.body).toContain("Context.Service");
    expectExampleCalls(guide.body, [
      "Fx.fromEffect",
      "Fx.fromIterable",
      "Fx.sync",
      "Fx.fromStream",
      "Fx.fromSchedule",
      "Fx.callback",
      "Fx.genScoped",
      "Effect.acquireRelease",
      "HttpClient.get",
      "Effect.provide",
    ]);
  });

  it("keeps every TypeScript example independently compilable", () => {
    const guide = parseGuideDocumentation("building-fx.md", fs.readFileSync(guidePath, "utf8"));
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".building-fx-check-"));

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
  it("runs the authored finite iterable to completion", async () => {
    const source = fs.readFileSync(guidePath, "utf8");
    const result = await runGuideExample(websiteRoot, source, "const ids =", "result");
    expect(result).toEqual(["ada", "grace", "barbara"]);
  });
});
