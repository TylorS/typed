import { dualWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { Scope } from '@effect/io/Scope'
import { Document } from '@typed/dom'
import * as Fx from '@typed/fx'
import { Wire } from '@typed/wire'

import { Entry, HydrateEntry } from './Entry.js'
import { RenderCache } from './RenderCache.js'
import { RenderContext } from './RenderContext.js'
import { TemplateResult } from './TemplateResult.js'
import { getRenderCache } from './getCache.js'
import { handleEffectPart, handlePart, unwrapRenderable } from './makeUpdate.js'
import { nodeToHtml } from './part/NodePart.js'
import { Part } from './part/Part.js'
import { ParentChildNodes } from './paths.js'
import type { Rendered } from './render.js'

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
        }

        return Fx.switchMapEffect(what, (template) => renderRootResult(input, template))
      }).addTrace(trace),
)

type RenderResultInput = {
  readonly where: HTMLElement
  readonly document: Document
  readonly renderContext: RenderContext
}

function renderRootResult(input: RenderResultInput, template: TemplateResult) {
  const { document, renderContext, where } = input
  const cache = getRenderCache(where, renderContext.renderCache)

  return Effect.gen(function* ($) {
    const parentChildNodes = findRootParentChildNodes(where)

    const wire = yield* $(
      renderTemplateResult(document, renderContext, template, cache, parentChildNodes),
      Effect.provideSomeContext(template.context),
    )

    if (wire !== cache.wire) {
      if (cache.wire && !wire) where.removeChild(cache.wire as Node)

      cache.wire = wire as Wire | Node | null
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

function renderTemplateResult(
  document: Document,
  renderContext: RenderContext,
  result: TemplateResult,
  cache: RenderCache,
  where: ParentChildNodes,
): Effect.Effect<Document | RenderContext | Scope, never, Rendered | null> {
  return Effect.gen(function* ($) {
    let { entry } = cache

    if (!entry || entry.template !== result.template) {
      // The entry is changing, so we need to cleanup the previous one
      if (cache.entry) {
        yield* $(cache.entry.cleanup)
      }

      printParentChildNodes(where)
      console.log(result.template.join(''), ...result.values)

      cache.entry = entry = yield* $(HydrateEntry(document, renderContext, result, where))

      // Render all children before creating the wire
      if (entry.parts.length > 0) {
        yield* $(renderPlaceholders(document, renderContext, result, cache, entry, where))
      }
    }

    // Lazily creates the wire after all childNodes are available
    return entry.wire()
  })
}

function renderPlaceholders(
  document: Document,
  renderContext: RenderContext,
  { values, sink, context }: TemplateResult,
  renderCache: RenderCache,
  { parts, onValue, onReady, fibers }: Entry,
  where: ParentChildNodes,
): Effect.Effect<Scope, never, void> {
  const renderNode = (value: unknown, index: number, cache: RenderCache) =>
    Effect.suspend(() => {
      // If the value is a TemplateResult, we need to render it recusively
      if (value instanceof TemplateResult) {
        return renderTemplateResult(
          document,
          renderContext,
          value,
          cache,
          findTemplateResultParentChildNodes(where, index),
        )
      }

      return Effect.succeed(value)
    })

  const renderPart = (part: Part, index: number) =>
    Effect.gen(function* ($) {
      const value = values[index]

      switch (part._tag) {
        // Nodes needs special handling as they support arrays, and other TemplateResults
        case 'Node': {
          fibers[index] = yield* $(
            unwrapRenderable(value),
            Fx.switchMatchCauseEffect(sink.error, (x) =>
              pipe(
                renderNode(
                  x,
                  index,
                  renderCache.stack[index] || (renderCache.stack[index] = RenderCache()),
                ),
                Effect.flatMap(part.update),
                Effect.flatMap(() => onValue(index)),
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
    Effect.tap(() => Effect.log(`Rendered Placeholders`)),
    Effect.catchAllCause(sink.error),
    Effect.provideSomeContext(context),
  )
}

function findRootParentChildNodes(where: HTMLElement): ParentChildNodes {
  const childNodes = findRootChildNodes(where)

  return {
    parentNode: where,
    childNodes,
  }
}

function findRootChildNodes(where: HTMLElement): Node[] {
  const childNodes: Node[] = []

  let start = 0
  let end = childNodes.length

  for (let i = 0; i < where.childNodes.length; i++) {
    const node = where.childNodes[i]

    if (node.nodeType === node.COMMENT_NODE) {
      if (node.nodeValue === 'typed-start') {
        start = i + 1
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

  for (let i = start; i < end; i++) {
    childNodes.push(where.childNodes[i])
  }

  return childNodes
}

function findTemplateResultParentChildNodes(
  { childNodes }: ParentChildNodes,
  index: number,
): ParentChildNodes {
  let start = 0

  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i]

    if (isElement(node) && node.dataset.typed === index.toString()) {
      start = i
    }
  }

  const parentNode = childNodes[start]

  return {
    parentNode,
    childNodes: parentNode.childNodes,
  }
}

function isElement(node: Node): node is HTMLElement {
  return node.nodeType === node.ELEMENT_NODE
}

function printParentChildNodes(x: ParentChildNodes) {
  console.log({
    parentNode: x.parentNode ? nodeToHtml(x.parentNode) : 'null',
    childNodes: Array.from(x.childNodes).map(nodeToHtml),
  })
}

function* makeIdGenerator() {
  let id = 0

  while (true) {
    yield id++
  }
}
