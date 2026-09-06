import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { replaceDirectoriesTransactionally } from "../AtomicDirectories.js";
import { renderSymbolMarkdown, validateMarkdownFences } from "../RenderMarkdown.js";
import type { SymbolDocumentation } from "../Model.js";

const temporaryDirectories: Array<string> = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("generated artifact infrastructure", () => {
  it("rolls every destination back when a later directory swap fails", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "typed-docs-transaction-"));
    temporaryDirectories.push(root);
    const destinations = ["generated", "docs", "schemas"].map((name) => path.join(root, name));
    const stages = ["generated-stage", "docs-stage", "schemas-stage"].map((name) =>
      path.join(root, name),
    );
    destinations.forEach((directory, index) => {
      fs.mkdirSync(directory);
      fs.writeFileSync(path.join(directory, "value"), `old-${index}`);
    });
    stages.forEach((directory, index) => {
      fs.mkdirSync(directory);
      fs.writeFileSync(path.join(directory, "value"), `new-${index}`);
    });

    expect(() =>
      replaceDirectoriesTransactionally(
        stages.map((staging, index) => ({ staging, destination: destinations[index]! })),
        {
          beforeInstall: (index) =>
            index === 1
              ? (() => {
                  throw new Error("injected");
                })()
              : undefined,
        },
      ),
    ).toThrow("injected");
    destinations.forEach((directory, index) => {
      expect(fs.readFileSync(path.join(directory, "value"), "utf8")).toBe(`old-${index}`);
    });
    expect(fs.readdirSync(root).some((name) => name.includes(".previous-"))).toBe(false);
  });

  it("normalizes authored Markdown examples without creating nested fences", () => {
    const symbol: SymbolDocumentation = {
      id: "@typed/example#value",
      packageName: "@typed/example",
      moduleName: ".",
      exportName: "value",
      kind: "constant",
      signatures: ["export declare const value: string"],
      summary: "An example.",
      sections: { Why: "It demonstrates rendering." },
      examples: [
        {
          language: "text",
          code: 'Introductory prose.\n```ts\nimport { value } from "@typed/example"\n```',
        },
      ],
      relations: [],
      source: { file: "packages/example.ts", line: 1 },
    };
    const markdown = renderSymbolMarkdown(symbol);

    expect(validateMarkdownFences(markdown)).toEqual([]);
    expect(markdown).not.toContain("```text\nIntroductory prose.\n```ts");
    expect(markdown.match(/^```/gm)).toHaveLength(4);
    expect(validateMarkdownFences("```text\n```ts\nvalue\n```\n```")).toEqual(
      expect.arrayContaining([expect.stringContaining("Nested")]),
    );
  });
});
