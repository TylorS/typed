import { Effect } from "effect";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Tooltip from "../Tooltip.js";

describe("typed/ui/Tooltip", () => {
  it("renders a manual native popover related to its anchor", () =>
    Effect.gen(function* () {
      const state = yield* Tooltip.makeState({ id: "tip" });
      const markup = yield* renderToHtmlString([
        Tooltip.Anchor({ state, content: "Help" }),
        Tooltip.Content({
          state,
          content: "Helpful text",
        }),
      ]);

      assert.match(markup, /aria-describedby="tip"/);
      assert.match(markup, /id="tip"/);
      assert.match(markup, /role="tooltip"/);
      assert.match(markup, /popover="manual"/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
