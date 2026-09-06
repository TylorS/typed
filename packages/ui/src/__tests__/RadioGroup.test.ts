import { Effect } from "effect";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as RadioGroup from "../RadioGroup.js";

describe("typed/ui/RadioGroup", () => {
  it("hydrates value state and renders native radio semantics", () =>
    Effect.gen(function* () {
      const state = yield* RadioGroup.makeState({ value: "small" });
      const markup = yield* renderToHtmlString(
        RadioGroup.Root({
          state,
          content: RadioGroup.Item({ state, id: "small", value: "small" }),
        }),
      );

      assert.match(markup, /role="radiogroup"/);
      assert.match(markup, /data-typed-refsubject=/);
      assert.match(markup, /role="radio"/);
      assert.match(markup, /aria-checked="true"/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
