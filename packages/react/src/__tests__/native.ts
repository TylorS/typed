import * as Effect from "effect/Effect";
import * as Fx from "@typed/fx/Fx";
import * as Render from "@typed/template/Render";
import * as Html from "@typed/template/Html";
import type { Renderable } from "@typed/template/Renderable";

/** Test harnesses use Typed's existing renderer layers and retain caller-owned DOM scopes. */
export function render<T extends Renderable.Any>(value: T, target: HTMLElement) {
  return Render.render(value, target).pipe(Fx.provide(Render.DomRenderTemplate));
}
export function renderToHtmlString<T extends Renderable.Any>(value: T) {
  return Html.renderToHtmlString(value).pipe(
    Effect.provide(Html.HtmlRenderTemplate),
    Effect.scoped,
  );
}
