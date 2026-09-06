import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Disclosure from "../Disclosure.js";

describe("typed/ui/Disclosure in Chromium", () => {
  it("synchronizes its hydrated state from the native details toggle", async () => {
    document.body.replaceChildren();

    await Effect.gen(function* () {
      const state = yield* Disclosure.makeState({ open: true });
      const [root] = yield* render(
        Disclosure.Content({
          state,
          content: html`${Disclosure.Button({ content: "More" })}<p>Details</p>`,
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const details = root as HTMLDetailsElement;

      yield* Effect.yieldNow;
      assert.strictEqual(details.open, true);
      details.querySelector("summary")!.click();
      yield* Effect.sleep(0);

      assert.strictEqual(details.open, false);
      assert.strictEqual((yield* state).open, false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
