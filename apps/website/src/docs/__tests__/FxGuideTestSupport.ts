import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript-compiler";
import { expect } from "vitest";
import { extractTypeScriptFences } from "../Recipes.js";

export const expectExampleCalls = (source: string, expected: ReadonlyArray<string>) => {
  const calls = new Set<string>();
  const examples = extractTypeScriptFences(source);
  expect(examples.length).toBeGreaterThan(0);
  for (const example of examples) {
    const file = ts.createSourceFile("guide.ts", example, ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) calls.add(node.expression.getText(file));
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  for (const name of expected) expect(calls.has(name), `authored example calls ${name}`).toBe(true);
};

export const runGuideExample = async <A>(
  websiteRoot: string,
  source: string,
  marker: string,
  resultExpression: string,
): Promise<A> => {
  const matches = extractTypeScriptFences(source).filter((code) => code.includes(marker));
  expect(matches, `one executable example containing ${marker}`).toHaveLength(1);
  const directory = fs.mkdtempSync(path.join(websiteRoot, ".fx-guide-runtime-"));
  try {
    const filename = path.join(directory, "example.mjs");
    const { outputText, diagnostics } = ts.transpileModule(
      `${matches[0]}\nexport const __guideTestResult = await (${resultExpression});\n`,
      {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        reportDiagnostics: true,
      },
    );
    expect(diagnostics ?? []).toEqual([]);
    fs.writeFileSync(filename, outputText);
    const loaded = await import(/* @vite-ignore */ pathToFileURL(filename).href);
    return loaded.__guideTestResult as A;
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
};
