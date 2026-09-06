import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../Markdown.js";
import { referencePath } from "../../docs/Reference.js";
import { resolveMarkdownLinks } from "../../docs/MarkdownLinks.js";
import { siteHref } from "../../SiteHref.js";

const documentFor = (code: string) => {
  const window = new Window();
  window.document.body.innerHTML = code;
  return window.document;
};

describe("site Markdown rendering", () => {
  it("preserves relative indentation through source expansion and syntax highlighting", async () => {
    const source = [
      "        const draft = input.value;",
      "        if (draft) {",
      "          submit(draft);",
      "        }",
    ].join("\n");
    const rendered = documentFor((await renderMarkdown(`\`\`\`ts\n${source}\n\`\`\``)).code);
    expect(rendered.querySelector("pre > code")?.textContent).toBe(
      ["const draft = input.value;", "if (draft) {", "  submit(draft);", "}"].join("\n"),
    );
  });

  it("keeps rendered page links below the configured base while leaving artifact extensions intact", async () => {
    expect(siteHref("/explore/quick-start#install", "/typed/")).toBe(
      "/typed/explore/quick-start/#install",
    );
    expect(siteHref("/explore/quick-start.md", "/typed/")).toBe("/typed/explore/quick-start.md");
    expect(siteHref("/reference/modules/@typed/tsconfig/base.json", "/typed/")).toBe(
      "/typed/reference/modules/@typed/tsconfig/base.json/",
    );
    const rendered = documentFor(
      (await renderMarkdown("[Quick Start](/explore/quick-start)")).code,
    );
    expect(rendered.querySelector("a")?.getAttribute("href")).toBe(
      `${(process.env.SITE_BASE ?? "/typed/").replace(/\/$/u, "")}/explore/quick-start/`,
    );
  });
  it("resolves authored API links consistently without rewriting fenced examples", async () => {
    const path = "/reference/%40typed%2Fui%2FMenu%23makeState";
    const prose = `[Menu setup](${path})`;
    const source = `${prose}\n\n\`\`\`md\n${prose}\n\`\`\``;
    const canonical = referencePath("@typed/ui/Menu#makeState");
    const rendered = documentFor((await renderMarkdown(source)).code);
    expect(rendered.querySelector("a")?.getAttribute("href")).toContain(canonical);
    expect(rendered.querySelector("pre")?.textContent).toContain(prose);
    expect(resolveMarkdownLinks(source)).toBe(
      `[Menu setup](${canonical})\n\n\`\`\`md\n${prose}\n\`\`\``,
    );
  });
  it("preserves code text without executing or interpreting example markup", async () => {
    const source = 'const message: string = "<script>alert(1)</script>";';
    const rendered = await renderMarkdown(`\`\`\`typescript
${source}
\`\`\``);
    const document = documentFor(rendered.code);

    expect(document.querySelector("pre > code")?.textContent?.trim()).toBe(source);
    expect(document.querySelector("script")).toBeNull();
    expect(document.querySelector("pre > code span")).not.toBeNull();
  });

  it("links known Typed modules and qualified symbols without guessing unknown identifiers", async () => {
    const rendered = await renderMarkdown(
      "Use `Fx.map`, `@typed/ui/Checkbox`, and `Fx.notARealOperator`. `NodeLike` stays ordinary code.",
    );
    const document = documentFor(rendered.code);
    const links = [...document.querySelectorAll("a")];

    expect(links.find((link) => link.textContent === "Fx.map")?.getAttribute("href")).toEqual(
      expect.stringContaining(referencePath("@typed/fx/Fx#map")),
    );
    expect(
      links.find((link) => link.textContent === "@typed/ui/Checkbox")?.getAttribute("href"),
    ).toMatch(/\/reference\/modules\/@typed\/ui\/Checkbox\/$/u);
    expect(links.some((link) => link.textContent === "Fx.notARealOperator")).toBe(false);
    expect(links.some((link) => link.textContent === "NodeLike")).toBe(false);
    expect(document.body.textContent).toContain("Fx.notARealOperator");
  });
});
