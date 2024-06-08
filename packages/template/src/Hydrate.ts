/**
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import { RootElement } from "@typed/dom/RootElement"
import * as Fx from "@typed/fx/Fx"
import * as Effect from "effect/Effect"
import type * as Layer from "effect/Layer"
import { HydrateContext } from "./internal/HydrateContext.js"
import { getHydrationRoot } from "./internal/v2/hydration-template.js"
import { attachRoot } from "./internal/v2/render.js"
import type { ToRendered } from "./Render.js"
import * as RenderContext from "./RenderContext.js"
import { type RenderEvent } from "./RenderEvent.js"
import type { RenderTemplate } from "./RenderTemplate.js"

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
      where: getHydrationRoot(rootElement),
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
