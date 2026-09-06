import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadRecipeContent } from "../Frontmatter.js";

const recipe = (name: string): string =>
  readFileSync(
    fileURLToPath(new URL(`../../../content/recipes/${name}.md`, import.meta.url)),
    "utf8",
  );

describe("integration editorial focus", () => {
  it("lets readers choose a concrete output or framework recipe immediately", () => {
    const recipes = loadRecipeContent(
      fileURLToPath(new URL("../../../content/recipes/", import.meta.url)),
    );
    expect(recipes.map(({ slug }) => slug)).toEqual(
      expect.arrayContaining([
        "astro",
        "dom-output",
        "html-output",
        "react",
        "svelte",
        "vue",
        "web-component",
      ]),
    );
    for (const recipe of recipes) {
      expect(recipe.title.length, recipe.slug).toBeGreaterThan(0);
      expect(recipe.summary.length, recipe.slug).toBeGreaterThan(0);
    }
  });

  it("keeps the DOM-output recipe about exact DOM values and behavior", () => {
    const page = recipe("dom-output");

    expect(page).toContain("## What `DomRenderEvent` carries");
    expect(page).toContain("Node | DocumentFragment | Wire");
    expect(page).toContain("nested readonly arrays");
    expect(page).toContain("## Placement, replacement, and moves");
    expect(page).toContain("moveBefore");
    expect(page).toContain("does not clone, serialize, or reparse");
    expect(page).toContain("## Cleanup stays with the adapter");
    expect(page).not.toContain("`Fx<A, E, R>` means");
    expect(page).not.toContain("Fx.make");
    expect(page.match(/DomRenderEvent/g)?.length ?? 0).toBeGreaterThan(
      page.match(/Fx\./g)?.length ?? 0,
    );
  });

  it("starts HTML output with its transport value, not a custom Fx producer", () => {
    const page = recipe("html-output");

    expect(page).toContain("## One complete render");
    expect(page).toContain("## Ordered chunks");
    expect(page).toContain("HtmlRenderEvent(html, last)");
    expect(page).not.toContain("Fx.make");
    expect(page).not.toContain("Start with `Fx.make`");
  });
});
