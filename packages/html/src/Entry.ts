import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { Wire, persistent } from '@typed/wire'

import { RenderCache } from './RenderCache.js'
import type { RenderContext } from './RenderContext.js'
import { Renderable } from './Renderable.js'
import { TemplateResult } from './TemplateResult.js'
import { getTemplateCache } from './getCache.js'
import { holeToPart } from './holeToPart.js'
import { Part } from './part/Part.js'
import { ParentChildNodes, findPath } from './paths.js'

export interface Entry {
  cleanup: Effect.Effect<never, never, void>
  fibers: Fiber.Fiber<any, any>[]
  onReady: Effect.Effect<never, never, void>
  onValue: (index: number) => Effect.Effect<never, never, void>
  parts: readonly Part[]
  template: TemplateStringsArray
  values: readonly Renderable<any, any>[]
  wire: () => Node | DocumentFragment | Wire | Node[] | null

  // Only for hydration
  rootElements: readonly Node[]
  indexToRootElement: Map<number, Node>
}

export function Entry(
  document: Document,
  renderContext: RenderContext,
  result: TemplateResult,
  cache: RenderCache,
) {
  // eslint-disable-next-line require-yield
  return Effect.gen(function* ($) {
    const { template, deferred } = result
    const { content, holes } = getTemplateCache(document, renderContext.templateCache, result)
    const { onReady, onValue } = yield* $(indexRefCounter(holes.length))
    const parts = holes.map((hole) => holeToPart(document, hole, findPath(content, hole.path)))
    const fibers: Fiber.Fiber<any, any>[] = Array(parts.length)

    const cleanup = Effect.forkDaemon(
      Effect.allPar(
        Effect.suspend(() => {
          cache.stack.fill(null)
          return Fiber.interruptAll(fibers)
        }),
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
      values: result.values,
      wire: () => wire || (wire = persistent(content)),
      rootElements: [],
      indexToRootElement: new Map(),
    } satisfies Entry
  })
}

function indexRefCounter(expected: number) {
  return Effect.gen(function* ($) {
    if (expected === 0) {
      return {
        onReady: Effect.unit(),
        onValue: () => Effect.unit(),
      }
    }

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
  cache: RenderCache,
  where: ParentChildNodes,
  isRoot: boolean,
  rootIndex: number,
) {
  return Effect.gen(function* ($) {
    const { template, deferred } = result
    const { holes } = getTemplateCache(document, renderContext.templateCache, result)
    const { onReady, onValue } = yield* $(indexRefCounter(holes.length))
    const rootElements = findRootElements(where, rootIndex)
    const indexToRootElement = new Map<number, Node>()
    let lastRootElementIndex = 0
    let lastCommentIndex = 0
    const parts = holes.map((hole, i) => {
      if (hole.type === 'node') {
        const [rootElement, elementIndex] = findRootElement(
          document,
          rootElements,
          i,
          lastRootElementIndex,
        )

        if (elementIndex !== lastRootElementIndex) {
          lastCommentIndex = 0
        }

        lastRootElementIndex = elementIndex
        indexToRootElement.set(i, rootElement)

        const [comment, commentIndex] = findCommentNode(rootElement.childNodes, i, lastCommentIndex)

        lastCommentIndex = commentIndex

        return holeToPart(document, hole, comment, (comment) => getPreviousNodes(comment, i))
      }

      return holeToPart(document, hole, findPath(where, hole.path))
    })
    const fibers: Fiber.Fiber<any, any>[] = Array(parts.length)

    const cleanup = Effect.forkDaemon(
      Effect.allPar(
        Effect.suspend(() => {
          cache.stack.fill(null)

          return Fiber.interruptAll(fibers)
        }),
        Deferred.succeed(deferred, undefined),
      ),
    )

    const wire = (() => {
      if (isRoot) {
        const childNodes = Array.from(where.childNodes).filter((node) =>
          isComment(node) ? !isCommentWithValue(node, 'typed-end') : true,
        )

        if (childNodes.length === 1) {
          return childNodes[0]
        }

        return childNodes
      }

      if (rootElements.length === 1) {
        return rootElements[0]
      }

      return rootElements
    })()

    return {
      template,
      cleanup,
      onReady,
      onValue,
      parts,
      fibers,
      values: result.values,
      wire: () => wire,
      rootElements,
      indexToRootElement,
    } satisfies Entry
  })
}

export function findCommentNode(
  childNodes: ArrayLike<Node>,
  index: number,
  lastCommentIndex = 0,
): readonly [Comment, number] {
  const value = `hole${index}`

  for (let i = lastCommentIndex; i < childNodes.length; ++i) {
    const node = childNodes[i]

    if (
      node.nodeType === node.COMMENT_NODE &&
      (node.nodeValue === value || node.nodeValue === 'typed-end')
    ) {
      return [node as Comment, i]
    }
  }

  throw new CouldNotFindCommentError(index)
}

export class CouldNotFindCommentError extends Error {
  constructor(index: number) {
    super(`Could not find comment node for <!--hole${index}-->`)
  }
}

export function getPreviousNodes(comment: Node, index: number) {
  const nodes: Node[] = []
  let node = comment.previousSibling
  const previousHole = `hole${index - 1}`

  while (node && node.nodeValue !== previousHole && node.nodeValue !== 'typed-start') {
    nodes.unshift(node)
    node = node.previousSibling
  }

  return nodes
}

export function isElement(node: Node): node is HTMLElement {
  return node.nodeType === node.ELEMENT_NODE
}

export function isTypedRoot(element: HTMLElement, rootIndex: number): element is HTMLElement {
  const typed = element.dataset.typed

  return typed == rootIndex.toString()
}

export function isComment(node: Node): node is Comment {
  return node.nodeType === node.COMMENT_NODE
}

export function isHoleComent(node: Comment, index: number) {
  return node.nodeValue === `hole${index}`
}

export function isCommentWithValue(node: Comment, value: string) {
  return node.nodeValue === value
}

export function findRootElements({ parentNode, childNodes }: ParentChildNodes, rootIndex: number) {
  const elements: HTMLElement[] = []

  for (let i = 0; i < childNodes.length; ++i) {
    const root = childNodes[i]

    if (isElement(root) && isTypedRoot(root, rootIndex)) {
      elements.push(root)
    }
  }

  // Special case for root templates
  if (elements.length === 0 && parentNode) {
    return [parentNode as HTMLElement]
  }

  return elements
}

export function findRootElement(
  document: Document,
  rootElements: readonly Node[],
  partIndex: number,
  lastRootElementIndex = 0,
) {
  for (let i = lastRootElementIndex; i < rootElements.length; ++i) {
    const root = rootElements[i]
    const iterator = document.createNodeIterator(root, 128)

    let node = iterator.nextNode()

    while (node) {
      if (isHoleComent(node as Comment, partIndex)) {
        return [root, i] as const
      }

      node = iterator.nextNode()
    }
  }

  throw new CouldNotFindRootElement(partIndex)
}

export class CouldNotFindRootElement extends Error {
  constructor(index: number) {
    super(`Could not root element for <!--hole${index}-->`)
  }
}
