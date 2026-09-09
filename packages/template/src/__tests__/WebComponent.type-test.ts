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
  attributes: {
    count: Schema.FiniteFromString.pipe(Schema.withDecodingDefaultTypeKey(Effect.succeed(0))),
  },
  render: (props) => {
    expectTypeOf(props).toEqualTypeOf<{ readonly count: RefSubject.Computed<number> }>();
    return html`<p>${props.count}${Service}${Effect.fail("failure" as const)}</p>`;
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

const required = WebComponent.make({
  name: "typed-required-inputs",
  attributes: {
    count: Schema.FiniteFromString,
    label: Schema.optionalKey(Schema.String),
    ".user": Schema.Struct({ name: Schema.String }),
    ".items": Schema.Array(Schema.Finite).pipe(Schema.withConstructorDefault(Effect.succeed([]))),
  },
  render: ({ count, label, user, items }) => {
    expectTypeOf(count).toEqualTypeOf<RefSubject.Computed<number>>();
    expectTypeOf(label).toEqualTypeOf<RefSubject.Computed<string | undefined>>();
    expectTypeOf(user).toEqualTypeOf<RefSubject.Computed<{ readonly name: string }>>();
    expectTypeOf(items).toEqualTypeOf<RefSubject.Computed<readonly number[]>>();
    // @ts-expect-error Render inputs are read-only.
    void RefSubject.set(count, 1);
    return html`${count}${label}`;
  },
});
WebComponent.server(required, { count: 1, user: { name: "Ada" } });
// @ts-expect-error Required fields cannot be omitted.
WebComponent.server(required);
// @ts-expect-error A required property cannot be omitted.
WebComponent.server(required, { count: 1 });
WebComponent.make({
  name: "typed-invalid-encoded-type",
  // @ts-expect-error Non-string values belong in dot properties.
  attributes: { count: Schema.Finite },
  render: () => "",
});
