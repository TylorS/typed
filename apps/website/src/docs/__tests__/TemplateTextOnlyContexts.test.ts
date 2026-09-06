import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { parseGuideDocumentation } from "../Frontmatter.js";
import {
  extractTypeScriptFenceDocuments,
  validateAuthoredExampleQuality,
} from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const repositoryRoot = path.join(websiteRoot, "../..");
const guideFile = "template-text-only-contexts.md";
const guidePath = path.join(websiteRoot, "content/guides", guideFile);

const readGuide = () =>
  parseGuideDocumentation(guideFile, fs.readFileSync(guidePath, "utf8"));

describe("Template text-only contexts guide", () => {
  it("documents the supported contexts and their real trust boundaries", () => {
    const guide = readGuide();
    const parser = fs.readFileSync(
      path.join(repositoryRoot, "packages/template/src/Parser.ts"),
      "utf8",
    );
    const htmlChunk = fs.readFileSync(
      path.join(repositoryRoot, "packages/template/src/HtmlChunk.ts"),
      "utf8",
    );

    expect(guide).toMatchObject({
      slug: "template-text-only-contexts",
      section: "Template bindings",
      kind: "deep-dive",
    });
    for (const term of [
      "textarea",
      "title",
      "script",
      "style",
      "xmp",
      "plaintext",
      "HtmlRenderEvent",
      "\\\\u003c",
      "\\\\3C",
      "&lt;",
      "does not sanitize",
      "hydration",
    ]) {
      expect(guide.body).toContain(term);
    }

    expect(parser).toContain(
      'new Set(["textarea", "script", "style", "title", "plaintext", "xmp"])',
    );
    for (const term of [
      'case "textarea":',
      'case "title":',
      'case "script":',
      'case "style":',
      'case "xmp":',
      String.raw`neutralizeClosingTag(tagName, renderToString(value, ""), "\\u003c")`,
      String.raw`neutralizeClosingTag(tagName, renderToString(value, ""), "\\3C ")`,
      String.raw`neutralizeClosingTag(tagName, renderToString(value, ""), "&lt;")`,
    ]) {
      expect(htmlChunk).toContain(term);
    }

    const fences = extractTypeScriptFenceDocuments(guide.body);
    expect(fences.some(({ code }) => code.includes("JSON.stringify"))).toBe(true);
    expect(fences.some(({ code }) => code.includes("<textarea"))).toBe(true);
    expect(fences.some(({ code }) => code.includes("<style>"))).toBe(true);
    expect(validateAuthoredExampleQuality([guide])).toEqual([]);
  });

  it("keeps every text-only example independently compilable", () => {
    const guide = readGuide();
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".template-text-only-check-"));

    try {
      const examples = extractTypeScriptFenceDocuments(guide.body).map(
        ({ code, extension }, index) => {
          const file = path.join(staging, `example-${index}.${extension}`);
          fs.writeFileSync(file, code);
          return file;
        },
      );
      const program = ts.createProgram(examples, {
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
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
