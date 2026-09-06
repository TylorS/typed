import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as TreeGrid from "../TreeGrid.js";

describe("typed/ui/TreeGrid in browsers", () => {
  it("sets the first visible cell as active on initial focus", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* TreeGrid.makeState();
      const collection = yield* TreeGrid.makeCollection();
      yield* render(
        TreeGrid.Root({
          state,
          collection,
          label: "Files",
          content: TreeGrid.Row({
            state,
            rowId: "root",
            content: TreeGrid.Cell({
              state,
              collection,
              id: "root-name",
              rowId: "root",
              columnIndex: 1,
              content: "Root",
            }),
          }),
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      (document.querySelector('[role="treegrid"]') as HTMLDivElement).focus();
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).activeId, "root-name");
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("expands a parent row with Right Arrow", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* TreeGrid.makeState({ activeId: "root-name" });
      const collection = yield* TreeGrid.makeCollection();
      yield* render(
        TreeGrid.Root({
          state,
          collection,
          label: "Files",
          content: [
            TreeGrid.Row({
              state,
              rowId: "root",
              hasChildren: true,
              content: [
                TreeGrid.Cell({
                  state,
                  collection,
                  id: "root-name",
                  rowId: "root",
                  columnIndex: 1,
                  hasChildren: true,
                  content: "Root",
                }),
                TreeGrid.Cell({
                  state,
                  collection,
                  id: "root-size",
                  rowId: "root",
                  columnIndex: 2,
                  hasChildren: true,
                  content: "1 KB",
                }),
              ],
            }),
            TreeGrid.Group({
              state,
              parentId: "root",
              content: TreeGrid.Row({
                state,
                rowId: "child",
                parentId: "root",
                content: [
                  TreeGrid.Cell({
                    state,
                    collection,
                    id: "child-name",
                    rowId: "child",
                    parentId: "root",
                    columnIndex: 1,
                    content: "Child",
                  }),
                  TreeGrid.Cell({
                    state,
                    collection,
                    id: "child-size",
                    rowId: "child",
                    parentId: "root",
                    columnIndex: 2,
                    content: "2 KB",
                  }),
                ],
              }),
            }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      yield* Effect.sleep(0);
      const grid = document.querySelector('[role="treegrid"]') as HTMLDivElement;

      grid.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      yield* Effect.sleep(25);
      assert.deepEqual((yield* state).expandedIds, ["root"]);

      grid.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      yield* Effect.sleep(25);
      assert.strictEqual((yield* state).activeId, "child-name");
      assert.strictEqual(document.querySelector("#child-name")?.hasAttribute("data-active"), true);
      assert.strictEqual(document.querySelector("#root-name")?.hasAttribute("data-active"), false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
