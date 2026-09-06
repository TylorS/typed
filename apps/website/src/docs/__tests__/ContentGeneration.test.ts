import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import {
  loadGlossaryContent,
  parseFrontmatter,
  parseGuideDocumentation,
  parseGlossaryEntry,
  parseRecipeDocumentation,
} from "../Frontmatter.js";

import { groupGuides } from "../../site/Guides.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));

const authoredMarkdownFiles = (): ReadonlyArray<string> => {
  const contentRoot = path.join(websiteRoot, "content");
  return fs
    .readdirSync(contentRoot, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort();
};

const scriptFences = (markdown: string): ReadonlyArray<string> =>
  Array.from(
    markdown.matchAll(/^```(?:ts|tsx|typescript|js|jsx|javascript)\s*\r?\n([\s\S]*?)^```\s*$/gmu),
    ([, code]) => code!,
  );

const aliasedTypedImports = (code: string): ReadonlyArray<string> => {
  const source = ts.createSourceFile(
    "example.tsx",
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  return source.statements.flatMap((statement) => {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !statement.moduleSpecifier.text.startsWith("@typed/") ||
      statement.importClause?.namedBindings === undefined ||
      !ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      return [];
    }
    const moduleSpecifier = statement.moduleSpecifier.text;
    return statement.importClause.namedBindings.elements
      .filter((element) => element.propertyName !== undefined)
      .map(
        (element) => `${moduleSpecifier}: ${element.propertyName!.text} as ${element.name.text}`,
      );
  });
};

describe("Markdown content generation", () => {
  it("groups valid guides by learning topic without requiring a global ordering index", () => {
    const guides = fs
      .readdirSync(path.join(websiteRoot, "content/guides"))
      .filter((fileName) => fileName.endsWith(".md"))
      .map((fileName) => parseGuideDocumentation(
        fileName,
        fs.readFileSync(path.join(websiteRoot, "content/guides", fileName), "utf8"),
      ));

    expect(new Set(guides.map(({ slug }) => slug)).size).toBe(guides.length);
    for (const guide of guides) {
      expect(guide.title.trim(), guide.slug).not.toBe("");
      expect(guide.summary.trim(), guide.slug).not.toBe("");
      expect(guide.body.trim(), guide.slug).not.toBe("");
      expect(guide.section?.trim(), guide.slug).toBeTruthy();
      expect(Number.isFinite(guide.order), guide.slug).toBe(true);
      expect(["concept", "guide", "deep-dive"], guide.slug).toContain(guide.kind);
    }
    const groups = groupGuides(guides.map((guide) => ({
      id: guide.slug,
      collection: "guides" as const,
      body: guide.body,
      data: { title: guide.title, summary: guide.summary, section: guide.section!, kind: guide.kind!, order: guide.order! },
    })));
    const sections = groups.map(([section]) => section);
    expect(sections).not.toContain("DOM and platform");
    expect(sections).toEqual(expect.arrayContaining([
      "Learning paths", "Fx", "State", "Async data", "UI", "Routing",
      "Template authoring", "Template bindings", "Template rendering", "Template internals",
    ]));
    expect(sections.some((section) => section.startsWith("UI / "))).toBe(true);
    expect(sections.indexOf("Learning paths")).toBeLessThan(sections.indexOf("Fx"));
    expect(sections.indexOf("Template authoring")).toBeLessThan(sections.indexOf("Template internals"));
    expect(groups.flatMap(([, entries]) => entries).map(({ id }) => id).toSorted())
      .toEqual(guides.map(({ slug }) => slug).toSorted());
    for (const [, entries] of groups) {
      expect(entries.map(({ id }) => id)).toEqual(entries.toSorted(
        (a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id),
      ).map(({ id }) => id));
    }
  });

  it("parses frontmatter arrays and preserves the Markdown body", () => {
    const parsed = parseFrontmatter(
      "example.md",
      '---\nid: fx\naliases: [stream, "push stream"]\n---\n\nA detail.',
    );

    expect(parsed.attributes).toEqual({ id: "fx", aliases: ["stream", "push stream"] });
    expect(parsed.body).toBe("A detail.");
  });

  it("loads one validated Markdown source per glossary term", () => {
    const entries = loadGlossaryContent(path.join(websiteRoot, "content/glossary"));

    const fx = entries.find(({ id }) => id === "fx");
    expect(fx).toBeDefined();
    expect(fx?.term).toBe("Fx");
    expect(fx?.definition.trim()).toBeTruthy();
    expect(fx?.details.trim()).toBeTruthy();
    expect(new Set(entries.flatMap(({ aliases }) => aliases)).size).toBe(
      entries.flatMap(({ aliases }) => aliases).length,
    );
  });

  it("indexes the public vocabulary used across state, rendering, routing, and integration", () => {
    const entries = loadGlossaryContent(path.join(websiteRoot, "content/glossary"));

    const ids = new Set(entries.map(({ id }) => id));
    for (const id of ["fx", "effect", "scope", "refsubject", "renderable", "template", "route", "router", "ui"]) {
      expect(ids.has(id), `Missing core glossary term ${id}`).toBe(true);
    }
    for (const entry of entries) {
      expect(entry.term.trim(), entry.id).not.toBe("");
      expect(entry.definition.trim(), entry.id).not.toBe("");
      for (const related of entry.related) {
        expect(ids.has(related), `${entry.id} links missing glossary term ${related}`).toBe(true);
      }
    }
  });

  it("keeps concepts and task guides in one ordered Explore curriculum", () => {
    expect(
      parseGuideDocumentation(
        "first-template.md",
        "---\ntitle: First template\nsummary: Render output.\nsection: Rendering\nkind: guide\norder: 4\n---\n## Mount",
      ),
    ).toMatchObject({
      slug: "first-template",
      section: "Rendering",
      kind: "guide",
      order: 4,
      headings: ["Mount"],
    });
  });

  it("rejects duplicate glossary ids and aliases", () => {
    const temp = fs.mkdtempSync(path.join(websiteRoot, ".content-test-"));
    try {
      fs.writeFileSync(path.join(temp, "a.md"), "---\nid: same\nterm: A\ndefinition: A\n---\nA");
      fs.writeFileSync(path.join(temp, "b.md"), "---\nid: same\nterm: B\ndefinition: B\n---\nB");
      expect(() => loadGlossaryContent(temp)).toThrow(/duplicate/i);
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  });

  it("rejects unknown frontmatter attributes instead of silently ignoring typos", () => {
    expect(() =>
      parseGlossaryEntry(
        "typo.md",
        "---\nid: typo\nterm: Typo\ndefinition: Bad\ndefintion: ignored\n---\nBody",
      ),
    ).toThrow(/unknown.*defintion|unrecognized.*defintion/i);
    expect(() =>
      parseRecipeDocumentation(
        "typo.md",
        "---\nslug: typo\ntitle: Typo\nsummary: Bad\nsummray: ignored\n---\n## Body",
      ),
    ).toThrow(/unknown.*summray|unrecognized.*summray/i);
    expect(() =>
      parseGuideDocumentation(
        "typo.md",
        "---\ntitle: Typo\nsummary: Bad\nsection: Rendering\nkind: guide\norder: 1\nsectoin: ignored\n---\nBody",
      ),
    ).toThrow(/unknown.*sectoin|unrecognized.*sectoin/i);
  });

  it("uses exact public API names for every @typed import in authored examples", () => {
    const offenders = authoredMarkdownFiles().flatMap((file) =>
      scriptFences(fs.readFileSync(file, "utf8")).flatMap((code, index) =>
        aliasedTypedImports(code).map(
          (alias) => `${path.relative(websiteRoot, file)} fence ${index + 1}: ${alias}`,
        ),
      ),
    );

    expect(offenders).toEqual([]);
  });
});
