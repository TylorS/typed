import { dualWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { Scope } from '@effect/io/Scope'
import { Document } from '@typed/dom'
import * as Fx from '@typed/fx'
import { Wire } from '@typed/wire'

import { Entry } from './Entry.js'
import { RenderCache } from './RenderCache.js'
import { RenderContext } from './RenderContext.js'
import { TemplateResult } from './TemplateResult.js'
import { getRenderCache } from './getCache.js'
import { handleEffectPart, handlePart, unwrapRenderable } from './makeUpdate.js'
import { Part } from './part/Part.js'

export type Rendered = Node | Wire | DocumentFragment | readonly Rendered[]

export const render: {
  (where: DocumentFragment | HTMLElement): <R, E>(
    what: Fx.Fx<R, E, TemplateResult>,
  ) => Fx.Fx<Document | RenderContext | Scope | R, never, Rendered>

  <R, E>(what: Fx.Fx<R, E, TemplateResult>, where: DocumentFragment | HTMLElement): Fx.Fx<
    Document | RenderContext | Scope | R,
    never,
    Rendered
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E>(
      what: Fx.Fx<R, E, TemplateResult>,
      where: DocumentFragment | HTMLElement,
    ): Fx.Fx<Document | RenderContext | Scope | R, E, Rendered> =>
      Fx.gen(function* ($) {
        const input: RenderResultInput = {
          where,
          document: yield* $(Document),
          renderContext: yield* $(RenderContext),
        }

        return Fx.switchMapEffect(what, (template) => renderRootResult(input, template))
      }).addTrace(trace),
)

type RenderResultInput = {
  readonly where: DocumentFragment | HTMLElement
  readonly document: Document
  readonly renderContext: RenderContext
}

export function renderRootResult(input: RenderResultInput, template: TemplateResult) {
  const { document, renderContext, where } = input
  const cache = getRenderCache(where, renderContext.renderCache)

  return Effect.gen(function* ($) {
    const wire = yield* $(
      renderTemplateResult(document, renderContext, template, cache),
      Effect.provideSomeContext(template.context),
    )

    if (wire !== cache.wire) {
      if (cache.wire && !wire) where.removeChild(cache.wire as Node)

      cache.wire = wire as Wire | Node | null
      // valueOf() simply returns the node itself, but in case it was a "wire"
      // it will eventually re-append all nodes to its fragment so that such
      // fragment can be re-appended many times in a meaningful way
      // (wires are basically persistent fragments facades with special behavior)
      if (wire) where.replaceChildren(wire.valueOf() as Node)
    }

    return cache.wire as Rendered
  })
}

export function renderTemplateResult(
  document: Document,
  renderContext: RenderContext,
  result: TemplateResult,
  cache: RenderCache,
): Effect.Effect<Document | RenderContext | Scope, never, Rendered | null> {
  return Effect.gen(function* ($) {
    let { entry } = cache

    if (!entry || entry.template !== result.template) {
      // The entry is changing, so we need to cleanup the previous one
      if (cache.entry) {
        yield* $(cache.entry.cleanup)
      }

      cache.entry = entry = yield* $(Entry(document, renderContext, result, cache))
    }

    // Render all children before creating the wire
    if (entry.parts.length > 0) {
      yield* $(renderPlaceholders(document, renderContext, result, cache, entry))
    }

    // Lazily creates the wire after all childNodes are available
    return entry.wire()
  })
}

export function renderPlaceholders(
  document: Document,
  renderContext: RenderContext,
  { values, sink, context }: TemplateResult,
  renderCache: RenderCache,
  { parts, onValue, onReady, fibers, values: cachedValues }: Entry,
): Effect.Effect<Scope, never, void> {
  const renderNode = (value: unknown, i: number) =>
    Effect.suspend(() => {
      // If the value is a TemplateResult, we need to render it recusively
      if (value instanceof TemplateResult) {
        return renderTemplateResult(
          document,
          renderContext,
          value,
          renderCache.stack[i] || (renderCache.stack[i] = RenderCache()),
        )
      }

      if (!value) {
        renderCache.stack[i] = null
      }

      return Effect.succeed(value)
    })

  const renderPart = (part: Part, index: number) =>
    Effect.gen(function* ($) {
      const value = values[index]

      // Avoid re-rendering the same value
      if (value === cachedValues[index] && index in fibers) {
        return
      } else if (index in fibers) {
        yield* $(Fiber.interruptFork(fibers[index]))
      }

      cachedValues[index] = value

      switch (part._tag) {
        // Nodes needs special handling as they support arrays, and other TemplateResults
        case 'Node': {
          fibers[index] = yield* $(
            unwrapRenderable(value),
            Fx.switchMatchCauseEffect(sink.error, (x) =>
              pipe(
                renderNode(x, index),
                Effect.flatMap(part.update),
                Effect.tap(() => onValue(index)),
              ),
            ),
            Fx.drain,
            Effect.forkScoped,
          )

          break
        }
        // Ref and Event are setup just once
        case 'Ref':
        case 'Event': {
          yield* $(handleEffectPart(part, value))
          fibers[index] = Fiber.unit()
          yield* $(onValue(index))
          break
        }
        default: {
          // Other parts may or may not return an Fx to be executed over time
          const fx = yield* $(handlePart(part, value))

          if (fx) {
            fibers[index] = yield* $(
              fx,
              Fx.switchMatchCauseEffect(sink.error, () => onValue(index)),
              Fx.drain,
              Effect.forkScoped,
            )
          } else {
            fibers[index] = Fiber.unit()

            yield* $(onValue(index))
          }
        }
      }
    })

  return pipe(
    Effect.allPar(parts.map(renderPart)),
    Effect.flatMap(() => onReady),
    Effect.catchAllCause(sink.error),
    Effect.provideSomeContext(context),
  )
}
