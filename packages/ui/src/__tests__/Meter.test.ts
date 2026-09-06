import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Meter from "../Meter.js";

describe("typed/ui/Meter", () => {
  it("hydrates the value on a native meter", () =>
    Effect.gen(function* () {
      const state = yield* Meter.makeState({ value: 40 });
      const markup = yield* renderToHtmlString(
        Meter.Meter({ state, min: 0, max: 100, low: 25, high: 75 }),
      );

      assert.strictEqual(RefSubject.isHydrationRef(state), true);
      assert.match(markup, /<meter /);
      assert.match(markup, /value="40"/);
      assert.match(markup, /min="0"/);
      assert.match(markup, /max="100"/);
      assert.match(markup, /low="25"/);
      assert.match(markup, /high="75"/);
      assert.match(markup, /data-typed-refsubject=/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
