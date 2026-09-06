import { Fx, RefSubject } from "@typed/fx";
import { Context, Effect, Layer, Schema, Scope } from "effect";
import { expectTypeOf } from "vitest";
import { html, type RenderTemplate } from "../RenderTemplate.js";
import { renderToHtmlString } from "../Html.js";
import * as WebComponent from "../WebComponent.js";
import type { HtmlRenderEvent } from "../RenderEvent.js";

const Service = Context.Service<{ readonly value: string }>("WebComponentTypes");
const definition = WebComponent.make({
  name: "typed-type-check",
  defaults: () => ({ count: 0 }),
  attributes: Schema.Struct({ count: Schema.FiniteFromString }),
  render: (props) => {
    expectTypeOf(props).toEqualTypeOf<RefSubject.Computed<{ count: number }>>();
    return html`<p>
      ${RefSubject.map(props, (value) => value.count)}${Service}${Effect.fail("failure" as const)}
    </p>`;
  },
});
expectTypeOf(WebComponent.register(definition)).toEqualTypeOf<
  Layer.Layer<never, WebComponent.RegistrationError, (typeof Service)["Identifier"]>
>();
expectTypeOf(WebComponent.server(definition)).toEqualTypeOf<
  Fx.Fx<HtmlRenderEvent, "failure", (typeof Service)["Identifier"] | RenderTemplate | Scope.Scope>
>();
expectTypeOf(renderToHtmlString(WebComponent.server(definition))).toEqualTypeOf<
  Effect.Effect<string, "failure", (typeof Service)["Identifier"] | RenderTemplate | Scope.Scope>
>();

const SlotService = Context.Service<{ readonly value: number }>("WebComponentSlotTypes");
const children = html`<span>${SlotService}${Effect.fail("slot failure" as const)}</span>`;

expectTypeOf(WebComponent.server(definition, {}, children)).toEqualTypeOf<
  Fx.Fx<
    HtmlRenderEvent,
    "failure" | "slot failure",
    | (typeof Service)["Identifier"]
    | (typeof SlotService)["Identifier"]
    | RenderTemplate
    | Scope.Scope
  >
>();

declare const element: WebComponent.Element<{ count: number }>;
element.props = { count: 1 };
// @ts-expect-error Element properties retain the declared value type.
element.props = { count: "wrong" };
// @ts-expect-error Server properties retain the declared value type.
void WebComponent.server(definition, { count: "wrong" });
