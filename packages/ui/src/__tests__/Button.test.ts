import { Effect } from "effect";
import { Fx } from "@typed/fx";
import {
  DomRenderTemplate,
  html,
  render,
  renderToHtmlString,
  StaticHtmlRenderTemplate,
} from "@typed/template";
import { Window } from "happy-dom";
import { assert, describe, it } from "vitest";
import * as Button from "../Button.js";

describe("typed/ui/Button", () => {
  it("renders a native button with the safe button default", () =>
    renderToHtmlString(Button.Button({ content: "Save" })).pipe(
      Effect.provide(StaticHtmlRenderTemplate),
      Effect.scoped,
      Effect.map((markup) => {
        assert.strictEqual(markup, '<button type="button">Save</button>');
      }),
      Effect.runPromise,
    ));

  it("uses defaults for explicit nullish options", () =>
    renderToHtmlString(Button.Button({ content: "Save", type: null, disabled: null })).pipe(
      Effect.provide(StaticHtmlRenderTemplate),
      Effect.scoped,
      Effect.map((markup) => {
        assert.strictEqual(markup, '<button type="button">Save</button>');
      }),
      Effect.runPromise,
    ));

  it("renders a reactive disabled state as a native boolean attribute", () => {
    const window = new Window() as unknown as globalThis.Window & typeof globalThis;

    return Effect.gen(function* () {
      const [root] = yield* render(
        Button.Button({ content: "Wait", disabled: Effect.succeed(true) }),
        window.document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const button = root as HTMLButtonElement;
      assert.strictEqual(button.tagName, "BUTTON");
      assert.strictEqual(button.disabled, true);
      assert.strictEqual(button.hasAttribute("disabled"), true);
    }).pipe(
      Effect.provide(DomRenderTemplate.using(window.document)),
      Effect.scoped,
      Effect.runPromise,
    );
  });

  it("passes merged props and content to a custom host", () => {
    let receivedType: unknown;
    let receivedContent: unknown;

    const component = Button.Button(
      {
        content: "Hosted",
        type: "submit",
        props: { id: "save" },
      },
      (props, content) => {
        receivedType = props.type;
        receivedContent = content;
        return html`<span data-host=${props.type}>${content}</span>`;
      },
    );

    assert.strictEqual(receivedType, "submit");
    assert.strictEqual(receivedContent, "Hosted");

    return renderToHtmlString(component).pipe(
      Effect.provide(StaticHtmlRenderTemplate),
      Effect.scoped,
      Effect.map((markup) => {
        assert.strictEqual(markup, '<span data-host="submit">Hosted</span>');
      }),
      Effect.runPromise,
    );
  });
});
