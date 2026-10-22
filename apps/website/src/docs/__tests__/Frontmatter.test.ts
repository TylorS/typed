import { describe, expect, it } from "vitest";
import {
  parseFrontmatter,
  parseGuideDocumentation,
  parseRecipeDocumentation,
} from "../Frontmatter.js";

describe("authored frontmatter", () => {
  it("keeps commas inside quoted aliases with escaped quotes or backslashes", () => {
    const parsed = parseFrontmatter(
      "quoted.md",
      String.raw`---
aliases: ["say \"hello, world\"", "path\\", 'it''s, quoted', plain]
---
Body`,
    );

    expect(parsed.attributes.aliases).toEqual([
      'say "hello, world"',
      "path\\",
      "it's, quoted",
      "plain",
    ]);
  });

  it("excludes fenced examples from both guide and recipe heading indexes", () => {
    const body = [
      "## Before",
      "````md",
      "## Example heading",
      "```ts",
      "## Still inside the four-backtick example",
      "````",
      "~~~md",
      "## Tilde example heading",
      "~~~",
      "## After",
    ].join("\n");
    const guide = parseGuideDocumentation(
      "guide.md",
      `---\ntitle: Guide\nsummary: Example\nsection: Fx\nkind: guide\norder: 1\n---\n${body}`,
    );
    const recipe = parseRecipeDocumentation(
      "recipe.md",
      `---\nslug: recipe\ntitle: Recipe\nsummary: Example\n---\n${body}`,
    );

    expect(guide.headings).toEqual(["Before", "After"]);
    expect(recipe.headings).toEqual(guide.headings);
    expect(guide.body).toBe(body);
    expect(recipe.body).toBe(body);
  });
});
