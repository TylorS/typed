import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as SpinButton from "../SpinButton.js";

describe("typed/ui/SpinButton", () => {
  it("hydrates a value on the native number input", () =>
    Effect.gen(function* () {
      const state = yield* SpinButton.makeState({ value: 12 });
      const markup = yield* renderToHtmlString(
        SpinButton.SpinButton({ state, min: 0, max: 60, step: 1 }),
      );

      assert.strictEqual(RefSubject.isHydrationRef(state), true);
      assert.match(markup, /<input type="number"/);
      assert.match(markup, /value="12"/);
      assert.match(markup, /min="0"/);
      assert.match(markup, /max="60"/);
      assert.match(markup, /step="1"/);
      assert.match(markup, /data-typed-refsubject=/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
