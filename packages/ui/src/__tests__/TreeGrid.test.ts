import { Effect } from "effect";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as TreeGrid from "../TreeGrid.js";

describe("typed/ui/TreeGrid", () => {
  it("hydrates active-cell and expanded-row state on a treegrid", () =>
    Effect.gen(function* () {
      const state = yield* TreeGrid.makeState({ activeId: "root-name", expandedIds: ["root"] });
      const markup = yield* renderToHtmlString(
        TreeGrid.Root({
          state,
          label: "Files",
          content: TreeGrid.Row({
            state,
            rowId: "root",
            hasChildren: true,
            content: [
              TreeGrid.Cell({
                state,
                id: "root-name",
                rowId: "root",
                columnIndex: 1,
                hasChildren: true,
                content: "Root",
              }),
              TreeGrid.Cell({
                state,
                id: "root-size",
                rowId: "root",
                columnIndex: 2,
                content: "1 KB",
              }),
            ],
          }),
        }),
      );

      assert.match(markup, /role="treegrid"/);
      assert.match(markup, /aria-activedescendant="root-name"/);
      assert.match(markup, /data-typed-refsubject=/);
      assert.match(markup, /role="row"/);
      assert.match(markup, /aria-expanded="true"/);
      assert.match(markup, /role="gridcell"/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
