import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as WindowSplitter from "../WindowSplitter.js";

describe("typed/ui/WindowSplitter", () => {
  it("hydrates the primary-pane size onto a focusable separator", () =>
    Effect.gen(function* () {
      const state = yield* WindowSplitter.makeState({ value: 40 });
      const markup = yield* renderToHtmlString(
        WindowSplitter.WindowSplitter({
          state,
          primaryPaneId: "contents",
          label: "Table of contents",
        }),
      );

      assert.strictEqual(RefSubject.isHydrationRef(state), true);
      assert.match(markup, /role="separator"/);
      assert.match(markup, /aria-valuenow="40"/);
      assert.match(markup, /aria-valuemin="0"/);
      assert.match(markup, /aria-valuemax="100"/);
      assert.match(markup, /aria-controls="contents"/);
      assert.match(markup, /data-typed-refsubject=/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
