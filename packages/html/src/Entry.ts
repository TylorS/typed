import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { Wire, persistent } from '@typed/wire'

import type { RenderContext } from './RenderContext.js'
import { TemplateCache } from './TemplateCache.js'
import { TemplateResult } from './TemplateResult.js'
import { holeToPart } from './holeToPart.js'
import { parseTemplate } from './parseTemplate.js'
import { Part } from './part/Part.js'
import { findPath } from './paths.js'

export interface Entry {
  cleanup: Effect.Effect<never, never, void>
  fibers: Fiber.Fiber<any, any>[]
  onReady: Effect.Effect<never, never, void>
  onValue: (index: number) => Effect.Effect<never, never, void>
  parts: readonly Part[]
  template: TemplateStringsArray
  wire: () => Node | DocumentFragment | Wire | null
}

export function Entry(document: Document, renderContext: RenderContext, result: TemplateResult) {
  // eslint-disable-next-line require-yield
  return Effect.gen(function* ($) {
    const { template, deferred } = result
    const { content, holes } = getTemplateCache(document, renderContext, result)
    const { onReady, onValue } = yield* $(indexRefCounter(holes.length))
    const parts = holes.map((hole) => holeToPart(document, hole, findPath(content, hole.path)))
    const fibers: Fiber.Fiber<any, any>[] = Array(parts.length)

    const cleanup = Effect.forkDaemon(
      Effect.allPar(
        Effect.suspend(() => Fiber.interruptAll(fibers)),
        Deferred.succeed(deferred, undefined),
      ),
    )

    let wire: Node | DocumentFragment | Wire | null = null

    return {
      template,
      cleanup,
      onReady,
      onValue,
      parts,
      fibers,
      wire: () => wire || (wire = persistent(content)),
    } satisfies Entry
  })
}

function indexRefCounter(expected: number) {
  return Effect.gen(function* ($) {
    const hasValue = new Set<number>()
    const deferred = yield* $(Deferred.make<never, void>())
    const done = Deferred.succeed(deferred, undefined)

    let finished = false

    function onValue(index: number) {
      return Effect.suspend(() => {
        if (finished) return Effect.unit()

        hasValue.add(index)

        if (hasValue.size === expected) {
          finished = true
          hasValue.clear()

          return done
        }

        return Effect.unit()
      })
    }

    return {
      onReady: Deferred.await(deferred),
      onValue,
    }
  })
}

function getTemplateCache(
  document: Document,
  { templateCache }: RenderContext,
  { template, options }: TemplateResult,
): TemplateCache {
  const cache = templateCache.get(template)

  if (cache) return cache

  const isSvg = options?.isSvg ?? false
  const created = parseTemplate(template, document, isSvg)

  templateCache.set(template, created)

  return created
}
