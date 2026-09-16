import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { extractTypeScriptFences } from "../Recipes.js";
import { runGuideExample } from "./FxGuideTestSupport.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const examples = [
  ["fx-services-and-lifetime", "class Quotes extends", [1, 1.02]],
  ["subject-event-publications", "class Saved extends", ["invoice-42", "invoice-43"]],
  ["sink-writing-effects", "docs/RecordedAudit", ["saved", "published"]],
  ["shared-state-contracts", "class Count extends", { before: 0, first: 10, current: 11, loads: 1 }],
  ["shared-state-contracts", "class Lengths extends", [5, 5]],
  ["versioned-state", "class SettingsView extends", {
    current: { density: "compact" }, version: 7, updates: [{ density: "compact" }],
  }],
] as const;
const readGuide = (slug: string) => fs.readFileSync(path.join(websiteRoot, `content/guides/${slug}.md`), "utf8");

describe("Reactive service examples", () => {
  it("typechecks all six authored service contracts", () => {
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".services-guide-check-"));

    try {
      const files = examples.map(([slug, marker], index) => {
        const matches = extractTypeScriptFences(readGuide(slug)).filter((code) => code.includes(marker));
        expect(matches).toHaveLength(1);
        const file = path.join(staging, `example-${index}.ts`);
        fs.writeFileSync(file, matches[0]!);

        return file;
      });
      const program = ts.createProgram(files, {
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        target: ts.ScriptTarget.ES2022,
      });
      const diagnostics = ts.getPreEmitDiagnostics(program);

      expect(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (name) => name,
        getCurrentDirectory: () => websiteRoot,
        getNewLine: () => "\n",
      })).toBe("");
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  });

  for (const [slug, marker, expected] of examples) {
    it(`executes ${marker}`, async () => {
      expect(await runGuideExample(websiteRoot, readGuide(slug), marker, "result")).toEqual(expected);
    });
  }

  it("replaces an Fx implementation without changing its consumer", async () => {
    expect(await runGuideExample(websiteRoot, readGuide("fx-services-and-lifetime"), "class Quotes extends", "testResult"))
      .toEqual([2.5]);
  });
});
