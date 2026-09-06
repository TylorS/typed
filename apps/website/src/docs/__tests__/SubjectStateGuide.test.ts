import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ts from "typescript-compiler";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences } from "../Recipes.js";
import { expectExampleCalls, runGuideExample } from "./FxGuideTestSupport.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guidePath = path.join(websiteRoot, "content/guides/subject-event-publications.md");

describe("Subject Fx guide", () => {
  it("teaches the public event-publication boundary and its ownership policies", () => {
    const guide = parseGuideDocumentation(
      "subject-event-publications.md",
      fs.readFileSync(guidePath, "utf8"),
    );

    expect(guide).toMatchObject({
      slug: "subject-event-publications",
      section: "Fx",
      kind: "guide",
      order: 1.17,
    });
    for (const term of [
      "Subject.make",
      "Subject.unsafeMake",
      "onSuccess",
      "onFailure",
      "Fx.observe",
      "subscriberCount",
      "interrupt",
      "Subject.Service",
      "Subject.multicast",
      "Subject.hold",
      "Subject.replay",
      "Subject.share",
      "RefSubject",
    ]) {
      expect(guide.body).toContain(term);
    }
    expectExampleCalls(guide.body, [
      "Subject.make",
      "Fx.collectAllFork",
      "Fx.take",
      "Fx.observe",
      "Cause.fail",
      "Sink.make",
      "Subject.multicast",
      "Subject.hold",
      "Subject.replay",
      "Subject.share",
    ]);
    expect(guide.body).toContain("```fx-marble");
    expect(guide.body).toContain("/explore/fx-services-and-lifetime");
  });

  it("keeps every TypeScript example independently compilable", () => {
    const guide = parseGuideDocumentation(
      "subject-event-publications.md",
      fs.readFileSync(guidePath, "utf8"),
    );
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".subject-state-guide-check-"));

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
  it("keeps the authored failure-counting subscriber alive for reconnection", async () => {
    const source = fs.readFileSync(guidePath, "utf8");
    const result = await runGuideExample(
      websiteRoot,
      source,
      "class ConnectionLost",
      "Effect.runPromise(program)",
    );
    expect(result).toEqual({ failures: 1, values: ["reconnected"] });
  });
});
