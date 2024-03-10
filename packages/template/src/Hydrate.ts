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
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { findRootParentChildNodes, hydrateTemplate } from "./internal/hydrate.js"
import { HydrateContext } from "./internal/HydrateContext.js"
import { attachRoot } from "./internal/render.js"
import type { ToRendered } from "./Render.js"
import * as RenderContext from "./RenderContext.js"
import { type RenderEvent } from "./RenderEvent.js"
import * as RenderQueue from "./RenderQueue.js"
import { RenderTemplate } from "./RenderTemplate.js"

/**
 * @since 1.0.0
 */
export const hydrateLayer = (
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
          const [document, queue, ctx] = Context.getMany(
            context,
            Document,
            RenderQueue.RenderQueue,
            RenderContext.RenderContext
          )

          return hydrateTemplate(document, queue, ctx)
        }
      )
    ),
    RenderContext.dom(window, options)
  )

/**
 * @since 1.0.0
 */
export function hydrate<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<T, E, R>
): Fx.Fx<ToRendered<T>, E, R | RenderTemplate | RenderContext.RenderContext | RootElement> {
  return Fx.fromFxEffect(Effect.contextWith((context) => {
    const [renderContext, { rootElement }] = Context.getMany(
      context,
      RenderContext.RenderContext,
      RootElement
    )
    const ctx: HydrateContext = {
      where: findRootParentChildNodes(rootElement),
      rootIndex: -1,
      parentTemplate: null,
      hydrate: true
    }

    return Fx.provide(
      Fx.mapEffect(rendered, (what) => attachRoot(renderContext.renderCache, rootElement, what)),
      HydrateContext.layer(ctx)
    )
  }))
}

/**
 * @since 1.0.0
 */
export function hydrateToLayer<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<T, E, R>
): Layer.Layer<never, never, R | RenderTemplate | RenderContext.RenderContext | RootElement> {
  return Fx.drainLayer(Fx.switchMapCause(hydrate(rendered), (cause) => Fx.fromEffect(Effect.logError(cause))))
}
