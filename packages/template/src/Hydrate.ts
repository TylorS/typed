/**
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import { Document } from "@typed/dom/Document"
import { RootElement } from "@typed/dom/RootElement"
import * as Fx from "@typed/fx/Fx"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { findRootParentChildNodes, hydrateTemplate } from "./internal/hydrate.js"
import { HydrateContext } from "./internal/HydrateContext.js"
import { attachRoot } from "./internal/render.js"
import type { ToRendered } from "./Render.js"
import { RenderContext } from "./RenderContext.js"
import { type RenderEvent } from "./RenderEvent.js"
import { RenderTemplate } from "./RenderTemplate.js"

/**
 * @since 1.0.0
 */
export function hydrate<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<R, E, T>
): Fx.Fx<Exclude<R, RenderTemplate> | Document | RenderContext | RootElement, E, ToRendered<T>> {
  return Fx.fromFxEffect(Effect.contextWith((context) => {
    const [document, renderContext, { rootElement }] = Context.getMany(context, Document, RenderContext, RootElement)
    const ctx: HydrateContext = {
      where: findRootParentChildNodes(rootElement),
      rootIndex: -1,
      parentTemplate: null,
      hydrate: true
    }

    const layer = Layer.provideMerge(
      HydrateContext.layer(ctx),
      RenderTemplate.layer(hydrateTemplate(document, renderContext))
    )

    return Fx.provide(
      Fx.mapEffect(rendered, (what) => attachRoot(renderContext.renderCache, rootElement, what)),
      layer
    )
  })) as Fx.Fx<Exclude<R, RenderTemplate> | Document | RenderContext | RootElement, E, ToRendered<T>>
}

/**
 * @since 1.0.0
 */
export function hydrateLayer<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<R, E, T>
) {
  return Fx.drainLayer(Fx.switchMapCause(hydrate(rendered), Effect.logError))
}
