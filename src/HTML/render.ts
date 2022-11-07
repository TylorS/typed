import * as Effect from '@effect/core/io/Effect'
import { FiberRefs } from '@effect/core/io/FiberRefs'
import { Runtime } from '@effect/core/io/Runtime'
import { RuntimeFlags } from '@effect/core/io/RuntimeFlags'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

import { getDocument } from '../DOM/Document.js'

import { makeEntry } from './Entry.js'
import { Hole } from './Hole.js'
import { RenderCache } from './RenderCache.js'
import { RenderContext } from './RenderContext.js'
import { Wire, persistent } from './Wire.js'

export function drainInto<T extends DocumentFragment | HTMLElement>(where: T) {
  return <R, E>(fx: Fx.Fx<R, E, Hole | HTMLElement | SVGElement>) =>
    pipe(fx, renderInto(where), Fx.runDrain)
}

export function renderInto<T extends DocumentFragment | HTMLElement>(where: T) {
  return <R, E>(
    fx: Fx.Fx<R, E, Hole | HTMLElement | SVGElement>,
  ): Fx.Fx<R | Document | RenderContext, E, T> =>
    pipe(
      fx,
      Fx.mapEffect((hole) => render(where, hole)),
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
    Effect.map((holeContext) => {
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
  )
}

export interface RenderHoleContext {
  readonly document: Document
  readonly renderContext: RenderContext
  readonly fiberRefs: FiberRefs
  readonly runtimeFlags: RuntimeFlags
}

/**
 * @interanl
 */
export const getRenderHoleContext: Effect.Effect<
  Document | RenderContext,
  never,
  RenderHoleContext
> = Effect.withFiberRuntime((fiber, status) =>
  Effect.struct({
    document: getDocument,
    fiberRefs: fiber.fiberRefs,
    renderContext: RenderContext.get,
    runtimeFlags: Effect.succeed(status.runtimeFlags),
  }),
)

/**
 * @interanl
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

  if (entry.env !== hole.env) {
    entry.env = hole.env
    entry.runtime = new Runtime(entry.env, context.runtimeFlags, context.fiberRefs)
  } else if (!entry.runtime) {
    entry.runtime = new Runtime(entry.env, context.runtimeFlags, context.fiberRefs)
  }

  const { content, updates, wire, runtime } = entry

  for (let i = 0; i < length; i++) updates[i](hole.values[i], runtime)

  return wire || (entry.wire = persistent(content))
}

/**
 * @interanl
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
