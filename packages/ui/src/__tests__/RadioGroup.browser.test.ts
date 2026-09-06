import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { assert, describe, it, vi } from "vitest";
import * as RadioGroup from "../RadioGroup.js";

describe("typed/ui/RadioGroup in Chromium", () => {
  it("synchronizes its hydrated value from a native radio change", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* RadioGroup.makeState({ value: "small" });
      yield* render(
        RadioGroup.Root({
          state,
          content: [
            RadioGroup.Item({ state, id: "small", value: "small", name: "size" }),
            RadioGroup.Item({ state, id: "large", value: "large", name: "size" }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const large = document.querySelector("#large") as HTMLInputElement;
      large.click();
      yield* Effect.sleep(0);

      assert.strictEqual(large.checked, true);
      assert.strictEqual((yield* state).value, "large");

      yield* RadioGroup.setValue(state, "small", "small");
      yield* Effect.promise(() =>
        vi.waitFor(() => {
          assert.strictEqual((document.querySelector("#small") as HTMLInputElement).checked, true);
          assert.strictEqual(large.checked, false);
        }),
      );
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});

describe("typed/ui/RadioGroup composite navigation", () => {
  it("moves selection and focus past disabled native radios", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* RadioGroup.makeState({ value: "small" });
      const collection = yield* RadioGroup.makeCollection();
      yield* render(
        RadioGroup.Root({
          state,
          collection,
          content: [
            RadioGroup.Item({ state, collection, id: "small", value: "small", name: "size" }),
            RadioGroup.Item({
              state,
              collection,
              id: "skip",
              value: "skip",
              name: "size",
              disabled: true,
            }),
            RadioGroup.Item({ state, collection, id: "large", value: "large", name: "size" }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const small = document.querySelector("#small") as HTMLInputElement;
      const large = document.querySelector("#large") as HTMLInputElement;
      small.focus();
      small.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).value, "large");
      assert.strictEqual((yield* state).activeId, "large");
      assert.strictEqual(document.activeElement, large);

      large.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).value, "small");
      assert.strictEqual((yield* state).activeId, "small");
      assert.strictEqual(document.activeElement, small);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
