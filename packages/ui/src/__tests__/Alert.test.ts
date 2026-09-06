import { Effect } from "effect";
import { renderToHtmlString, StaticHtmlRenderTemplate } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Alert from "../Alert.js";

describe("typed/ui/Alert", () => {
  it("renders a non-focus-stealing live alert region", () =>
    renderToHtmlString(Alert.Alert({ content: "Saved" })).pipe(
      Effect.provide(StaticHtmlRenderTemplate),
      Effect.scoped,
      Effect.tap((markup) =>
        Effect.sync(() => {
          assert.strictEqual(markup, '<div role="alert">Saved</div>');
        }),
      ),
      Effect.runPromise,
    ));
});
