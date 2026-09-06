import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { HtmlRenderTemplate, html, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Disclosure from "../Disclosure.js";

describe("typed/ui/Disclosure", () => {
  it("renders a native details host with a summary button", () =>
    Effect.gen(function* () {
      const state = yield* Disclosure.makeState({ open: true });
      const markup = yield* renderToHtmlString(
        Disclosure.Content({
          state,
          content: html`${Disclosure.Button({ content: "More" })}
            <p>Details</p>`,
        }),
      );

      assert.strictEqual(RefSubject.isHydrationRef(state), true);
      assert.match(markup, /<details data-typed-refsubject=/);
      assert.match(markup, /<summary><!--n_1-->More/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
