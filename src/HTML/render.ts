import * as Effect from '@effect/core/io/Effect'
import { Wire, persistent } from '@webreflection/uwire'

import { makeEntry } from './Entry.js'
import { Hole } from './Hole.js'
import { RenderCache } from './RenderCache.js'
import { RenderContext } from './RenderContext.js'

export function render<T extends DocumentFragment | HTMLElement, R>(
  where: T,
  what: Hole<R> | HTMLElement | SVGElement,
): Effect.Effect<Document | RenderContext, never, T> {
  return Effect.gen(function* ($) {
    const renderCache = yield* $(RenderContext.getRenderCache)
    if (!renderCache.has(where)) {
      renderCache.set(where, RenderCache())
    }
    const cache = renderCache.get(where) as RenderCache<R>
    const wire = what instanceof Hole ? yield* $(renderHole(what, cache)) : what

    if (wire !== cache.wire) {
      cache.wire = wire
      // valueOf() simply returns the node itself, but in case it was a "wire"
      // it will eventually re-append all nodes to its fragment so that such
      // fragment can be re-appended many times in a meaningful way
      // (wires are basically persistent fragments facades with special behavior)
      where.replaceChildren(wire.valueOf() as Node)
    }

    console.log(where.childNodes)

    return where
  })
}

export function renderHole<R>(
  hole: Hole<R>,
  cache: RenderCache<R>,
): Effect.Effect<Document | RenderContext, never, Node | Wire> {
  return Effect.gen(function* ($) {
    const length = yield* $(renderPlaceholders(hole.values, cache))

    let { entry } = cache

    if (!entry || entry.template !== hole.template || entry.type !== hole.type) {
      cache.entry = entry = yield* $(makeEntry(hole))
    }

    if (entry.env !== hole.env) {
      entry.env = hole.env
    }

    const { content, updates, wire, env } = entry
    const withEnv = Effect.provideSomeEnvironment<
      Document | RenderContext,
      Document | RenderContext | R
    >((e) => e.merge(env))

    for (let i = 0; i < length; i++) yield* $(withEnv(updates[i](hole.values[i])))

    return wire || (entry.wire = persistent(content))
  })
}

export function renderPlaceholders<R>(
  values: Hole<R>['values'],
  { stack }: RenderCache<R>,
): Effect.Effect<RenderContext | Document, never, number> {
  return Effect.gen(function* ($) {
    const { length } = values

    for (let i = 0; i < length; i++) {
      const placeholder = values[i]

      if (placeholder instanceof Hole) {
        values[i] = yield* $(renderHole(placeholder, stack[i] || (stack[i] = RenderCache())))
      } else if (Array.isArray(placeholder)) {
        yield* $(renderPlaceholders(placeholder, stack[i] || (stack[i] = RenderCache())))
      } else {
        stack[i] = null
      }
    }

    return length
  })
}
