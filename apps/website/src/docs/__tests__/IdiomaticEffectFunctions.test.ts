import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import ts from "typescript";
import { extractTypeScriptFenceDocuments } from "../RecipeValidation.js";

const contentRoot = join(import.meta.dirname, "../../../content");

const markdownFiles = (directory: string): ReadonlyArray<string> =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? markdownFiles(path) : path.endsWith(".md") ? [path] : [];
  });

describe("authored Effect functions", () => {
  it("uses Effect.fn instead of arrow functions which return Effect.gen", () => {
    const offenders = markdownFiles(contentRoot).flatMap((path) => {
      const source = readFileSync(path, "utf8");
      const offenses: string[] = [];
      for (const [index, { code }] of extractTypeScriptFenceDocuments(source).entries()) {
        const file = ts.createSourceFile("example.ts", code, ts.ScriptTarget.Latest, true);
        const visit = (node: ts.Node) => {
          if (ts.isArrowFunction(node) && !ts.isBlock(node.body)) {
            const body = node.body.getText(file);
            // A test or browser entry ending in a runner returns a Promise, value, or Fiber,
            // not an Effect. Keep ordinary callbacks at those runtime boundaries.
            const runsEffect =
              /\.pipe\([\s\S]*Effect\.run(?:Promise(?:Exit)?|Sync(?:Exit)?|Fork)\s*,?\s*\)$/u.test(
                body,
              );
            if (/^Effect\.gen\s*\(/u.test(body) && !runsEffect) {
              offenses.push(`${path.slice(contentRoot.length + 1)}: example ${index + 1}`);
            }
          }
          ts.forEachChild(node, visit);
        };
        visit(file);
      }
      return offenses;
    });

    expect(offenders).toEqual([]);
  });
});
