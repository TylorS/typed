import { map } from "effect/Effect";
import type { Scope } from "effect/Scope";
import * as Context from "effect/Context";
import type { Fx } from "@typed/fx/Fx";
import { unwrap } from "@typed/fx/Fx";
import type { Renderable } from "./Renderable.ts";
import type { RenderEvent } from "./RenderEvent.ts";

/**
 * A service that defines how templates are rendered.
 *
 * Different implementations can be provided for different environments (e.g., `DomRenderTemplate` for browsers,
 * `HtmlRenderTemplate` for SSR).
 *
 * @remarks
 * ## Why
 *
 * A normal Effect service separates template syntax from output medium. The
 * same `html` value can produce concrete DOM, streamed HTML, or hydration while
 * retaining its `E` and `R` channels.
 *
 * ## Ownership and lifetime
 *
 * A provided implementation may own caches for its Layer lifetime. Each Fx it
 * returns is acquired and finalized by the Scope that runs it; the service tag
 * itself owns no DOM or response stream.
 *
 * @see https://effect.website/docs/requirements-management/services/
 *
 * @example
 * ```ts
 * import { Effect, Layer } from "effect"
 * import { html } from "@typed/template"
 * import { DomRenderTemplate, render } from "@typed/template/Render"
 * import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html"
 * import { Fx } from "@typed/fx"
 *
 * // Run DOM rendering until the surrounding Effect is interrupted.
 * const browserApp = render(html`<div>Hello</div>`, document.body).pipe(
 *   Fx.drainLayer,
 *   Layer.provide(DomRenderTemplate),
 *   Layer.launch
 * )
 *
 * // Use HTML rendering for SSR
 * const serverApp = Effect.scoped(Effect.gen(function* () {
 *   const template = html`<div>Hello</div>`
 *   const htmlString = yield* renderToHtmlString(template).pipe(
 *     Effect.provide(HtmlRenderTemplate)
 *   )
 *   console.log(htmlString) // "<div>Hello</div>"
 * }))
 * ```
 *
 * @since 1.0.0
 * @category Template interpretation
 */
export class RenderTemplate extends Context.Service<
  RenderTemplate,
  {
    <const Values extends ArrayLike<Renderable.Any>>(
      template: TemplateStringsArray,
      values: Values,
    ): Fx<
      RenderEvent,
      Renderable.Error<Values[number]>,
      Renderable.Services<Values[number]> | Scope
    >;
  }
>()("RenderTemplate") {}

/**
 * The main template tag function.
 *
 * It creates a reactive `Fx` stream that renders the template. The actual rendering logic
 * depends on the provided `RenderTemplate` service.
 *
 * @remarks
 * ## Why
 *
 * `html` describes one renderer-independent template program. The
 * `RenderTemplate` Effect service decides whether that program produces DOM for
 * a browser, HTML chunks for SSR, or hydration against existing nodes. Dynamic
 * values keep their own typed error and service channels instead of being
 * hidden behind component state.
 *
 * ## Ownership and lifetime
 *
 * Calling the tag is inert. Rendering its returned Fx acquires dynamic values
 * inside the running Effect `Scope`; interruption closes their subscriptions
 * and finalizers. Each renderer owns only the dynamic parts it creates, leaving
 * external classes, unowned DOM nodes, and native platform behavior intact.
 *
 * ## Escaping and trust
 *
 * Static template strings are authored markup. Ordinary interpolated strings
 * are rendered as data, not treated as raw HTML. Renderer-owned HTML transport
 * uses the separate branded `HtmlRenderEvent` boundary.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { html } from "@typed/template"
 * import { DomRenderTemplate, render } from "@typed/template/Render"
 * import { Fx } from "@typed/fx"
 * import { Layer } from "effect"
 * import { RefSubject } from "@typed/fx/RefSubject"
 *
 * // Simple static template
 * const staticTemplate = html`<div>Hello, world!</div>`
 *
 * // Template with dynamic values
 * const name = "Alice"
 * const dynamicTemplate = html`<div>Hello, ${name}!</div>`
 *
 * // Template with reactive values
 * const program = Effect.gen(function* () {
 *   const count = yield* RefSubject.make(0)
 *
 *   const template = html`<div>
 *     <p>Count: ${count}</p>
 *     <button onclick=${RefSubject.increment(count)}>Increment</button>
 *   </div>`
 *
 *   return yield* render(template, document.body).pipe(
 *     Fx.drainLayer,
 *     Layer.provide(DomRenderTemplate),
 *     Layer.launch
 *   )
 * })
 * ```
 *
 * @param template - The template strings.
 * @param values - The interpolated values.
 * @returns An `Fx` that emits `RenderEvent`s.
 * @since 1.0.0
 * @category Template authoring
 */
export function html<const Values extends ReadonlyArray<Renderable.Any>>(
  template: TemplateStringsArray,
  ...values: Values
): Fx<
  RenderEvent,
  Renderable.Error<Values[number]>,
  Renderable.Services<Values[number]> | Scope | RenderTemplate
> {
  return unwrap(map(RenderTemplate, (render) => render(template, values)));
}
