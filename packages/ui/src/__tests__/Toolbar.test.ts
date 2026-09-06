import { Effect } from "effect";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Toolbar from "../Toolbar.js";

describe("typed/ui/Toolbar", () => {
  it("renders a hydrated toolbar with a roving tab stop", () =>
    Effect.gen(function* () {
      const state = yield* Toolbar.makeState({ activeId: "bold" });
      const markup = yield* renderToHtmlString(
        Toolbar.Root({ state, content: Toolbar.Item({ state, id: "bold", content: "Bold" }) }),
      );
      assert.match(markup, /role="toolbar"/);
      assert.match(markup, /data-typed-refsubject=/);
      assert.match(markup, /role="button"/);
      assert.match(markup, /tabindex="0"/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
