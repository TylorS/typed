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
    terms: ["RefSubject.make", "RefSubject.update", "Computed", "Filtered", "RefSubject.map"],
  },
  {
    file: "refsubject-template-hydration.md",
    section: "State",
    kind: "guide",
    order: 2.04,
    terms: ["RefSubject.hydrate", "hydrateAll", "HydrationRef", "html", "Schema"],
  },
  {
    file: "refsubject-sources-equality-and-lifetime.md",
    section: "State",
    kind: "guide",
    order: 2.05,
    terms: [
      "RefSubject.make",
      "Effect",
      "Stream",
      "Fx",
      "RefSubjectOptions",
      "subscriberCount",
      "RefSubject.delete",
      "interrupt",
    ],
  },
  {
    file: "derived-conditional-and-accumulated-state.md",
    section: "State",
    kind: "guide",
    order: 2.15,
    terms: ["Computed", "Filtered", "makeComputed", "filterMap", "scan", "scanEffect"],
  },
  {
    file: "state-transactions-and-bidirectional-views.md",
    section: "State",
    kind: "guide",
    order: 2.25,
    terms: ["modify", "runUpdates", "transform", "slice", "GetSetDelete"],
  },
  {
    file: "shared-state-contracts.md",
    section: "State",
    kind: "guide",
    order: 2.35,
    terms: [
      "Fx.Service",
      "Sink.Service",
      "Subject.Service",
      "RefSubject.Service",
      "computedFromService",
      "filteredFromService",
      "Layer",
    ],
  },
] as const;

describe("RefSubject state curriculum", () => {
  it("covers the public state behaviors omitted by the introductory and specialized-state guides", () => {
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
      expect(extractTypeScriptFences(guide.body).length).toBeGreaterThanOrEqual(2);
      for (const term of expected.terms) expect(guide.body).toContain(term);
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
