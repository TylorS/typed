import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Tabs from "../Tabs.js";

describe("typed/ui/Tabs in browsers", () => {
  it("automatically selects the next enabled tab and transfers focus", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Tabs.makeState({ selectedId: "one" });
      const collection = yield* Tabs.makeCollection();
      yield* render(
        Tabs.List({
          state,
          collection,
          content: [
            Tabs.Tab({ state, collection, id: "one", panelId: "one-panel", content: "One" }),
            Tabs.Tab({
              state,
              collection,
              id: "two",
              panelId: "two-panel",
              disabled: true,
              content: "Two",
            }),
            Tabs.Tab({ state, collection, id: "three", panelId: "three-panel", content: "Three" }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const one = document.querySelector("#one") as HTMLButtonElement;
      const three = document.querySelector("#three") as HTMLButtonElement;
      one.focus();
      one.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).activeId, "three");
      assert.strictEqual((yield* state).selectedId, "three");
      assert.strictEqual(document.activeElement, three);

      three.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).activeId, "one");
      assert.strictEqual((yield* state).selectedId, "one");
      assert.strictEqual(document.activeElement, one);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("keeps manual activation separate from focus movement", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Tabs.makeState({ selectedId: "one", activationMode: "manual" });
      const collection = yield* Tabs.makeCollection();
      yield* render(
        Tabs.List({
          state,
          collection,
          content: [
            Tabs.Tab({ state, collection, id: "one", panelId: "one-panel", content: "One" }),
            Tabs.Tab({ state, collection, id: "two", panelId: "two-panel", content: "Two" }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const one = document.querySelector("#one") as HTMLButtonElement;
      const two = document.querySelector("#two") as HTMLButtonElement;
      one.focus();
      one.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).activeId, "two");
      assert.strictEqual((yield* state).selectedId, "one");
      assert.strictEqual(document.activeElement, two);

      two.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).selectedId, "two");
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
