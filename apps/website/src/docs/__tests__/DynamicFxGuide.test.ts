import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ts from "typescript-compiler";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences } from "../Recipes.js";
import { expectExampleCalls, runGuideExample } from "./FxGuideTestSupport.js";
import { renderMarkdown } from "../../site/Markdown.js";
import { extractFxMarbleOperators } from "../FxMarbleCoverage.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guideFile = "fx-dynamic-producers.md";
const guidePath = path.join(websiteRoot, "content/guides", guideFile);

describe("dynamic Fx producers guide", () => {
  it("places producer selection before scoped acquisition", async () => {
    const source = fs.readFileSync(guidePath, "utf8");
    const guide = parseGuideDocumentation(guideFile, source);
    const rendered = (await renderMarkdown(guide.body)).code;

    expect(guide).toMatchObject({
      slug: "fx-dynamic-producers",
      section: "Fx",
      kind: "guide",
      order: 1.15,
    });
    for (const operator of ["gen", "unwrap", "unwrapScoped"]) {
      expect(rendered).toContain(`<code>${operator}</code>`);
    }
    expectExampleCalls(source, [
      "Fx.unwrap",
      "Fx.fn",
      "Fx.unwrapScoped",
      "Effect.acquireRelease",
    ]);
    expect(extractFxMarbleOperators(source)).toEqual(
      expect.arrayContaining(["gen", "unwrap", "unwrapScoped"]),
    );
  });

  it("runs the authored Fx.fn factory after resolving its mode", async () => {
    const source = fs.readFileSync(guidePath, "utf8");
    const result = await runGuideExample(websiteRoot, source, "const activityFor =", "result");
    expect(result).toEqual(["opened", "updated"]);
  });

  it("returns the first selected value from scoped setup", async () => {
    const source = fs.readFileSync(guidePath, "utf8");
    const result = await runGuideExample(websiteRoot, source, "const acquireActivity =", "result");
    expect(result).toMatchObject({ _tag: "Some", value: "opened" });
  });

  it("keeps every TypeScript example independently compilable", () => {
    const source = fs.readFileSync(guidePath, "utf8");
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".dynamic-fx-guide-check-"));

    try {
      const files = extractTypeScriptFences(source).map((code, index) => {
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
  it("runs the selected producer rather than emitting the Fx object", async () => {
    const source = fs.readFileSync(guidePath, "utf8");
    const result = await runGuideExample(websiteRoot, source, "const chooseActivity =", "result");
    expect(result).toEqual(["workspace:opened", "workspace:updated"]);
  });
});
