import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Tooltip from "../Tooltip.js";

describe("typed/ui/Tooltip in Chromium", () => {
  it("opens and closes its native popover from hover", async () => {
    document.body.replaceChildren();

    await Effect.gen(function* () {
      const state = yield* Tooltip.makeState({ id: "tip" });
      yield* render(
        [
          Tooltip.Anchor({ state, content: "Help", hideDelay: 20 }),
          Tooltip.Content({
            state,
            content: "Helpful text",
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const anchor = document.querySelector("span")!;
      const content = document.querySelector("[role=tooltip]")!;

      anchor.dispatchEvent(new MouseEvent("mouseenter"));
      yield* Effect.sleep(0);
      assert.strictEqual(content.matches(":popover-open"), true);

      anchor.dispatchEvent(new MouseEvent("mouseleave"));
      content.dispatchEvent(new MouseEvent("mouseenter"));
      yield* Effect.sleep(30);
      assert.strictEqual(content.matches(":popover-open"), true);

      content.dispatchEvent(new MouseEvent("mouseleave"));
      yield* Effect.sleep(0);
      assert.strictEqual(content.matches(":popover-open"), false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("opens from keyboard focus and closes with Escape", async () => {
    document.body.replaceChildren();

    await Effect.gen(function* () {
      const state = yield* Tooltip.makeState({ id: "tip" });
      yield* render(
        [
          Tooltip.Anchor({ state, content: "Help", props: { tabindex: 0 } }),
          Tooltip.Content({
            state,
            content: "Helpful text",
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const anchor = document.querySelector("span")!;
      const content = document.querySelector<HTMLElement>("[role=tooltip]")!;

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
