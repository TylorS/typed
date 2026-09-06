import { Effect } from "effect";
import { renderToHtmlString, StaticHtmlRenderTemplate } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Focusable from "../Focusable.js";
import * as Group from "../Group.js";
import * as Heading from "../Heading.js";
import * as Separator from "../Separator.js";
import * as VisuallyHidden from "../VisuallyHidden.js";

describe("typed/ui thin hosts", () => {
  it("renders their native semantic defaults", () =>
    renderToHtmlString([
      Focusable.Focusable({ content: "Focus" }),
      Heading.Heading({
        content: "Title",
      }),
      Group.Group({ content: "Fields" }),
      Separator.Separator({}),
      VisuallyHidden.VisuallyHidden({
        content: "Only for screen readers",
      }),
    ]).pipe(
      Effect.provide(StaticHtmlRenderTemplate),
      Effect.scoped,
      Effect.tap((markup) =>
        Effect.sync(() => {
          assert.match(markup, /tabindex="0"/);
          assert.match(markup, /role="heading"/);
          assert.match(markup, /aria-level="1"/);
          assert.match(markup, /role="group"/);
          assert.match(markup, /role="separator"/);
          assert.match(markup, /aria-orientation="horizontal"/);
          assert.match(markup, /clip:rect\(0 0 0 0\)/);
        }),
      ),
      Effect.runPromise,
    ));
});
