import { Effect } from "effect";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Carousel from "../Carousel.js";

describe("typed/ui/Carousel", () => {
  it("hydrates active-slide state on the carousel region", () =>
    Effect.gen(function* () {
      const state = yield* Carousel.makeState({ activeId: "first" });
      const markup = yield* renderToHtmlString(
        Carousel.Root({
          state,
          label: "Featured stories",
          content: [
            Carousel.Slide({ state, id: "first", label: "1 of 2", content: "First" }),
            Carousel.Slide({ state, id: "second", label: "2 of 2", content: "Second" }),
          ],
        }),
      );

      assert.match(markup, /role="region"/);
      assert.match(markup, /aria-roledescription="carousel"/);
      assert.match(markup, /aria-label="Featured stories"/);
      assert.match(markup, /data-typed-refsubject=/);
      assert.match(markup, /aria-roledescription="slide"/);
      assert.match(markup, /id="second"/);
      assert.match(markup, /hidden/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
