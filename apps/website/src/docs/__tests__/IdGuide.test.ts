import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ts from "typescript-compiler";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences } from "../Recipes.js";
import { buildSearchIndex, searchDocumentation } from "../Search.js";
import type { DocumentationModel } from "../Model.js";
import { runGuideExample } from "./FxGuideTestSupport.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guidePath = path.join(websiteRoot, "content/guides/id.md");

describe("@typed/id guide", () => {
  const source = fs.readFileSync(guidePath, "utf8");
  const guide = parseGuideDocumentation("id.md", source);

  it("introduces installation, shared generation, validation, and deterministic testing", () => {
    expect(guide).toMatchObject({
      slug: "id",
      title: "@typed/id: generate and validate identifiers",
      section: "State",
      kind: "guide",
      order: 2.5,
    });
    for (const term of [
      "pnpm add @typed/id effect",
      "Effect.fn",
      "Ids.Default",
      "Uuid7State.Default",
      "Schema.decodeUnknownEffect",
      "IdsTest",
      "currentTime",
    ]) {
      expect(source).toContain(term);
    }
  });

  it("keeps every example independently compilable", () => {
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".id-guide-check-"));
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
      expect(ts.formatDiagnosticsWithColorAndContext(ts.getPreEmitDiagnostics(program), {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => websiteRoot,
        getNewLine: () => "\n",
      })).toBe("");
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  });

  it("repeats a deterministic IdsTest vector while advancing within one layer", async () => {
    const { first, repeated } = await runGuideExample<{
      readonly first: readonly [string, string];
      readonly repeated: readonly [string, string];
    }>(websiteRoot, source, "const pair", "({ first, repeated })");
    expect(first[0]).not.toBe(first[1]);
    expect(first[0]).toBe(repeated[0]);
  });

  it("is discoverable by its package name", () => {
    const index = buildSearchIndex({
      schemaVersion: 1,
      repositoryRevision: "test",
      packages: [],
      guides: [guide],
      glossary: [],
      symbols: [],
    } as DocumentationModel);
    expect(searchDocumentation(index, "@typed/id")[0]).toMatchObject({
      id: "guide:id",
      href: "/explore/id",
    });
  });
});
