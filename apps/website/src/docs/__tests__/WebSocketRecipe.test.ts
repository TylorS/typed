import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { expect, it } from "vitest";
import { extractTypeScriptFenceDocuments } from "../RecipeValidation.js";

it("type-checks the WebSocket recipe as named modules", () => {
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const markdown = readFileSync(path.join(root, "content/recipes/websocket.md"), "utf8");
  const examples = extractTypeScriptFenceDocuments(markdown);
  const staging = mkdtempSync(path.join(root, ".websocket-recipe-"));
  try {
    const files = examples.map(({ fileName, code }) => {
      if (!fileName) throw new Error("WebSocket examples must name their modules");
      const file = path.join(staging, fileName);
      writeFileSync(file, code);
      return file;
    });
    expect(files).toHaveLength(3);
    const program = ts.createProgram(files, {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      target: ts.ScriptTarget.ES2022,
      strict: true,
      noEmit: true,
      skipLibCheck: true,
    });
    expect(
      ts.getPreEmitDiagnostics(program).map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      ),
    ).toEqual([]);
  } finally {
    rmSync(staging, { force: true, recursive: true });
  }
});
