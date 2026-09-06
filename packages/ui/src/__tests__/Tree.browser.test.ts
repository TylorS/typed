import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Tree from "../Tree.js";

describe("typed/ui/Tree in browsers", () => {
  it("establishes an initial roving item and activates it with Enter", async () => {
    document.body.replaceChildren();
    let activations = 0;
    await Effect.gen(function* () {
      const state = yield* Tree.makeState();
      const collection = yield* Tree.makeCollection();
      yield* render(
        Tree.Root({
          state,
          collection,
          label: "Files",
          content: Tree.Item({
            state,
            collection,
            id: "root",
            content: "Root",
            onclick: Effect.sync(() => activations++),
          }),
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const tree = document.querySelector('[role="tree"]') as HTMLDivElement;

      tree.focus();
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).activeId, "root");
      assert.strictEqual(document.activeElement?.id, "root");
      document
        .querySelector("#root")
        ?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual(activations, 1);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("expands with Right Arrow and moves into the first child", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Tree.makeState({ activeId: "root" });
      const collection = yield* Tree.makeCollection();
      yield* render(
        Tree.Root({
          state,
          collection,
          label: "Files",
          content: Tree.Item({
            state,
            collection,
            id: "root",
            hasChildren: true,
            content: html`Root${Tree.Group({
              state,
              parentId: "root",
              content: Tree.Item({
                state,
                collection,
                id: "child",
                parentId: "root",
                content: "Child",
              }),
            })}`,
          }),
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const root = document.querySelector("#root") as HTMLDivElement;
      root.focus();
      root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      yield* Effect.sleep(0);
      assert.deepEqual((yield* state).expandedIds, ["root"]);

      root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).activeId, "child");
      assert.strictEqual(document.activeElement?.id, "child");
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
