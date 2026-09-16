import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ts from "typescript-compiler";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences, extractTypeScriptFenceDocuments } from "../RecipeValidation.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));

const guides = [
  {
    file: "refsubject-renderer-independent-state.md",
    section: "State",
    kind: "concept",
    order: 2,
  },
  {
    file: "refsubject-template-hydration.md",
    section: "State",
    kind: "guide",
    order: 2.04,
  },
  {
    file: "refsubject-sources-equality-and-lifetime.md",
    section: "State",
    kind: "guide",
    order: 2.05,
  },
  {
    file: "derived-conditional-and-accumulated-state.md",
    section: "State",
    kind: "guide",
    order: 2.15,
  },
  {
    file: "state-transactions-and-bidirectional-views.md",
    section: "State",
    kind: "guide",
    order: 2.25,
  },
  {
    file: "shared-state-contracts.md",
    section: "State",
    kind: "guide",
    order: 2.35,
  },
] as const;

describe("RefSubject state curriculum", () => {
  it("lists every public RefSubject specialization exactly once in the directory", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(websiteRoot, "../../packages/fx/package.json"), "utf8"));
    const modules = Object.keys(manifest.exports)
      .filter((name) => name.startsWith("./Ref") && name !== "./RefSubject")
      .map((name) => name.slice(2))
      .sort();
    const source = fs.readFileSync(path.join(websiteRoot, "content/guides/specialized-refsubject-state.md"), "utf8");
    const directory = source.split("## All RefSubject specializations")[1]!.split("For values without")[0]!;
    const listed = [...directory.matchAll(/\[`(Ref\w+)`\]\(\/reference\/modules\/%40typed%2Ffx%2F(Ref\w+)\)/gu)];

    expect(listed.map((match) => match[1]).sort()).toEqual(modules);
    for (const match of listed) {
      expect(match[2]).toBe(match[1]);
    }
  });

  it("keeps each state lesson at its public destination with a concrete example", () => {
    for (const expected of guides) {
      const guide = parseGuideDocumentation(
        expected.file,
        fs.readFileSync(path.join(websiteRoot, "content/guides", expected.file), "utf8"),
      );

      expect(guide).toMatchObject({
        slug: expected.file.replace(/\.md$/u, ""),
        section: expected.section,
        kind: expected.kind,
        order: expected.order,
      });
      expect(extractTypeScriptFences(guide.body).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("introduces RefSubject as both a current Effect read and an Fx of committed changes", () => {
    const guide = parseGuideDocumentation(
      "refsubject-renderer-independent-state.md",
      fs.readFileSync(
        path.join(websiteRoot, "content/guides", "refsubject-renderer-independent-state.md"),
        "utf8",
      ),
    );

    const examples = extractTypeScriptFences(guide.body).join("\n");
    // A read, observation, derived query and scoped command test are actual API usage,
    // independent of the prose used to explain them.
    for (const api of ["Effect.map(ids", "Fx.map(ids", "RefSubject.map", "Effect.scoped"]) {
      expect(examples).toContain(api);
    }
    expect(guide.body).toContain("/explore/refsubject-sources-equality-and-lifetime");
    expect(guide.body).toContain("/explore/derived-conditional-and-accumulated-state");
  });

  it("demonstrates serialized decisions and imports one shared service in its consumer", () => {
    const transactions = fs.readFileSync(
      path.join(websiteRoot, "content/guides/state-transactions-and-bidirectional-views.md"), "utf8",
    );
    const commands = extractTypeScriptFences(transactions).join("\n");
    expect(commands).toContain("RefSubject.modify(slots");
    expect(commands).toContain("first: yield* reserve(slots)");
    expect(commands).toContain("second: yield* reserve(slots)");

    const sharing = extractTypeScriptFenceDocuments(fs.readFileSync(
      path.join(websiteRoot, "content/guides/shared-state-contracts.md"), "utf8",
    ));
    expect(sharing.find(({ fileName }) => fileName === "Selection.ts")?.code)
      .toContain("export class Selection");
    const consumer = sharing.find(({ fileName }) => fileName === "selectedCount.ts")?.code;
    expect(consumer).toContain('import { Selection } from "./Selection.js"');
    expect(consumer).toContain("RefSubject.computedFromService");
  });

  it("keeps every state curriculum example compilable with their named companion modules", () => {
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".refsubject-state-curriculum-check-"));

    try {
      const files = guides.flatMap(({ file }) => {
        const guide = parseGuideDocumentation(
          file,
          fs.readFileSync(path.join(websiteRoot, "content/guides", file), "utf8"),
        );
        return extractTypeScriptFenceDocuments(guide.body).map(({ code, fileName, extension }, index) => {
          const example = path.join(staging, guide.slug, fileName ?? `${index}.${extension}`);
          fs.mkdirSync(path.dirname(example), { recursive: true });
          fs.writeFileSync(example, code);
          return example;
        });
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
});
