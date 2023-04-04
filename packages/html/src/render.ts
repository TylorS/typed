import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Flags from '@effect/io/Fiber/Runtime/Flags'
import * as RuntimeFlagsPatch from '@effect/io/Fiber/Runtime/Flags/Patch'
import type { FiberRefs } from '@effect/io/FiberRefs'
import * as R from '@effect/io/Runtime'
import { Document } from '@typed/dom/Document'
import * as Fx from '@typed/fx'

import { makeEntry } from './Entry.js'
import { Hole } from './Hole.js'
import type { Placeholder } from './Placeholder.js'
import { RenderCache } from './RenderCache.js'
import { RenderContext } from './RenderContext.js'
import { type Wire, persistent } from './Wire.js'

export type Renderable = Placeholder | Node | null | undefined | ReadonlyArray<Renderable>

export function renderInto<T extends DocumentFragment | HTMLElement>(where: T) {
  return <R, E>(fx: Fx.Fx<R, E, Renderable>): Fx.Fx<R | Document | RenderContext, E, T> =>
    Fx.gen(function* ($) {
      const holeContext = yield* $(getRenderHoleContext)

      return pipe(
        fx,
        Fx.switchMapEffect((hole) => renderWithHoleContext(holeContext, where, hole)),
        // Disable cooperative yielding to help ensure consistent rendering performance
        Fx.withRuntimeFlags(RuntimeFlagsPatch.disable(Flags.CooperativeYielding)),
      )
    })
}

export function drainInto<T extends DocumentFragment | HTMLElement>(where: T) {
  return <R, E>(
    fx: Fx.Fx<R, E, Renderable>,
  ): Effect.Effect<R | Document | RenderContext, E, void> => pipe(fx, renderInto(where), Fx.drain)
}

/**
 * Render a Hole/Element into a given DOM node using the provided Document + RenderContext
 */
export function render<T extends DocumentFragment | HTMLElement>(
  where: T,
  what: Renderable,
): Effect.Effect<Document | RenderContext, never, T> {
  return pipe(
    getRenderHoleContext,
    Effect.flatMap((holeContext) => renderWithHoleContext(holeContext, where, what)),
  )
}

function renderWithHoleContext<T extends DocumentFragment | HTMLElement>(
  holeContext: RenderHoleContext,
  where: T,
  what: Renderable,
) {
  return Effect.sync(() => {
    const { renderCache } = holeContext.renderContext
    let cache = renderCache.get(where)
    if (!cache) {
      renderCache.set(where, (cache = RenderCache()))
    }
    const wire = what instanceof Hole ? renderHole(what, cache, holeContext) : what

    if (wire !== cache.wire) {
      if (cache.wire && !wire) where.removeChild(cache.wire as Node)

      cache.wire = wire as Wire | Node | null | undefined
      // valueOf() simply returns the node itself, but in case it was a "wire"
      // it will eventually re-append all nodes to its fragment so that such
      // fragment can be re-appended many times in a meaningful way
      // (wires are basically persistent fragments facades with special behavior)
      if (wire) where.replaceChildren(wire.valueOf() as Node)
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
  readonly fiberRefs: FiberRefs
  readonly runtimeFlags: Flags.RuntimeFlags
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
  fiberRefs: Effect.getFiberRefs(),
  runtimeFlags: Effect.runtimeFlags(),
  renderContext: RenderContext,
})

/**
 * @internal
 */
export function renderHole(
  hole: Hole,
  cache: RenderCache,
  context: RenderHoleContext,
): Node | Wire {
  const length = renderPlaceholders(hole.values, cache, context)

  let { entry } = cache

  if (!entry || entry.template !== hole.template || entry.type !== hole.type) {
    cache.entry = entry = makeEntry(hole, context.document, context.renderContext.templateCache)
  }

  if (entry.context !== hole.context) {
    entry.context = hole.context
    entry.runtime = R.make(entry.context, context.runtimeFlags, context.fiberRefs)
  } else if (!entry.runtime) {
    entry.runtime = R.make(entry.context, context.runtimeFlags, context.fiberRefs)
  }

  const { content, updates, wire, runtime } = entry

  for (let i = 0; i < length; i++) updates[i](hole.values[i], runtime)

  return wire || (entry.wire = persistent(content))
}

/**
 * @internal
 */
export function renderPlaceholders(
  values: Hole['values'],
  { stack }: RenderCache,
  context: RenderHoleContext,
): number {
  const { length } = values

  for (let i = 0; i < length; i++) {
    const placeholder = values[i]

    if (placeholder instanceof Hole) {
      values[i] = renderHole(placeholder, stack[i] || (stack[i] = RenderCache()), context)
    } else if (Array.isArray(placeholder)) {
      renderPlaceholders(placeholder, stack[i] || (stack[i] = RenderCache()), context)
    } else {
      stack[i] = null
    }
  }

  return length
}
