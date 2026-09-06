import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { validateMarkdownFences } from "../RenderMarkdown.js";

describe("UI source documentation examples", () => {
  it.each([
    ["Checkbox", "toggle"],
    ["Switch", "setChecked"],
    ["Switch", "toggle"],
    ["Form", "formDataToRecord"],
  ])("retains a complete example and prose summary for %s.%s", (module, name) => {
    const file = fileURLToPath(new URL(`../../../../../packages/ui/src/${module}.ts`, import.meta.url));
    const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    const declaration = source.statements.find((node): node is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(node) && node.name?.text === name,
    );
    expect(declaration).toBeDefined();
    const docs = ts.getJSDocCommentsAndTags(declaration!).filter(ts.isJSDoc);
    const summary = docs.map((doc) => ts.getTextOfJSDocComment(doc.comment) ?? "").join("\n");
    const examples = ts.getJSDocTags(declaration!)
      .filter((tag) => tag.tagName.text === "example")
      .map((tag) => ts.getTextOfJSDocComment(tag.comment) ?? "");

    expect(summary).not.toMatch(/```|const program|const data/u);
    expect(examples).toHaveLength(1);
    expect(examples[0]).toContain(`@typed/ui/${module}`);
    expect(examples[0]).toMatch(/^```ts\n/u);
    expect(validateMarkdownFences(examples[0]!)).toEqual([]);
  });
});
