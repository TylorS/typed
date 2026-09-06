import { describe, expect, it } from "vitest";
import { siteHref } from "../../SiteHref.js";
import { canonicalSiteOrigin } from "../../Site.js";
import { resolveMarkdownLinks } from "../MarkdownLinks.js";
import { canonicalReferencePath, referencePath } from "../Reference.js";

const canonicalSite = new URL(canonicalSiteOrigin);
const artifactUrl = (path: string): string =>
  new URL(siteHref(canonicalReferencePath(path), canonicalSite.pathname), canonicalSite.origin).href;

describe("standalone documentation artifact links", () => {
  it("canonicalizes encoded public specifiers and adds the deployment base exactly once", () => {
    expect(resolveMarkdownLinks("[Fx](/reference/modules/%40typed%2Ffx)", artifactUrl)).toBe(
      "[Fx](https://tylors.github.io/typed/reference/modules/@typed/fx/)",
    );
    const id = "@typed/fx/Fx#map";
    expect(artifactUrl(`/reference/${encodeURIComponent(id)}`)).toBe(
      `https://tylors.github.io/typed${referencePath(id)}/`,
    );
  });

  it("keeps file URLs intact and places page slashes before fragments", () => {
    expect(artifactUrl("/docs/reference/manifest.json")).toBe(
      "https://tylors.github.io/typed/docs/reference/manifest.json",
    );
    expect(artifactUrl("/explore/building-fx#adapt-a-callback")).toBe(
      "https://tylors.github.io/typed/explore/building-fx/#adapt-a-callback",
    );
    expect(artifactUrl("/reference/modules/@typed/fx/")).toBe(
      "https://tylors.github.io/typed/reference/modules/@typed/fx/",
    );
  });

  it("rewrites prose and reference definitions without changing fenced examples", () => {
    const code = '```ts\nconst example = "[Fx](/reference/modules/%40typed%2Ffx)"\n```';
    const source = `[Fx](/reference/modules/%40typed%2Ffx)\n\n${code}\n\n[guide]: /explore/building-fx`;
    const output = resolveMarkdownLinks(source, artifactUrl);
    expect(output).toContain(code);
    expect(output).toContain("[guide]: https://tylors.github.io/typed/explore/building-fx/");
    expect(output).not.toContain("/typed/typed/");
  });
});
