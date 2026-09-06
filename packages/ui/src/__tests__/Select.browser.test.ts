import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { assert, describe, it, vi } from "vitest";
import * as Select from "../Select.js";

describe("typed/ui/Select in browsers", () => {
  it("opens from its trigger with ArrowDown", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Select.makeState({ id: "size", value: "small" });
      const collection = yield* Select.makeCollection();
      yield* render(
        [
          Select.Trigger({ state, content: "Size" }),
          Select.Content({
            state,
            collection,
            content: [
              Select.Option({ state, collection, id: "small", value: "small", content: "Small" }),
              Select.Option({ state, collection, id: "large", value: "large", content: "Large" }),
            ],
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const trigger = document.querySelector("button") as HTMLButtonElement;
      trigger.focus();
      trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).open, true);
      assert.strictEqual(document.activeElement?.id, "small");
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("moves focus with printable-key typeahead", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Select.makeState({
        id: "size",
        value: "small",
        activeId: "small",
        open: true,
      });
      const collection = yield* Select.makeCollection();
      yield* render(
        Select.Content({
          state,
          collection,
          content: [
            Select.Option({ state, collection, id: "small", value: "small", content: "Small" }),
            Select.Option({
              state,
              collection,
              id: "large",
              value: "large",
              textValue: "Large",
              content: "Large",
            }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      (document.querySelector("#small") as HTMLDivElement).focus();
      document
        .querySelector("#small")
        ?.dispatchEvent(new KeyboardEvent("keydown", { key: "l", bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).activeId, "large");
      assert.strictEqual(document.activeElement?.id, "large");
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("focuses the selected option on open and restores its invoker on Escape", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Select.makeState({ id: "size", value: "small" });
      const collection = yield* Select.makeCollection();
      yield* render(
        [
          Select.Trigger({ state, content: "Size" }),
          Select.Content({
            state,
            collection,
            content: [
              Select.Option({ state, collection, id: "small", value: "small", content: "Small" }),
              Select.Option({ state, collection, id: "large", value: "large", content: "Large" }),
            ],
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const trigger = document.querySelector("button") as HTMLButtonElement;
      const small = document.querySelector("#small") as HTMLDivElement;
      const context = yield* Effect.context();
      trigger.click();
      yield* Effect.promise(() =>
        vi.waitFor(async () => {
          assert.strictEqual((await Effect.runPromiseWith(context)(state)).activeId, "small");
          assert.strictEqual(document.activeElement, small);
        }),
      );

      small.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      yield* Effect.promise(() =>
        vi.waitFor(async () => {
          assert.strictEqual((await Effect.runPromiseWith(context)(state)).open, false);
          assert.strictEqual(document.activeElement, trigger);
        }),
      );
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("moves focus without committing until Enter", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Select.makeState({
        id: "size",
        value: "small",
        activeId: "small",
        open: true,
      });
      const collection = yield* Select.makeCollection();
      yield* render(
        Select.Content({
          state,
          collection,
          content: [
            Select.Option({ state, collection, id: "small", value: "small", content: "Small" }),
            Select.Option({ state, collection, id: "large", value: "large", content: "Large" }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const small = document.querySelector("#small") as HTMLDivElement;
      const large = document.querySelector("#large") as HTMLDivElement;
      small.focus();
      small.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).activeId, "large");
      assert.strictEqual((yield* state).value, "small");
      assert.strictEqual(document.activeElement, large);

      large.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).value, "large");
      assert.strictEqual((yield* state).open, false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
