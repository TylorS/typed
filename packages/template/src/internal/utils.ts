import { getOption } from "@typed/context"
import * as Chunk from "effect/Chunk"
import type * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { isSome } from "effect/Option"
import { TestClock } from "effect/TestClock"
import { TEXT_START, TYPED_START } from "../Meta"

export function isComment(node: Node): node is Comment {
  return node.nodeType === node.COMMENT_NODE
}

export function isCommentWithValue(node: Node, value: string): node is Comment {
  return isComment(node) && node.nodeValue === value
}

export function isHtmlElement(node: Node): node is HTMLElement {
  return node.nodeType === node.ELEMENT_NODE
}

export function findHoleComment(parent: Element, index: number) {
  const childNodes = parent.childNodes

  for (let i = 0; i < childNodes.length; ++i) {
    const node = childNodes[i]

    if (node.nodeType === 8 && node.nodeValue === `hole${index}`) {
      return node as Comment
    }
  }

  throw new Error(`Unable to find hole comment for index ${index}`)
}

const previousComments = new Set([TEXT_START, TYPED_START])

export function getPreviousNodes(comment: Node, index: number) {
  const nodes: Array<Node> = []
  let node = comment.previousSibling
  const previousHole = `hole${index - 1}`

  previousComments.add(previousHole)

  while (node && !previousComments.has(String(node.nodeValue))) {
    nodes.unshift(node)
    node = node.previousSibling
  }

  previousComments.delete(previousHole)

  return nodes
}

export const findPath = (node: ParentChildNodes, path: Chunk.Chunk<number>): Node =>
  Chunk.reduce(path, node, ({ childNodes }, index) => childNodes[index]) as Node

export interface ParentChildNodes {
  readonly parentNode: Node | null
  readonly childNodes: ArrayLike<Node>
}

export function adjustTime(input?: Duration.DurationInput) {
  return Effect.gen(function*(_) {
    const ctx = yield* _(Effect.context<never>())
    const testClock = getOption(ctx, TestClock)

    if (isSome(testClock)) {
      yield* _(testClock.value.adjust(input ?? 1))
    } else if (input) {
      yield* _(Effect.sleep(input))
    }
  })
}
