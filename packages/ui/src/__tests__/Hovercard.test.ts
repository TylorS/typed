import { Effect } from "effect";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Hovercard from "../Hovercard.js";

describe("typed/ui/Hovercard", () => {
  it("renders a manual dialog popover related to its anchor", () =>
    Effect.gen(function* () {
      const state = yield* Hovercard.makeState({ id: "card" });
      const markup = yield* renderToHtmlString([
        Hovercard.Anchor({ state, content: "Account" }),
        Hovercard.Content({
          state,
          label: "Account details",
          content: "Account details",
        }),
      ]);

      assert.match(markup, /aria-controls="card"/);
      assert.match(markup, /id="card"/);
      assert.match(markup, /role="dialog"/);
      assert.match(markup, /aria-label="Account details"/);
      assert.match(markup, /popover="manual"/);
      assert.strictEqual(markup.includes("aria-expanded"), false);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
