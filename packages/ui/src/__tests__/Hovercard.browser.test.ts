import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Hovercard from "../Hovercard.js";

describe("typed/ui/Hovercard in Chromium", () => {
  it("synchronizes its state from the native manual popover", async () => {
    document.body.replaceChildren();

    await Effect.gen(function* () {
      const state = yield* Hovercard.makeState({ id: "card" });
      yield* render(
        [
          Hovercard.Anchor({ state, content: "Account", hideDelay: 20 }),
          Hovercard.Content({
            state,
            label: "Account details",
            content: "Account details",
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const anchor = document.querySelector("span")!;
      const content = document.querySelector("[role=dialog]")!;

      anchor.dispatchEvent(new MouseEvent("mouseenter"));
      yield* Effect.sleep(0);
      assert.strictEqual(content.matches(":popover-open"), true);
      assert.strictEqual((yield* state).open, true);

      anchor.dispatchEvent(new MouseEvent("mouseleave"));
      content.dispatchEvent(new MouseEvent("mouseenter"));
      yield* Effect.sleep(30);
      assert.strictEqual(content.matches(":popover-open"), true);

      content.dispatchEvent(new MouseEvent("mouseleave"));
      yield* Effect.sleep(0);
      assert.strictEqual(content.matches(":popover-open"), false);
      assert.strictEqual((yield* state).open, false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("stays open while focus transfers into the hovercard", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Hovercard.makeState({ id: "card" });
      yield* render(
        [
          Hovercard.Anchor({ state, content: "Account", props: { tabindex: 0 } }),
          Hovercard.Content({
            state,
            label: "Account details",
            content: html`<button>Account details</button>`,
            props: { tabindex: 0 },
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const anchor = document.querySelector("span") as HTMLElement;
      const content = document.querySelector<HTMLElement>("[role=dialog]")!;
      const button = content.querySelector("button")!;

      anchor.focus();
      button.focus();
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).open, true);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("opens from keyboard focus and closes with Escape", async () => {
    document.body.replaceChildren();

    await Effect.gen(function* () {
      const state = yield* Hovercard.makeState({ id: "card" });
      yield* render(
        [
          Hovercard.Anchor({ state, content: "Account", props: { tabindex: 0 } }),
          Hovercard.Content({
            state,
            label: "Account details",
            content: "Account details",
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const anchor = document.querySelector("span")!;
      const content = document.querySelector<HTMLElement>("[role=dialog]")!;

      anchor.focus();
      yield* Effect.sleep(0);
      assert.strictEqual(content.matches(":popover-open"), true);

      anchor.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual(content.matches(":popover-open"), false);
      assert.strictEqual((yield* state).open, false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
