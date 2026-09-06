import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Checkbox from "../Checkbox.js";

describe("typed/ui/Checkbox", () => {
  it("hydrates checkbox state and toggles mixed values to checked", () =>
    Effect.gen(function* () {
      const state = yield* Checkbox.makeState({ checked: "mixed" });

      assert.strictEqual(RefSubject.isHydrationRef(state), true);
      assert.strictEqual((yield* state).checked, "mixed");
      assert.strictEqual((yield* Checkbox.toggle(state)).checked, true);
    }).pipe(
      Effect.provideService(RefSubject.CurrentComputedBehavior, "one"),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("owns hydration on its native input", () =>
    Effect.gen(function* () {
      const state = yield* Checkbox.makeState({ checked: true });
      const markup = yield* renderToHtmlString(Checkbox.Input({ state }));

      assert.match(markup, /<input type="checkbox"/);
      assert.match(markup, /data-typed-refsubject=/);
    }).pipe(
      Effect.provide(HtmlRenderTemplate),
      Effect.scoped,
      Effect.runPromise,
    ));
});
