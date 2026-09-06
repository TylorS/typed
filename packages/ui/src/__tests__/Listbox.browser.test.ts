import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Listbox from "../Listbox.js";

describe("typed/ui/Listbox in browsers", () => {
  it("moves selection with printable-key typeahead", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Listbox.makeState({ value: "apple", activeId: "apple" });
      const collection = yield* Listbox.makeCollection();
      yield* render(
        Listbox.Root({
          state,
          collection,
          content: [
            Listbox.Option({ state, collection, id: "apple", value: "apple", content: "Apple" }),
            Listbox.Option({ state, collection, id: "banana", value: "banana", content: "Banana" }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      (document.querySelector("#apple") as HTMLDivElement).focus();
      document
        .querySelector("#apple")
        ?.dispatchEvent(new KeyboardEvent("keydown", { key: "b", bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).activeId, "banana");
      assert.strictEqual((yield* state).value, "banana");
      assert.strictEqual(document.activeElement?.id, "banana");
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("focuses its first enabled option when the unselected listbox receives focus", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Listbox.makeState();
      const collection = yield* Listbox.makeCollection();
      yield* render(
        Listbox.Root({
          state,
          collection,
          content: [
            Listbox.Option({ state, collection, id: "first", value: "first", content: "First" }),
            Listbox.Option({ state, collection, id: "second", value: "second", content: "Second" }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const listbox = document.querySelector('[role="listbox"]') as HTMLDivElement;
      listbox.focus();
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).activeId, "first");
      assert.strictEqual(document.activeElement?.id, "first");
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("moves through mounted enabled options in DOM order", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Listbox.makeState({ value: "first", activeId: "first" });
      const collection = yield* Listbox.makeCollection();
      yield* render(
        Listbox.Root({
          state,
          collection,
          content: [
            Listbox.Option({ state, collection, id: "first", value: "first", content: "First" }),
            Listbox.Option({
              state,
              collection,
              id: "skip",
              value: "skip",
              disabled: true,
              content: "Skip",
            }),
            Listbox.Option({ state, collection, id: "second", value: "second", content: "Second" }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const first = document.querySelector("#first") as HTMLDivElement;
      const second = document.querySelector("#second") as HTMLDivElement;
      first.focus();
      first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).activeId, "second");
      assert.strictEqual((yield* state).value, "second");
      assert.strictEqual(document.activeElement, second);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
