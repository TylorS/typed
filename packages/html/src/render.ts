import * as Effect from '@effect/io/Effect'
import * as Flags from '@effect/io/Fiber/Runtime/Flags'
import * as RuntimeFlagsPatch from '@effect/io/Fiber/Runtime/Flags/Patch'
import { FiberRefs } from '@effect/io/FiberRefs'
import * as R from '@effect/io/Runtime'
import { pipe } from '@fp-ts/data/Function'
import { Document, getDocument } from '@typed/dom/Document'
import * as Fx from '@typed/fx'

import { makeEntry } from './Entry.js'
import { Hole } from './Hole.js'
import { RenderCache } from './RenderCache.js'
import { RenderContext } from './RenderContext.js'
import { Wire, persistent } from './Wire.js'

export function runBrowser<T extends DocumentFragment | HTMLElement>(where: T) {
  return <R, E>(fx: Fx.Fx<R, E, Hole | HTMLElement | SVGElement>) => {
    return pipe(
      fx,
      drainInto(where),
      Document.provide(where.ownerDocument),
      RenderContext.provideBrowser,
    )
  }
}

export function runServer<T extends DocumentFragment | HTMLElement>(where: T) {
  return <R, E>(fx: Fx.Fx<R, E, Hole | HTMLElement | SVGElement>) => {
    return pipe(
      fx,
      drainInto(where),
      Document.provide(where.ownerDocument),
      RenderContext.provideServer,
    )
  }
}

export function drainInto<T extends DocumentFragment | HTMLElement>(where: T) {
  return <R, E>(
    fx: Fx.Fx<R, E, Hole | HTMLElement | SVGElement>,
  ): Effect.Effect<R | Document | RenderContext, E, void> => pipe(fx, renderInto(where), Fx.drain)
}

export function renderInto<T extends DocumentFragment | HTMLElement>(where: T) {
  return <R, E>(
    fx: Fx.Fx<R, E, Hole | HTMLElement | SVGElement>,
  ): Fx.Fx<R | Document | RenderContext, E, T> =>
    pipe(
      fx,
      Fx.exhaustMapLatestEffect((hole) => render(where, hole)),
      // Disable cooperative yielding to help ensure consistent rendering performance
      Fx.withRuntimeFlags(RuntimeFlagsPatch.disable(Flags.CooperativeYielding)),
    )
}

/**
 * Render a Hole/Element into a given DOM node using the provided Document + RenderContext
 */
export function render<T extends DocumentFragment | HTMLElement>(
  where: T,
  what: Hole | HTMLElement | SVGElement,
): Effect.Effect<Document | RenderContext, never, T> {
  return pipe(
    getRenderHoleContext,
    Effect.flatMap((holeContext) =>
      // Schedule this work to occur when the environment is not busy
      Effect.blocking(
        Effect.sync(() => {
          const { renderCache } = holeContext.renderContext
          if (!renderCache.has(where)) {
            renderCache.set(where, RenderCache())
          }
          const cache = renderCache.get(where) as RenderCache
          const wire = what instanceof Hole ? renderHole(what, cache, holeContext) : what

          if (wire !== cache.wire) {
            cache.wire = wire
            // valueOf() simply returns the node itself, but in case it was a "wire"
            // it will eventually re-append all nodes to its fragment so that such
            // fragment can be re-appended many times in a meaningful way
            // (wires are basically persistent fragments facades with special behavior)
            where.replaceChildren(wire.valueOf() as Node)
          }

          return where
        }),
      ),
    ),
  )
}

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
> = Effect.struct({
  document: getDocument,
  fiberRefs: Effect.getFiberRefs(),
  runtimeFlags: Effect.runtimeFlags(),
  renderContext: RenderContext.get,
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
