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
import { HydrateContext } from "./internal/HydrateContext.js"
import { findRootParentChildNodes, hydrateTemplate } from "./internal/v2/hydrate.js"
import { attachRoot } from "./internal/v2/render.js"
import type { ToRendered } from "./Render.js"
import * as RenderContext from "./RenderContext.js"
import { type RenderEvent } from "./RenderEvent.js"
import { RenderTemplate } from "./RenderTemplate.js"

/**
 * @since 1.0.0
 */
export const hydrateLayer = (
  window: Window & GlobalThis,
  options?: DomServicesElementParams
): Layer.Layer<
  | RenderTemplate
  | RenderContext.RenderContext
  | CurrentEnvironment
  | DomServices
> =>
  Layer.provideMerge(
    RenderTemplate.layer(
      Effect.contextWith(
        (context: Context.Context<Document | RenderContext.RenderContext>) => {
          const [document, ctx] = Context.getMany(
            context,
            Document,
            RenderContext.RenderContext
          )

          return hydrateTemplate(document, ctx)
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
  return Fx.drainLayer(
    Fx.switchMapCause(hydrate(rendered), (cause) => Fx.fromEffect(Effect.logError(`Hydration Failure`, cause)))
  )
}
