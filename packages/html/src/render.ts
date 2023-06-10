import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import type { Scope } from '@effect/io/Scope'
import { Document } from '@typed/dom/Document'
import * as Fx from '@typed/fx'
import { type Wire } from '@typed/wire'

import { RenderContext } from './RenderContext.js'
import type { RenderEvent } from './RenderEvent.js'

export type Rendered = Wire | Node | DocumentFragment

export function renderInto<T extends HTMLElement>(where: T) {
  return <R, E>(fx: Fx.Fx<R, E, RenderEvent>): Fx.Fx<R | RenderContext, E, T> =>
    Fx.gen(function* ($) {
      const ctx = yield* $(RenderContext)

      return pipe(
        fx,
        Fx.switchMapEffect((hole) => renderWithCache(ctx, where, hole)),
      )
    })
}

export function drainInto<T extends HTMLElement>(where: T) {
  return <R, E>(fx: Fx.Fx<R, E, RenderEvent>): Effect.Effect<R | RenderContext | Scope, E, void> =>
    pipe(fx, renderInto(where), Fx.drain)
}

/**
 * Render a Hole/Element into a given DOM node using the provided Document + RenderContext
 */
export function render<T extends HTMLElement>(
  where: T,
  what: RenderEvent,
): Effect.Effect<RenderContext, never, T> {
  return pipe(
    RenderContext,
    Effect.flatMap((ctx) => renderWithCache(ctx, where, what)),
  )
}

function renderWithCache<T extends HTMLElement>(ctx: RenderContext, where: T, what: RenderEvent) {
  const { updates } = ctx
  const renderCache = ctx.renderCache.get(where) ?? { wire: null }

  return Effect.sync(() => {
    switch (what._tag) {
      case 'RenderedDom': {
        const that = what.rendered

        if (that !== renderCache.wire) {
          if (renderCache.wire && !what) where.removeChild(renderCache.wire.valueOf() as Node)

          renderCache.wire = that as Wire | Node | null | undefined

          if (what) where.replaceChildren(what.valueOf() as Node)
        }
        break
      }
      case 'RenderUpdate': {
        updates.set(what.part, what.update)
        break
      }
      case 'FullHtml': {
        where.innerHTML = what.html
        break
      }
      case 'PartialHtml': {
        where.innerHTML = where.innerHTML + what.html
        break
      }
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
