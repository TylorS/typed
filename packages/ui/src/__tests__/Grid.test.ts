import { Effect } from "effect";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Grid from "../Grid.js";

describe("typed/ui/Grid", () => {
  it("hydrates virtual-focus state on the grid host", () =>
    Effect.gen(function* () {
      const state = yield* Grid.makeState({ activeId: "a1" });
      const markup = yield* renderToHtmlString(
        Grid.Root({
          state,
          label: "Invoices",
          content: Grid.Row({
            content: [
              Grid.Cell({ state, id: "a1", rowId: "a", columnIndex: 1, content: "Invoice" }),
              Grid.Cell({ state, id: "a2", rowId: "a", columnIndex: 2, content: "Amount" }),
            ],
          }),
        }),
      );

      assert.match(markup, /role="grid"/);
      assert.match(markup, /tabindex="0"/);
      assert.match(markup, /aria-activedescendant="a1"/);
      assert.match(markup, /data-typed-refsubject=/);
      assert.match(markup, /role="row"/);
      assert.match(markup, /role="gridcell"/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
