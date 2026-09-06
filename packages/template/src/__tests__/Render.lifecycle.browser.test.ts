import * as Effect from "effect/Effect";
import { Fx, RefSubject } from "@typed/fx";
import { assert, describe, it } from "vitest";
import { DomRenderTemplate, html, render } from "../index.js";

describe("DOM render lifecycle", () => {
  it("keeps a static event handler alive after the first render emission", async () => {
    document.body.replaceChildren();
    let clicks = 0;

    await Effect.gen(function* () {
      yield* render(
        html`<button type="button" onclick=${Effect.sync(() => clicks++)}>increment</button>`,
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const button = document.querySelector("button");
      assert.instanceOf(button, HTMLButtonElement);
      button.click();
      yield* Effect.sleep(0);
      assert.strictEqual(clicks, 1);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("initializes nested dynamic content before the first render emission", async () => {
    document.body.replaceChildren();

    await Effect.gen(function* () {
      const clicks = yield* RefSubject.make(0);

      yield* render(
        html`<main>
          ${html`<button type="button" onclick=${RefSubject.update(clicks, (count) => count + 1)}>
            increment
          </button>`}
        </main>`,
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const button = document.querySelector("button");
      assert.instanceOf(button, HTMLButtonElement);

      button.click();
      yield* Effect.sleep(0);
      assert.strictEqual(yield* clicks, 1);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("keeps every handler in an array render alive after the first emission", async () => {
    document.body.replaceChildren();
    const clicks = [0, 0];

    await Effect.gen(function* () {
      yield* render(
        [
          html`<button type="button" onclick=${Effect.sync(() => clicks[0]++)}>first</button>`,
          html`<button type="button" onclick=${Effect.sync(() => clicks[1]++)}>second</button>`,
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const buttons = document.querySelectorAll("button");
      assert.strictEqual(buttons.length, 2);
      buttons[0]!.click();
      buttons[1]!.click();
      yield* Effect.sleep(0);
      assert.deepStrictEqual(clicks, [1, 1]);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("keeps spread handlers alive in an array render", async () => {
    document.body.replaceChildren();
    const inputs = ["", ""];

    await Effect.gen(function* () {
      yield* render(
        [
          html`<input
            ...${{
              oninput: Effect.sync(() => (inputs[0] = "first")),
            }}
          />`,
          html`<input
            ...${{
              oninput: Effect.sync(() => (inputs[1] = "second")),
            }}
          />`,
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const elements = document.querySelectorAll("input");
      assert.strictEqual(elements.length, 2);
      elements[0]!.dispatchEvent(new Event("input", { bubbles: true }));
      elements[1]!.dispatchEvent(new Event("input", { bubbles: true }));
      yield* Effect.sleep(0);
      assert.deepStrictEqual(inputs, ["first", "second"]);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
