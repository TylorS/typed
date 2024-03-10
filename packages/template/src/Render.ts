/**
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import { Document } from "@typed/dom/Document"
import type { DomServices, DomServicesElementParams } from "@typed/dom/DomServices"
import type { GlobalThis } from "@typed/dom/GlobalThis"
import { RootElement } from "@typed/dom/RootElement"
import type { CurrentEnvironment } from "@typed/environment"
import * as Fx from "@typed/fx/Fx"
import { type Rendered } from "@typed/wire"
import type { Scope } from "effect"
import { Layer, pipe } from "effect"
import * as Effect from "effect/Effect"
import { attachRoot, renderTemplate } from "./internal/render.js"
import * as RenderContext from "./RenderContext.js"
import { type RenderEvent } from "./RenderEvent.js"
import * as RenderQueue from "./RenderQueue.js"
import { RenderTemplate } from "./RenderTemplate.js"

/**
 * @since 1.0.0
 */
export type ToRendered<T extends RenderEvent | null> = T extends null ? Rendered | null : Rendered

/**
 * @since 1.0.0
 */
export const renderLayer = (
  window: Window & GlobalThis,
  options?: DomServicesElementParams & { readonly skipRenderScheduling?: boolean }
): Layer.Layer<
  | RenderTemplate
  | RenderContext.RenderContext
  | CurrentEnvironment
  | DomServices,
  never,
  RenderQueue.RenderQueue
> =>
  Layer.provideMerge(
    RenderTemplate.layer(
      Effect.contextWith(
        (context: Context.Context<Document | RenderQueue.RenderQueue | RenderContext.RenderContext>) => {
          const [document, queue, ctx] = pipe(
            context,
            Context.getMany(
              Document,
              RenderQueue.RenderQueue,
              RenderContext.RenderContext
            )
          )

          return renderTemplate(document, queue, ctx)
        }
      )
    ),
    RenderContext.dom(window, options)
  )

/**
 * @since 1.0.0
 */
export function render<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<T, E, R>
): Fx.Fx<ToRendered<T>, E, R | RenderTemplate | RenderContext.RenderContext | RootElement> {
  return Fx.fromFxEffect(Effect.contextWith((context) => {
    const [ctx, { rootElement }] = Context.getMany(
      context,
      RenderContext.RenderContext,
      RootElement
    )

    return Fx.mapEffect(rendered, (what) => attachRoot(ctx.renderCache, rootElement, what))
  }))
}

/**
 * @since 1.0.0
 */
export function renderToLayer<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<T, E, R>,
  window: Window & GlobalThis = globalThis.window,
  options?: DomServicesElementParams & { readonly skipRenderScheduling?: boolean }
): Layer.Layer<
  RenderTemplate | RenderContext.RenderContext | CurrentEnvironment | DomServices,
  never,
  | RenderQueue.RenderQueue
  | Exclude<
    Exclude<R, Scope.Scope>,
    RenderTemplate | RenderContext.RenderContext | CurrentEnvironment | DomServices
  >
> {
  return Layer.provideMerge(
    Fx.drainLayer(Fx.switchMapCause(render(rendered), (e) => Fx.fromEffect(Effect.logError(e)))),
    renderLayer(window, options)
  )
}
