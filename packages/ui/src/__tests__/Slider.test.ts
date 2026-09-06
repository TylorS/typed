import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Slider from "../Slider.js";

describe("typed/ui/Slider", () => {
  it("hydrates a value on the native range control", () =>
    Effect.gen(function* () {
      const state = yield* Slider.makeState({ value: 5 });
      const markup = yield* renderToHtmlString(Slider.Slider({ state, min: 0, max: 10, step: 1 }));

      assert.strictEqual(RefSubject.isHydrationRef(state), true);
      assert.match(markup, /<input type="range"/);
      assert.match(markup, /value="5"/);
      assert.match(markup, /min="0"/);
      assert.match(markup, /max="10"/);
      assert.match(markup, /step="1"/);
      assert.match(markup, /data-typed-refsubject=/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
