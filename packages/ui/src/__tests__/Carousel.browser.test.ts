import { Effect } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Carousel from "../Carousel.js";

describe("typed/ui/Carousel in browsers", () => {
  it("selects the next registered slide through its native control", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Carousel.makeState({ activeId: "first" });
      const collection = yield* Carousel.makeCollection();
      yield* render(
        Carousel.Root({
          state,
          label: "Slides",
          content: [
            Carousel.Slide({ state, collection, id: "first", label: "1 of 2", content: "First" }),
            Carousel.Slide({ state, collection, id: "second", label: "2 of 2", content: "Second" }),
            Carousel.Next({ state, collection, content: "Next" }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      (document.querySelector("button") as HTMLButtonElement).click();
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).activeId, "second");
      assert.strictEqual((document.querySelector("#second") as HTMLDivElement).hidden, false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("pauses for focus and pauses only while the pointer remains over the carousel", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Carousel.makeState({ activeId: "first", paused: false });
      yield* render(
        Carousel.Root({ state, label: "Slides", content: "Slide", props: { tabindex: 0 } }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const carousel = document.querySelector('[aria-roledescription="carousel"]') as HTMLElement;

      carousel.focus();
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).paused, true);
      yield* RefSubject.update(state, (current) => ({ ...current, paused: false }));
      carousel.dispatchEvent(new MouseEvent("mouseenter"));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).paused, true);
      carousel.dispatchEvent(new MouseEvent("mouseleave"));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).paused, false);

      carousel.dispatchEvent(new MouseEvent("mouseenter"));
      carousel.dispatchEvent(new FocusEvent("focusin"));
      carousel.dispatchEvent(new MouseEvent("mouseleave"));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).paused, true);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
