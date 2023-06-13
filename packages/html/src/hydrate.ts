import { dualWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { Scope } from '@effect/io/Scope'
import { Document } from '@typed/dom'
import * as Fx from '@typed/fx'
import { Wire } from '@typed/wire'

import { CouldNotFindCommentError, Entry, HydrateEntry, findRootElement } from './Entry.js'
import { RenderCache } from './RenderCache.js'
import { RenderContext } from './RenderContext.js'
import { TemplateResult } from './TemplateResult.js'
import { getRenderCache } from './getCache.js'
import { handleEffectPart, handlePart, unwrapRenderable } from './makeUpdate.js'
import { Part } from './part/Part.js'
import { ParentChildNodes } from './paths.js'
import { renderPlaceholders, type Rendered, renderRootResult } from './render.js'

export const hydrate: {
  (where: HTMLElement): <R, E>(
    what: Fx.Fx<R, E, TemplateResult>,
  ) => Fx.Fx<Document | RenderContext | Scope | R, never, Rendered>

  <R, E>(what: Fx.Fx<R, E, TemplateResult>, where: HTMLElement): Fx.Fx<
    Document | RenderContext | Scope | R,
    never,
    Rendered
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E>(
      what: Fx.Fx<R, E, TemplateResult>,
      where: HTMLElement,
    ): Fx.Fx<Document | RenderContext | Scope | R, E, Rendered> =>
      Fx.gen(function* ($) {
        const input: RenderResultInput = {
          where,
          document: yield* $(Document),
          renderContext: yield* $(RenderContext),
          initial: true,
        }

        return Fx.switchMapEffect(what, (template) =>
          Effect.catchAllDefect(hydrateRoot(input, template), (defect) => {
            // If we can't find a comment then we need to render the result
            // without hydration
            if (defect instanceof CouldNotFindCommentError) {
              return renderRootResult(input, template)
            } else {
              return Effect.die(defect)
            }
          }),
        )
      }).addTrace(trace),
)

type RenderResultInput = {
  readonly where: HTMLElement
  readonly document: Document
  readonly renderContext: RenderContext

  initial: boolean
}

function hydrateRoot(input: RenderResultInput, template: TemplateResult) {
  const { document, renderContext, where } = input
  const cache = getRenderCache(where, renderContext.renderCache)

  return Effect.gen(function* ($) {
    const parentChildNodes = findRootParentChildNodes(where)
    const wire = yield* $(
      hydrateTemplateResult(document, renderContext, template, cache, parentChildNodes, true, -1),
      Effect.provideSomeContext(template.context),
    )

    if (wire !== cache.wire) {
      if (cache.wire && !wire) where.removeChild(cache.wire as Node)

      cache.wire = wire as Wire | Node | null

      // Don't replace the child nodes on the first render
      if (input.initial) {
        input.initial = false

        return cache.wire as Rendered
      }

      // valueOf() simply returns the node itself, but in case it was a "wire"
      // it will eventually re-append all nodes to its fragment so that such
      // fragment can be re-appended many times in a meaningful way
      // (wires are basically persistent fragments facades with special behavior)
      if (wire) {
        const x = wire.valueOf() as Node | Node[]

        where.replaceChildren(...(Array.isArray(x) ? x : [x]))
      }
    }

    return cache.wire as Rendered
  })
}

/**@internal */
export function hydrateTemplateResult(
  document: Document,
  renderContext: RenderContext,
  result: TemplateResult,
  cache: RenderCache,
  where: ParentChildNodes,
  isRoot: boolean,
  rootIndex: number,
): Effect.Effect<Document | RenderContext | Scope, never, Rendered | null> {
  return Effect.gen(function* ($) {
    let { entry } = cache

    if (!entry || entry.template !== result.template) {
      // The entry is changing, so we need to cleanup the previous one
      if (entry) {
        yield* $(entry.cleanup)

        cache.entry = entry = yield* $(Entry(document, renderContext, result))

        // Render all children before creating the wire
        if (entry.parts.length > 0) {
          yield* $(renderPlaceholders(document, renderContext, result, cache, entry))
        }
      } else {
        cache.entry = entry = yield* $(
          HydrateEntry(document, renderContext, result, where, isRoot, rootIndex),
        )
        // Render all children before creating the wire
        if (entry.parts.length > 0) {
          yield* $(hydratePlaceholders(document, renderContext, result, cache, entry))
        }
      }
    }

    // Lazily creates the wire after all childNodes are available
    return entry.wire()
  })
}

function hydratePlaceholders(
  document: Document,
  renderContext: RenderContext,
  { values, sink, context }: TemplateResult,
  renderCache: RenderCache,
  { parts, onValue, onReady, fibers, rootElements, indexToRootElement }: Entry,
): Effect.Effect<Scope, never, void> {
  const hydratePart = (part: Part, index: number) =>
    Effect.gen(function* ($) {
      const value = values[index]

      switch (part._tag) {
        // Nodes needs special handling as they support arrays, and other TemplateResults
        case 'Node': {
          let rootElement = indexToRootElement.get(index)
          if (!rootElement) {
            rootElement = findRootElement(rootElements, index)
            indexToRootElement.set(index, rootElement)
          }

          fibers[index] = yield* $(
            unwrapRenderable(value),
            Fx.switchMatchCauseEffect(sink.error, (x) => {
              return pipe(
                x instanceof TemplateResult
                  ? hydrateTemplateResult(
                      document,
                      renderContext,
                      x,
                      renderCache.stack[index] || (renderCache.stack[index] = RenderCache()),
                      {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        parentNode: rootElement!,
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        childNodes: rootElement!.childNodes,
                      },
                      false,
                      index,
                    )
                  : Effect.succeed(x),
                Effect.provideSomeContext(x instanceof TemplateResult ? x.context : context),
                Effect.flatMap(part.update),
                Effect.tap(() => onValue(index)),
              )
            }),
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
    Effect.allPar(parts.map(hydratePart)),
    Effect.flatMap(() => onReady),
    Effect.catchAllCause(sink.error),
    Effect.provideSomeContext(context),
  )
}

export function findRootParentChildNodes(where: HTMLElement): ParentChildNodes {
  const childNodes = findRootChildNodes(where)

  return {
    parentNode: where,
    childNodes,
  }
}

// Finds all of the childNodes between the "typed-start" and "typed-end" comments
export function findRootChildNodes(where: HTMLElement): Node[] {
  const childNodes: Node[] = []

  let start = 0
  let end = childNodes.length

  for (let i = 0; i < where.childNodes.length; i++) {
    const node = where.childNodes[i]

    if (node.nodeType === node.COMMENT_NODE) {
      if (node.nodeValue === 'typed-start') {
        start = i
        break
      }
    }
  }

  for (let i = where.childNodes.length - 1; i >= start; i--) {
    const node = where.childNodes[i]

    if (node.nodeType === node.COMMENT_NODE) {
      if (node.nodeValue === 'typed-end') {
        end = i
        break
      }
    }
  }

  for (let i = start + 1; i <= end; i++) {
    childNodes.push(where.childNodes[i])
  }

  return childNodes
}
