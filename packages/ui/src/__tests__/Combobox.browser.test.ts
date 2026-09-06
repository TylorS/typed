import { Effect } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { assert, describe, it, vi } from "vitest";
import * as Combobox from "../Combobox.js";

describe("typed/ui/Combobox in browsers", () => {
  it("activates the matching option when its popover opens", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Combobox.makeState({ id: "search", value: "Two" });
      const collection = yield* Combobox.makeCollection();
      yield* render(
        [
          Combobox.Input({ state, collection }),
          Combobox.Popover({
            state,
            collection,
            content: [
              Combobox.Item({ state, collection, id: "one", value: "One", content: "One" }),
              Combobox.Item({ state, collection, id: "two", value: "Two", content: "Two" }),
            ],
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const input = document.querySelector("input") as HTMLInputElement;
      input.focus();
      yield* Effect.promise(() => vi.waitFor(() => {
        assert.strictEqual(input.getAttribute("aria-activedescendant"), "two");
        assert.strictEqual(document.activeElement, input);
      }));
      assert.strictEqual((yield* state).activeId, "two");
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("keeps input focus while navigating active options", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Combobox.makeState({ id: "search" });
      const collection = yield* Combobox.makeCollection();
      yield* render(
        [
          Combobox.Input({ state, collection }),
          Combobox.Popover({
            state,
            content: [
              Combobox.Item({ state, collection, id: "one", value: "One", content: "One" }),
              Combobox.Item({ state, collection, id: "two", value: "Two", content: "Two" }),
            ],
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const input = document.querySelector("input") as HTMLInputElement;
      input.focus();
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).activeId, "one");
      assert.strictEqual(document.activeElement, input);
      assert.strictEqual(input.getAttribute("aria-activedescendant"), "one");

      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).activeId, "one");

      const enter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
      input.dispatchEvent(enter);
      yield* Effect.sleep(0);
      assert.strictEqual(enter.defaultPrevented, true);
      assert.strictEqual((yield* state).value, "One");
      assert.strictEqual((yield* state).open, false);

      input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).open, true);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("skips options hidden by the current query", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Combobox.makeState({ id: "search" });
      const collection = yield* Combobox.makeCollection();
      const hiddenWhenNotMatching = (value: string) =>
        RefSubject.map(state, (current) => !value.startsWith(current.value));
      yield* render(
        [
          Combobox.Input({ state, collection }),
          Combobox.Popover({
            state,
            collection,
            content: [
              Combobox.Item({
                state,
                collection,
                id: "apple",
                value: "apple",
                content: "Apple",
                props: { "?hidden": hiddenWhenNotMatching("apple") },
              }),
              Combobox.Item({
                state,
                collection,
                id: "banana",
                value: "banana",
                content: "Banana",
                props: { "?hidden": hiddenWhenNotMatching("banana") },
              }),
            ],
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const input = document.querySelector("input") as HTMLInputElement;
      input.value = "b";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      yield* Effect.sleep(0);
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).activeId, "banana");
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
