import { Effect } from "effect";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Select from "../Select.js";

describe("typed/ui/Select", () => {
  it("renders a hydrated native listbox popover", () =>
    Effect.gen(function* () {
      const state = yield* Select.makeState({ id: "size", value: "small" });
      const markup = yield* renderToHtmlString([
        Select.Trigger({ state, content: "Small" }),
        Select.Content({
          state,
          content: Select.Option({ state, id: "small", value: "small", content: "Small" }),
        }),
      ]);
      assert.match(markup, /aria-haspopup="listbox"/);
      assert.match(markup, /id="size-trigger"/);
      assert.match(markup, /id="size"/);
      assert.match(markup, /role="listbox"/);
      assert.match(markup, /aria-labelledby="size-trigger"/);
      assert.match(markup, /popover="manual"/);
      assert.match(markup, /role="option"/);
      assert.match(markup, /aria-selected="true"/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
