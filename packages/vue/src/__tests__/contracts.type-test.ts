import * as Fx from "@typed/fx/Fx";
import { html } from "@typed/template/RenderTemplate";
import { HtmlRenderTemplate, renderToHtml, renderToHtmlString } from "@typed/template/Html";
import { render } from "@typed/template/Render";
import type { RenderTemplate } from "@typed/template/RenderTemplate";
import { type RenderEvent } from "@typed/template/RenderEvent";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import type * as Scope from "effect/Scope";
import { defineComponent, h, type FunctionalComponent } from "vue";
import { expectTypeOf } from "vitest";
import { createTypedComponent } from "../Typed.js";
import { view, VueError } from "../view.js";

class Required extends Context.Service<Required, { readonly label: string }>()("Required") {}
const Component = defineComponent({
  props: { label: { type: String, required: true } },
  setup: (p) => () => h("p", p.label),
});
const props: Effect.Effect<{ label: string }, "failed", Required> = Effect.map(
  Required,
  (service) => ({ label: service.label }),
);
const component = view(Component, props, { id: "vue-contracts-1" });
expectTypeOf(component).toEqualTypeOf<
  Fx.Fx<RenderEvent, "failed" | VueError, Required | Scope.Scope | RenderTemplate>
>();
expectTypeOf(renderToHtmlString(component)).toEqualTypeOf<
  Effect.Effect<string, "failed" | VueError, Required | Scope.Scope | RenderTemplate>
>();
expectTypeOf(renderToHtml(component)).toEqualTypeOf<
  Fx.Fx<string, "failed" | VueError, Required | Scope.Scope | RenderTemplate>
>();
const nativeDom = render(component, document.body);
expectTypeOf<Fx.Fx.Services<typeof nativeDom>>().toEqualTypeOf<
  Required | Scope.Scope | RenderTemplate
>();
const serviceFree = renderToHtmlString(view(Component, { label: "direct" }, { id: "direct" }));
expectTypeOf(serviceFree).toEqualTypeOf<
  Effect.Effect<string, VueError, Scope.Scope | RenderTemplate>
>();
Effect.runPromise(serviceFree.pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped));
// @ts-expect-error Required props cannot be omitted.
view(Component, {}, { id: "vue-contracts-2" });
// @ts-expect-error Prop type cannot be widened by the props argument.
view(Component, { label: 42 }, { id: "vue-contracts-3" });
const Functional: FunctionalComponent<{ amount: number }> = (p) => h("p", p.amount);
view(Functional, { amount: 1 }, { id: "vue-contracts-4" });
// @ts-expect-error Functional component props retain their declared type.
view(Functional, { amount: "wrong" }, { id: "vue-contracts-5" });
const runtime = ManagedRuntime.make(Layer.empty);
const Typed = createTypedComponent(runtime);
h(Typed, { value: html`<p>Hello</p>` });

// @ts-expect-error An explicitly bound empty runtime cannot satisfy Required.
h(Typed, { value: html`<p>${Effect.map(Required, (service) => service.label)}</p>` });

// @ts-expect-error Foreign app roots require an explicit stable, page-unique ID.
view(Component, { label: "missing id" });
