import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Popover from "../Popover.js";

describe("typed/ui/Popover", () => {
  it("hydrates open state on the native popover host", () =>
    Effect.gen(function* () {
      const state = yield* Popover.makeState();
      const markup = yield* renderToHtmlString(Popover.Content({ state, content: "Body" }));

      assert.strictEqual(RefSubject.isHydrationRef(state), true);
      assert.match(markup, /popover="manual"/);
      assert.match(markup, /data-typed-refsubject=/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
