import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Grid from "../Grid.js";

describe("typed/ui/Grid in browsers", () => {
  it("sets the first cell as active when an uninitialized grid receives focus", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Grid.makeState();
      const collection = yield* Grid.makeCollection();
      yield* render(
        Grid.Root({
          state,
          collection,
          label: "Invoices",
          content: Grid.Row({
            content: Grid.Cell({
              state,
              collection,
              id: "a1",
              rowId: "a",
              columnIndex: 1,
              content: "A1",
            }),
          }),
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      (document.querySelector('[role="grid"]') as HTMLDivElement).focus();
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).activeId, "a1");
      assert.strictEqual(
        document.querySelector('[role="grid"]')?.getAttribute("aria-activedescendant"),
        "a1",
      );
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("moves virtual focus through columns and rows", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Grid.makeState({ activeId: "a1" });
      const collection = yield* Grid.makeCollection();
      yield* render(
        Grid.Root({
          state,
          collection,
          label: "Invoices",
          content: [
            Grid.Row({
              content: [
                Grid.Cell({
                  state,
                  collection,
                  id: "a1",
                  rowId: "a",
                  columnIndex: 1,
                  content: "A1",
                }),
                Grid.Cell({
                  state,
                  collection,
                  id: "a2",
                  rowId: "a",
                  columnIndex: 2,
                  content: "A2",
                }),
              ],
            }),
            Grid.Row({
              content: [
                Grid.Cell({
                  state,
                  collection,
                  id: "b1",
                  rowId: "b",
                  columnIndex: 1,
                  content: "B1",
                }),
                Grid.Cell({
                  state,
                  collection,
                  id: "b2",
                  rowId: "b",
                  columnIndex: 2,
                  content: "B2",
                }),
              ],
            }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      yield* Effect.sleep(50);
      const grid = document.querySelector('[role="grid"]') as HTMLDivElement;
      assert.deepEqual(
        Array.from(document.querySelectorAll('[role="gridcell"]'), (cell) => cell.id),
        ["a1", "a2", "b1", "b2"],
      );
      assert.deepEqual(
        (yield* collection).map((item) => item.id),
        ["a1", "a2", "b1", "b2"],
      );
      assert.deepEqual(
        (yield* collection).map((item) => item.value),
        [
          { rowId: "a", columnIndex: 1 },
          { rowId: "a", columnIndex: 2 },
          { rowId: "b", columnIndex: 1 },
          { rowId: "b", columnIndex: 2 },
        ],
      );

      grid.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      yield* Effect.sleep(25);
      assert.strictEqual((yield* state).activeId, "a2");
      assert.strictEqual(document.querySelector("#a2")?.hasAttribute("data-active"), true);
      assert.strictEqual(document.querySelector("#a1")?.hasAttribute("data-active"), false);

      grid.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      yield* Effect.sleep(25);
      assert.strictEqual((yield* state).activeId, "b2");
      assert.strictEqual(document.querySelector("#b2")?.hasAttribute("data-active"), true);
      assert.strictEqual(document.querySelector("#a2")?.hasAttribute("data-active"), false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
