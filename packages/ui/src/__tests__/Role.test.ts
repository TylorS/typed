import { Effect } from "effect";
import { html, renderToHtmlString, StaticHtmlRenderTemplate } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Role from "../Role.js";

describe("typed/ui/Role", () => {
  it("renders a semantic div and allows a host override", () => {
    const component = Role.Role(
      { role: "status", content: "Saved" },
      (props, content) => {
        assert.strictEqual(props.role, "status");
        return html`<div role=${props.role}>${content}</div>`;
      },
    );

    return renderToHtmlString(component).pipe(
      Effect.provide(StaticHtmlRenderTemplate),
      Effect.scoped,
      Effect.tap((markup) =>
        Effect.sync(() => assert.strictEqual(markup, '<div role="status">Saved</div>')),
      ),
      Effect.runPromise,
    );
  });
});
