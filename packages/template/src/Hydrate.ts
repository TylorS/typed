import * as Context from "@typed/context"
import { Document } from "@typed/dom/Document"
import { RootElement } from "@typed/dom/RootElement"
import * as Fx from "@typed/fx/Fx"
import { findRootParentChildNodes, hydrateTemplate } from "@typed/template/internal/hydrate"
import { HydrateContext } from "@typed/template/internal/HydrateContext"
import { attachRoot } from "@typed/template/internal/render"
import type { ToRendered } from "@typed/template/Render"
import { RenderContext } from "@typed/template/RenderContext"
import { type RenderEvent } from "@typed/template/RenderEvent"
import { RenderTemplate } from "@typed/template/RenderTemplate"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

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

export function hydrateLayer<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<R, E, T>
) {
  return Fx.drainLayer(Fx.switchMapCause(hydrate(rendered), Effect.logError))
}
