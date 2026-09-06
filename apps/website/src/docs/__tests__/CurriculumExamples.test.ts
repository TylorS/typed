import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { quickStartSections, tutorialSteps } from "../../tutorial/Content.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));

describe("Authored curriculum examples", () => {
  it("displays every local module reached by each preview entry, byte for byte", () => {
    for (const entries of [quickStartSections, tutorialSteps]) {
      const snapshots = new Map<string, string>();
      for (const entry of entries) {
        for (const file of entry.files) snapshots.set(file.name, file.source);
        if (!entry.demo) continue;
        const counters = {
          "counter-reactive": 3,
          "counter-component": 4,
          "counter-hydrated": 6,
        };
        const folder = entry.demo.startsWith("todo-")
          ? entry.demo
          : `learn-${counters[entry.demo as keyof typeof counters]}`;
        const root = path.join(websiteRoot, "src/tutorial/examples", folder);
        const visited = new Set<string>();
        const visit = (name: string) => {
          if (visited.has(name)) return;
          visited.add(name);
          const source = fs.readFileSync(path.join(root, name), "utf8").trim();
          expect(
            snapshots.get(name),
            `${entry.demo}: ${name} must be the displayed executable source`,
          ).toBe(source);
          const parsed = ts.createSourceFile(
            name,
            source,
            ts.ScriptTarget.ES2022,
            true,
          );
          for (const statement of parsed.statements) {
            if (
              !ts.isImportDeclaration(statement) ||
              !ts.isStringLiteral(statement.moduleSpecifier)
            )
              continue;
            const specifier = statement.moduleSpecifier.text;
            if (!specifier.startsWith(".")) continue;
            visit(
              path.posix.normalize(
                path.posix.join(
                  path.posix.dirname(name),
                  specifier.replace(/\.js$/u, ".ts"),
                ),
              ),
            );
          }
        };
        visit(
          entry.demo.startsWith("todo-") ? "src/preview.ts" : "src/Counter.ts",
        );
        expect(visited.size).toBeGreaterThan(0);
      }
    }
  });

  // This builds a complete curriculum/atlas, including compiler or highlighter startup on CI.
  it("typechecks every cumulative milestone against the public packages", { timeout: 60_000 }, () => {
    const staging = fs.mkdtempSync(
      path.join(websiteRoot, ".curriculum-examples-"),
    );

    try {
      const files: Array<string> = [];
      const curricula = [quickStartSections, tutorialSteps];
      for (const [curriculumIndex, entries] of curricula.entries()) {
        const snapshots = new Map<string, string>();
        for (const [stepIndex, entry] of entries.entries()) {
          for (const file of entry.files) {
            if (file.language === "ts") snapshots.set(file.name, file.source);
          }
          for (const [name, source] of snapshots) {
            const file = path.join(
              staging,
              String(curriculumIndex),
              String(stepIndex),
              name,
            );
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, source);
            files.push(file);
          }
        }
      }
      const program = ts.createProgram(files, {
        esModuleInterop: true,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        target: ts.ScriptTarget.ES2022,
      });

      expect(
        ts.formatDiagnosticsWithColorAndContext(
          ts.getPreEmitDiagnostics(program),
          {
            getCanonicalFileName: (fileName) => fileName,
            getCurrentDirectory: () => websiteRoot,
            getNewLine: () => "\n",
          },
        ),
      ).toBe("");
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  });
});
