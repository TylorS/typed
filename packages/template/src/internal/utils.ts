import { getOption } from "@typed/context"
import * as Chunk from "effect/Chunk"
import type * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { isSome } from "effect/Option"
import { uncapitalize } from "effect/String"
import { TestClock } from "effect/TestClock"
import { TEXT_START, TYPED_START } from "../Meta.js"
import { CouldNotFindCommentError } from "./errors.js"
import { getNodes, type HydrationNode } from "./v2/hydration-template.js"

export function isComment(node: Node): node is Comment {
  return node.nodeType === node.COMMENT_NODE
}

export function isCommentWithValue(node: Node, value: string): node is Comment {
  return isComment(node) && node.nodeValue === value
}

export function isCommentStartingWithValue(node: Node, value: string): node is Comment {
  return isComment(node) && (node.nodeValue?.startsWith(value) ?? false)
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

  throw new CouldNotFindCommentError(index)
}

const previousComments = new Set([TEXT_START, TYPED_START])

export function getPreviousNodes(comment: Node, index: number, hash?: string) {
  const nodes: Array<Node> = []
  let node = comment.previousSibling
  const previousHole = `hole${index - 1}`
  const typedHash = hash ? `typed-${hash}` : ""

  previousComments.add(previousHole)

  while (node) {
    if (isComment(node)) {
      if (previousComments.has(node.data)) {
        break
      }

      if (node.data === typedHash) {
        nodes.unshift(node)
        break
      }
    }

    nodes.unshift(node)
    node = node.previousSibling
  }

  previousComments.delete(previousHole)

  return nodes
}

export const findPath = (node: ParentChildNodes, path: Chunk.Chunk<number>): Node =>
  Chunk.reduce(path, node, ({ childNodes }, index) => childNodes[index]) as Node

export const findHydratePath = (
  node: HydrationNode,
  path: Chunk.Chunk<number>
): Node => {
  if (Chunk.isEmpty(path)) {
    return getNodes(node)[0]
  }

  const [first, ...rest] = path

  let current: Node = getNodes(node)[first]
  for (const index of rest) {
    current = current.childNodes[index]
  }

  return current
}

export interface ParentChildNodes {
  readonly parentNode: Node | null
  readonly childNodes: ArrayLike<Node>
}

export function adjustTime(input?: Duration.DurationInput) {
  return Effect.gen(function*() {
    const ctx = yield* Effect.context<never>()
    const testClock = getOption(ctx, TestClock)

    if (isSome(testClock)) {
      yield* testClock.value.adjust(input ?? 1)
    } else if (input) {
      yield* Effect.sleep(input)
    }
  })
}

export function keyToPartType(key: string) {
  switch (key[0]) {
    case "?":
      return ["boolean", key.slice(1)] as const
    case ".": {
      const propertyName = key.slice(1)

      if (propertyName === "data") {
        return ["data"] as const
      } else if (
        propertyName === "props" || propertyName === "properties"
      ) {
        return ["properties"] as const
      } else {
        return ["property", propertyName] as const
      }
    }
    case "@":
      return ["event", uncapitalize(key.slice(1))] as const
    case "o": {
      if (key[1] === "n") {
        const name = uncapitalize(key.slice(2))
        return ["event", name] as const
      }
    }
  }

  const lower = key.toLowerCase()

  if (lower === "ref") {
    return ["ref"] as const
  } else if (lower === "class" || lower === "classname") {
    return ["class"] as const
  } else {
    return ["attr", key] as const
  }
}
