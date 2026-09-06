import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compile as compileSvelte } from "svelte/compiler";
import {
  extractTypeScriptFenceDocuments,
  extractTypeScriptFences,
  validateRecipeExamples,
} from "../Recipes.js";
import { renderMarkdown } from "../../site/Markdown.js";
import { loadRecipeContent } from "../Frontmatter.js";

const recipes = loadRecipeContent(
  fileURLToPath(new URL("../../../content/recipes/", import.meta.url)),
);

describe("integration recipes", () => {
  it("keeps named source files so examples can import one another", () => {
    expect(
      extractTypeScriptFenceDocuments('```ts file="src/Save.ts"\nexport const save = 1;\n```'),
    ).toEqual([{ code: "export const save = 1;", extension: "ts", fileName: "src/Save.ts" }]);
    expect(() =>
      extractTypeScriptFenceDocuments('```ts file="../Save.ts"\nexport {};\n```'),
    ).toThrow("Invalid example file name");
  });

  const domRecipe = recipes.find(({ slug }) => slug === "dom-output")!;
  const htmlRecipe = recipes.find(({ slug }) => slug === "html-output")!;
  const reactRecipe = recipes.find(({ slug }) => slug === "react")!;
  const svelteRecipe = recipes.find(({ slug }) => slug === "svelte")!;

  it("documents real output and cleanup paths", () => {
    expect(domRecipe.body).toContain(
      'Fx.sync(() => DomRenderEvent(document.createElement("div")))',
    );
    expect(domRecipe.body).toContain("Fx.callback");
    expect(domRecipe.body).toContain("DomRenderEvent");
    expect(domRecipe.body).toContain("## Cleanup stays with the adapter");
    expect(domRecipe.body).toContain("root.unmount()");
    expect(domRecipe.body).not.toContain(["foreign.mount(host)", ".pipe"].join(""));

    expect(htmlRecipe.body).toContain("Fx.sync(() => HtmlRenderEvent(htmlString, true))");
    expect(htmlRecipe.body).toContain("HtmlRenderEvent");
    expect(htmlRecipe.body).toContain("last");
    expect(htmlRecipe.body).toContain("effect/unstable/http/HttpServerResponse");
    expect(htmlRecipe.body).not.toContain("interface ServerResponse");
    expect(htmlRecipe.body).not.toContain(["Fx.map((html,", " index)"].join(""));
  });

  it("extracts complete TypeScript examples and compiles every recipe", () => {
    expect(extractTypeScriptFences(domRecipe.body).length).toBeGreaterThanOrEqual(3);
    expect(extractTypeScriptFences(htmlRecipe.body).length).toBeGreaterThanOrEqual(2);
    expect(validateRecipeExamples(recipes)).toEqual([]);
  });

  it("uses the public React integration and native framework types", () => {
    expect(reactRecipe.body).toContain('from "@typed/react"');
    expect(reactRecipe.body).toContain('from "react"');
    expect(reactRecipe.body).toContain('from "react-dom/client"');
    expect(reactRecipe.body).not.toContain("Local stand-ins");
    expect(reactRecipe.body).not.toMatch(/interface React(?:Root|DomClient|ErrorInfo)/u);
  });

  it("preserves TSX fence language for compilation", () => {
    expect(
      extractTypeScriptFenceDocuments(
        '```tsx\nimport type { ReactNode } from "react"\nconst view: ReactNode = <main />\n```',
      ),
    ).toEqual([
      {
        code: 'import type { ReactNode } from "react"\nconst view: ReactNode = <main />',
        extension: "tsx",
      },
    ]);
  });

  it("allows a framework-only fence when the recipe already uses Typed publicly", () => {
    expect(
      validateRecipeExamples([
        {
          slug: "split-boundary",
          title: "Split boundary",
          summary: "A server adapter and its browser entry.",
          headings: [],
          body: `\`\`\`ts
import * as Fx from "@typed/fx/Fx"
export const output = Fx.succeed("ready")
\`\`\`

\`\`\`tsx
import { hydrateRoot } from "react-dom/client"
hydrateRoot(document.body, <main />)
\`\`\``,
        },
      ]),
    ).toEqual([]);
  });

  it("compiles every authored Svelte component", () => {
    const fences = Array.from(
      svelteRecipe.body.matchAll(/^```svelte\s*\r?\n([\s\S]*?)^```\s*$/gmu),
      ([, code]) => code!,
    );

    expect(fences.length).toBeGreaterThan(0);
    for (const [index, code] of fences.entries()) {
      expect(() =>
        compileSvelte(code, {
          filename: `svelte-recipe-${index + 1}.svelte`,
          generate: "client",
        }),
      ).not.toThrow();
    }
  });

  it("gives repeated headings unique anchors within one rendered page", async () => {
    const rendered = await renderMarkdown("## Ownership\n\nDOM\n\n## Ownership\n\nHTML");

    expect(rendered.code).toContain('id="ownership"');
    expect(rendered.code).toContain('id="ownership-1"');
    expect(rendered.metadata.headings.map(({ slug }) => slug)).toEqual([
      "ownership",
      "ownership-1",
    ]);
  });

  it("rejects compile-only scaffolding in reader-facing examples", () => {
    const errors = validateRecipeExamples([
      {
        slug: "noisy",
        title: "Noisy example",
        summary: "A regression fixture.",
        headings: [],
        body: `\`\`\`ts
import { Fx } from "@typed/fx"

declare const source: Fx.Fx<string>
void source
\`\`\``,
      },
    ]);

    expect(errors.some((error) => error.includes("ambient declaration"))).toBe(true);
    expect(errors.some((error) => error.includes("no-op void expression"))).toBe(true);
  });

  it("rejects a synchronous Effect wrapped only to lift it into Fx", () => {
    const errors = validateRecipeExamples([
      {
        slug: "redundant-sync",
        title: "Redundant sync",
        summary: "A regression fixture.",
        headings: [],
        body: `\`\`\`ts
import { Effect } from "effect"
import { Fx } from "@typed/fx"

const value = Fx.fromEffect(Effect.sync(() => 1))
\`\`\``,
      },
    ]);

    expect(errors).toContain(
      "redundant-sync example 1 wraps Effect.sync with Fx.fromEffect; use Fx.sync",
    );
  });
});
