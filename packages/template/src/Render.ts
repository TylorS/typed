/**
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import { Document } from "@typed/dom/Document"
import { RootElement } from "@typed/dom/RootElement"
import * as Fx from "@typed/fx/Fx"
import { type Rendered } from "@typed/wire"
import type { Layer, Scope } from "effect"
import * as Effect from "effect/Effect"
import { attachRoot, renderTemplate } from "./internal/render.js"
import { RenderContext } from "./RenderContext.js"
import { type RenderEvent } from "./RenderEvent.js"
import { RenderTemplate } from "./RenderTemplate.js"

/**
 * @since 1.0.0
 */
export type ToRendered<T extends RenderEvent | null> = T extends null ? Rendered | null : Rendered

/**
 * @since 1.0.0
 */
export function render<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<R, E, T>
): Fx.Fx<Exclude<R, RenderTemplate> | Document | RenderContext | RootElement, E, ToRendered<T>> {
  return Fx.fromFxEffect(Effect.contextWith((context) => {
    const [document, ctx, { rootElement }] = Context.getMany(context, Document, RenderContext, RootElement)

    return Fx.provideService(
      Fx.mapEffect(rendered, (what) => attachRoot(ctx.renderCache, rootElement, what)),
      RenderTemplate,
      renderTemplate(document, ctx)
    )
  }))
}

/**
 * @since 1.0.0
 */
export function renderLayer<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<R, E, T>
): Layer.Layer<
  never,
  never,
  Document | RenderContext | RootElement | Exclude<Exclude<R, RenderTemplate>, Scope.Scope>
> {
  return Fx.drainLayer(Fx.switchMapCause(render(rendered), (e) => Fx.fromEffect(Effect.logError(e))))
}
