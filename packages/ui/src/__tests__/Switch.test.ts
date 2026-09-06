import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Switch from "../Switch.js";

describe("typed/ui/Switch", () => {
  it("hydrates checked state onto a native button host", () =>
    Effect.gen(function* () {
      const state = yield* Switch.makeState({ checked: true });
      const markup = yield* renderToHtmlString(Switch.Switch({ state, content: "Notifications" }));

      assert.strictEqual(RefSubject.isHydrationRef(state), true);
      assert.match(markup, /<button /);
      assert.match(markup, /role="switch"/);
      assert.match(markup, /aria-checked="true"/);
      assert.match(markup, /data-typed-refsubject=/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
