import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ts from "typescript-compiler";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFenceDocuments } from "../RecipeValidation.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guideFile = "server-rendering-and-hydration.md";
const guidePath = path.join(websiteRoot, "content/guides", guideFile);

describe("Template SSR handoff guide", () => {
  it("keeps SavedCount and its server/browser entries as one compilable module set", () => {
    const guide = parseGuideDocumentation(guideFile, fs.readFileSync(guidePath, "utf8"));
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".template-ssr-check-"));

    try {
      const files = extractTypeScriptFenceDocuments(guide.body).map(({ code, extension, fileName }, index) => {
        const name = fileName ?? `example-${index}.${extension}`;
        const file = path.join(staging, name);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, code);
        return file;
      });
      expect(files.map((file) => path.basename(file)).sort()).toEqual([
        "SavedCount.ts", "client.ts", "server.ts",
      ]);

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
      expect(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => websiteRoot,
        getNewLine: () => "\n",
      })).toBe("");
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  });
});
