import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import type { Scope } from '@effect/io/Scope'
import { Document } from '@typed/dom/Document'
import * as Fx from '@typed/fx'

import { RenderCache } from './RenderCache.js'
import { RenderContext } from './RenderContext.js'
import { type Wire } from './Wire.js'

export type Renderable = Wire | Node | null | undefined | ReadonlyArray<Renderable>

export function renderInto<T extends HTMLElement>(where: T) {
  return <R, E>(fx: Fx.Fx<R, E, Renderable>): Fx.Fx<R | Document | RenderContext | Scope, E, T> =>
    Fx.gen(function* ($) {
      const { renderCache } = yield* $(RenderContext)

      return pipe(
        fx,
        Fx.switchMapEffect((hole) => renderWithCache(renderCache, where, hole)),
      )
    })
}

export function drainInto<T extends HTMLElement>(where: T) {
  return <R, E>(
    fx: Fx.Fx<R, E, Renderable>,
  ): Effect.Effect<R | Document | RenderContext | Scope, E, void> =>
    pipe(fx, renderInto(where), Fx.drain)
}

/**
 * Render a Hole/Element into a given DOM node using the provided Document + RenderContext
 */
export function render<T extends HTMLElement>(
  where: T,
  what: Renderable,
): Effect.Effect<Document | RenderContext, never, T> {
  return pipe(
    RenderContext,
    Effect.flatMap(({ renderCache }) => renderWithCache(renderCache, where, what)),
  )
}

function renderWithCache<T extends HTMLElement>(
  renderCache: WeakMap<HTMLElement, RenderCache>,
  where: T,
  what: Renderable,
) {
  return Effect.sync(() => {
    let cache = renderCache.get(where)
    if (!cache) {
      renderCache.set(where, (cache = RenderCache()))
    }

    if (what !== cache.wire) {
      if (cache.wire && !what) where.removeChild(cache.wire.valueOf() as Node)

      cache.wire = what as Wire | Node | null | undefined

      if (what) where.replaceChildren(what.valueOf() as Node)
    }

    return where
  })
}

/**
 * @internal
 */
export interface RenderHoleContext {
  readonly document: Document
  readonly renderContext: RenderContext
}

/**
 * @internal
 */
export const getRenderHoleContext: Effect.Effect<
  Document | RenderContext,
  never,
  RenderHoleContext
> = Effect.all({
  document: Document,
  renderContext: RenderContext,
})
