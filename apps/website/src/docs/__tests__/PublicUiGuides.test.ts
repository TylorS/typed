import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ts from "typescript-compiler";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences, extractTypeScriptFenceDocuments } from "../RecipeValidation.js";

import { NodeFileSystem } from "@effect/platform-node";
import { Effect } from "effect";
import { discoverPublishedPackages, resolvePublicModules } from "../Published.js";
import { uiGuidePath } from "../../site/Guides.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));

const loadUiGuides = () => fs.readdirSync(path.join(websiteRoot, "content/guides"))
  .filter((file) => file.endsWith(".md"))
  .map((file) => parseGuideDocumentation(file, fs.readFileSync(path.join(websiteRoot, "content/guides", file), "utf8")))
  .filter(({ section, slug }) => slug === "ui" || section === "UI" || section?.startsWith("UI / "));

describe("public UI guides", () => {
  it("provides a dedicated learning destination for every live public UI module", async () => {
    const modules = await Effect.gen(function* () {
      const packages = yield* discoverPublishedPackages(path.resolve(websiteRoot, "../.."));
      const ui = packages.find(({ name }) => name === "@typed/ui");
      if (!ui) throw new Error("Missing public @typed/ui package");
      return yield* resolvePublicModules(ui);
    }).pipe(Effect.provide(NodeFileSystem.layer), Effect.runPromise);
    const guides = new Map(loadUiGuides().map((guide) => [guide.slug, guide]));

    expect(modules.some(({ consumerSpecifier }) => consumerSpecifier === "@typed/ui")).toBe(true);
    for (const { consumerSpecifier } of modules) {
      const href = uiGuidePath(consumerSpecifier);
      expect(href, consumerSpecifier).toMatch(/^\/explore\/ui(?:-|$)/u);
      const guide = guides.get(href!.slice("/explore/".length));
      expect(guide, `${consumerSpecifier} needs ${href}`).toBeDefined();
      expect(guide!.title.trim(), consumerSpecifier).not.toBe("");
      expect(guide!.summary.trim(), consumerSpecifier).not.toBe("");
      expect(guide!.body, consumerSpecifier).toContain("@typed/ui");
      if (guide!.slug === "ui") {
        expect(guide!.body).toContain("/explore/ui-");
      } else {
        expect(extractTypeScriptFences(guide!.body).length, `${href} needs a usable public example`).toBeGreaterThan(0);
      }
    }
    expect(uiGuidePath("@typed/fx/Fx")).toBeUndefined();
  });

  it("organizes UI lessons into concrete interactions without fixed titles or order numbers", () => {
    const guides = loadUiGuides();
    const sections = new Set(guides.map(({ section }) => section));
    for (const section of ["UI / Foundations", "UI / Forms", "UI / Collections", "UI / Overlays"]) {
      expect(sections.has(section), section).toBe(true);
    }
    for (const guide of guides) {
      expect(Number.isFinite(guide.order), guide.slug).toBe(true);
      expect(guide.body.trim(), guide.slug).not.toBe("");
    }
  });

  // This builds a complete curriculum/atlas, including compiler or highlighter startup on CI.
  it("compiles every UI guide example, preserving explicit multi-file boundaries", { timeout: 60_000 }, () => {
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".public-ui-guide-check-"));

    try {
      const files = loadUiGuides().flatMap((guide) => {
        const names = new Set<string>();
        return extractTypeScriptFenceDocuments(guide.body).map(({ code, fileName, extension }, index) => {
          const name = fileName ?? `${index}.${extension}`;
          expect(names.has(name), `${guide.slug} has a duplicate example file ${name}`).toBe(false);
          names.add(name);
          const example = path.join(staging, guide.slug, name);
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
