import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { HtmlRenderTemplate, StaticHtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import Stateful from "./fixtures/Stateful.svelte";
import { siblings } from "./fixtures/trees.js";
import { view } from "../view.js";

describe("Svelte automatic host identity", () => {
  it.each([HtmlRenderTemplate, StaticHtmlRenderTemplate])(
    "allocates unique hosts and Svelte id prefixes when a view is reused in siblings",
    async (renderer) => {
      const shared = view(Stateful, { label: "shared" });
      const page = siblings(shared, shared);
      const output = await renderToHtmlString(page).pipe(
        Effect.provide(renderer),
        Effect.scoped,
        Effect.runPromise,
      );
      const hosts = [...output.matchAll(/<div\b[^>]*\sid="([^"]+)"/g)].map((match) => match[1]);
      const buttons = [...output.matchAll(/<button\b[^>]*\sid="([^"]+)"/g)].map(
        (match) => match[1],
      );
      expect(hosts).toHaveLength(2);
      expect(new Set(hosts).size).toBe(2);
      expect(buttons).toHaveLength(2);
      expect(new Set(buttons).size).toBe(2);
      expect(buttons[0].startsWith(hosts[0])).toBe(true);
      expect(buttons[1].startsWith(hosts[1])).toBe(true);
    },
  );

  it("preserves explicit host and Svelte prefix overrides", async () => {
    const output = await renderToHtmlString(
      view(
        Stateful,
        { label: "explicit" },
        {
          id: "explicit-host",
          idPrefix: "component-prefix",
        },
      ),
    ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise);
    expect(output).toMatch(/<div\b[^>]*\sid="explicit-host"/);
    expect(output).toMatch(/<button\b[^>]*\sid="component-prefix[^"]*"/);
  });
});
