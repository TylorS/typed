import { Effect } from "effect";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Tabs from "../Tabs.js";

describe("typed/ui/Tabs", () => {
  it("moves active selection through collection items in automatic mode", () =>
    Effect.gen(function* () {
      const state = yield* Tabs.makeState({ selectedId: "first" });
      const next = yield* Tabs.move(state, [{ id: "first" }, { id: "second" }], "next");

      assert.strictEqual(next.activeId, "second");
      assert.strictEqual(next.selectedId, "second");
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("renders a hydrated tablist with selected tab and panel semantics", () =>
    Effect.gen(function* () {
      const state = yield* Tabs.makeState({ selectedId: "first" });
      const markup = yield* renderToHtmlString([
        Tabs.List({
          state,
          content: Tabs.Tab({ state, id: "first", panelId: "first-panel", content: "First" }),
        }),
        Tabs.Panel({ state, id: "first-panel", tabId: "first", content: "First panel" }),
      ]);

      assert.match(markup, /role="tablist"/);
      assert.match(markup, /data-typed-refsubject=/);
      assert.match(markup, /role="tab"/);
      assert.match(markup, /aria-selected="true"/);
      assert.match(markup, /role="tabpanel"/);
      assert.match(markup, /aria-labelledby="first"/);
      assert.match(markup, /role="tabpanel"[^>]*tabindex="0"/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
