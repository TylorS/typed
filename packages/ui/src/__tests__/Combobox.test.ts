import { Effect } from "effect";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Combobox from "../Combobox.js";

describe("typed/ui/Combobox", () => {
  it("renders an input related to its hydrated listbox popover", () =>
    Effect.gen(function* () {
      const state = yield* Combobox.makeState({ id: "search" });
      const markup = yield* renderToHtmlString([
        Combobox.Input({ state }),
        Combobox.Popover({
          state,
          content: Combobox.Item({ state, id: "one", value: "One", content: "One" }),
        }),
      ]);
      assert.match(markup, /role="combobox"/);
      assert.match(markup, /aria-controls="search"/);
      assert.match(markup, /role="listbox"/);
      assert.match(markup, /data-typed-refsubject=/);
      assert.match(markup, /role="option"/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
