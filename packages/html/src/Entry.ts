import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { Wire, persistent } from '@typed/wire'

import type { RenderContext } from './RenderContext.js'
import { TemplateResult } from './TemplateResult.js'
import { getTemplateCache } from './getCache.js'
import { holeToPart } from './holeToPart.js'
import { nodeToHtml } from './part/NodePart.js'
import { Part } from './part/Part.js'
import { ParentChildNodes, findPath } from './paths.js'

export interface Entry {
  cleanup: Effect.Effect<never, never, void>
  fibers: Fiber.Fiber<any, any>[]
  onReady: Effect.Effect<never, never, void>
  onValue: (index: number) => Effect.Effect<never, never, void>
  parts: readonly Part[]
  template: TemplateStringsArray
  wire: () => Node | DocumentFragment | Wire | Node[] | null
}

export function Entry(document: Document, renderContext: RenderContext, result: TemplateResult) {
  // eslint-disable-next-line require-yield
  return Effect.gen(function* ($) {
    const { template, deferred } = result
    const { content, holes } = getTemplateCache(document, renderContext.templateCache, result)
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

export function HydrateEntry(
  document: Document,
  renderContext: RenderContext,
  result: TemplateResult,
  where: ParentChildNodes,
) {
  // TODO: Bail out of hydration if any nodes can't be found
  return Effect.gen(function* ($) {
    const { template, deferred } = result
    const { holes } = getTemplateCache(document, renderContext.templateCache, result)
    const { onReady, onValue } = yield* $(indexRefCounter(holes.length))
    const parts = holes.map((hole, i) => {
      if (hole.type === 'node') {
        return holeToPart(document, hole, findCommentNode(where, i), (comment) => {
          return []
          return getPreviousNodes(comment, i)
        })
      }

      return holeToPart(document, hole, findPath(where, hole.path))
    })
    const fibers: Fiber.Fiber<any, any>[] = Array(parts.length)

    const cleanup = Effect.forkDaemon(
      Effect.allPar(
        Effect.suspend(() => Fiber.interruptAll(fibers)),
        Deferred.succeed(deferred, undefined),
      ),
    )

    return {
      template,
      cleanup,
      onReady,
      onValue,
      parts,
      fibers,
      wire: () => Array.from(where.childNodes),
    } satisfies Entry
  })
}

function findCommentNode(where: ParentChildNodes, index: number): Comment {
  const { childNodes } = where

  for (let i = 0; i < childNodes.length; ++i) {
    const node = childNodes[i]

    if (node.nodeType === node.ELEMENT_NODE) {
      if ((node as HTMLElement).dataset['typed'] === '-1')
        return findCommentNode({ parentNode: node, childNodes: node.childNodes }, index)
      if ((node as HTMLElement).dataset['typed'] === String(index))
        return findCommentNode({ parentNode: node, childNodes: node.childNodes }, index)
    }

    if (node.nodeType === node.COMMENT_NODE && node.nodeValue === `hole${index}`) {
      return node as Comment
    }
  }

  throw new Error(`Could not find comment node for index ${index}`)
}

function getPreviousNodes(comment: Node, index: number) {
  const nodes: Node[] = []
  let node = comment.previousSibling
  const previousHole = `hole${index - 1}`

  while (node && node.nodeValue !== previousHole) {
    if (node.nodeType !== node.COMMENT_NODE) {
      nodes.push(node)
    }

    node = node.previousSibling
  }

  return nodes
}
