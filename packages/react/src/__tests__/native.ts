import * as Layer from "effect/Layer";
import { RandomValues } from "@typed/id/RandomValues";
import * as Effect from "effect/Effect";
import * as Fx from "@typed/fx/Fx";
import * as Render from "@typed/template/Render";
import * as Html from "@typed/template/Html";
import type { Renderable } from "@typed/template/Renderable";

/** Test harnesses use Typed's existing renderer layers and retain caller-owned DOM scopes. */
export function render<T extends Renderable.Any>(value: T, target: HTMLElement) {
  return Render.render(value, target).pipe(
    Fx.provide(Layer.merge(Render.DomRenderTemplate, RandomValues.Default)),
  );
}
export function renderToHtmlString<T extends Renderable.Any>(value: T) {
  return Html.renderToHtmlString(value).pipe(
    Effect.provide(Layer.merge(Html.HtmlRenderTemplate, RandomValues.Default)),
    Effect.scoped,
  );
}
