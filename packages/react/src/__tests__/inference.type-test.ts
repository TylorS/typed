import { RandomValues } from "@typed/id/RandomValues";
import { createElement } from "react";
import { Context, Effect, Layer, ManagedRuntime, Stream } from "effect";
import type { Scope } from "effect/Scope";
import { Fx } from "@typed/fx";
import type { RenderTemplate } from "@typed/template/RenderTemplate";
import type { RenderEvent } from "@typed/template/RenderEvent";
import { html } from "@typed/template";
import { renderToHtmlString } from "@typed/template/Html";
import { render } from "@typed/template/Render";
import { view, type ReactRenderError } from "../index.js";
import { Typed } from "../Typed.js";

class Service extends Context.Service<Service, { readonly label: string }>()("Service") {}
const Component = ({ label, count }: { label: string; count: number }) =>
  createElement("b", null, label, count);
const props = Effect.gen(function* () {
  const service = yield* Service;
  return { label: service.label, count: 1 };
});
const withError = Effect.andThen(props, (value) =>
  value.count > 0 ? Effect.succeed(value) : Effect.fail("bad" as const),
);
const inferred = view(Component, withError);
const expected: Fx.Fx<
  RenderEvent,
  "bad" | ReactRenderError,
  Service | Scope | RenderTemplate | RandomValues
> = inferred;
void expected;
view(Component, { label: "works", count: 1 }, { id: "react-inference-2" });
view(Component, Stream.succeed({ label: "works", count: 1 }), { id: "react-inference-3" });
view(Component, Fx.succeed({ label: "works", count: 1 }), { id: "react-inference-4" });
// @ts-expect-error required React prop count is missing
view(Component, { label: "missing" });
// @ts-expect-error prop type remains a number
view(Component, { label: "wrong", count: "one" }, { id: "react-inference-6" });
// @ts-expect-error producer output must satisfy component props
view(Component, Effect.succeed({ label: "missing" }), { id: "react-inference-7" });
const runtime = ManagedRuntime.make(Layer.succeed(Service, { label: "ok" }));
Typed({
  value: html`<p>${Effect.map(Service, (service) => service.label)}</p>`,
  runtime,
  onError: () => {},
});

const nodeView: Fx.Fx<RenderEvent, ReactRenderError, Scope | RenderTemplate | RandomValues> = view(
  "hello",
  {
    id: "node",
  },
);
view([createElement("b", { key: "b" }, "array"), null], { id: "array" });
view(null, { id: "empty" });
void nodeView;
view("automatic");
view("automatic with options", {});

// Native entry points retain the existing renderer and lifetime requirements.
const nativeHtml = renderToHtmlString(inferred);
const serviceFreeHtml: Effect.Effect<
  string,
  ReactRenderError,
  Scope | RenderTemplate | RandomValues
> = renderToHtmlString(view("plain", { id: "plain" }));
const nativeDom = render(inferred, document.body);
Typed({ value: html`<p>no renderer configuration</p>` });
void [nativeHtml, serviceFreeHtml, nativeDom];

type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const htmlRequirements: Equal<
  Effect.Services<typeof nativeHtml>,
  Service | Scope | RenderTemplate | RandomValues
> = true;
const domRequirements: Equal<
  Fx.Services<typeof nativeDom>,
  Service | Scope | RenderTemplate | RandomValues
> = true;
void [htmlRequirements, domRequirements];
