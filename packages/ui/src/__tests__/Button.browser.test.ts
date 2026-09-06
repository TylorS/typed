import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Button from "../Button.js";

describe("typed/ui/Button in Chromium", () => {
  it("runs its click handler exactly once", async () => {
    document.body.replaceChildren();
    let clicks = 0;

    await Effect.gen(function* () {
      const [root] = yield* render(
        Button.Button({
          content: "Save",
          onclick: Effect.sync(() => clicks++),
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      assert.instanceOf(root, HTMLButtonElement);
      root.click();
      yield* Effect.yieldNow;

      assert.strictEqual(clicks, 1);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
