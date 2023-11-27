import { diffable, isComment } from "@typed/wire"
import udomdiff from "udomdiff"
import type { RenderContext } from "../RenderContext"
import type { RenderEvent } from "../RenderEvent"
import { isRenderEvent } from "../RenderEvent"
import { NodePartImpl } from "./parts"
import { findHoleComment, isCommentWithValue } from "./utils"

export function makeRenderNodePart(
  index: number,
  parent: HTMLElement | SVGElement,
  ctx: RenderContext,
  document: Document,
  isHydrating: boolean
) {
  const comment = findHoleComment(parent, index)
  let text: Text
  let nodes = isHydrating ? findPreviousNodes(comment, index) : []

  return new NodePartImpl(index, ({ part, value }) => {
    return ctx.queue.add(part, () => {
      matchValue(value, (content) => {
        if (text === undefined) {
          text = document.createTextNode("")
        }
        text.textContent = content

        nodes = diffChildren(comment, nodes, [text], document)
      }, (updatedNodes) => {
        nodes = diffChildren(comment, nodes, updatedNodes, document)
      })
    })
  }, nodes)
}

export function getPreviousTextSibling(node: Node | null) {
  if (!node) return null

  if (node && node.nodeType === node.TEXT_NODE) {
    // During hydration there should be a comment to separate these values
    if (
      node.previousSibling &&
      isComment(node.previousSibling) &&
      isCommentWithValue(node.previousSibling, "text")
    ) {
      return node as Text
    }
  }

  return null
}

export function notIsEmptyTextNode(node: Node) {
  if (node.nodeType === node.COMMENT_NODE) {
    return node.nodeValue?.trim() === ""
  }

  return true
}

export function findPreviousNodes(comment: Comment, index: number) {
  const previousIndex = `hole${index - 1}`

  const nodes: Array<Node> = []

  let node = comment.previousSibling
  while (node && !isCommentWithValue(node, previousIndex) && !isCommentWithValue(node, "text")) {
    nodes.unshift(node)
    node = node.previousSibling
  }

  return nodes
}

export function diffChildren(
  comment: Comment,
  currentNodes: Array<Node>,
  nextNodes: Array<Node>,
  document: Document
) {
  return udomdiff(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    comment.parentNode!,
    // Document Fragments cannot be removed, so we filter them out
    currentNodes.filter((x) => x.nodeType !== x.DOCUMENT_FRAGMENT_NODE),
    nextNodes.flatMap(flattenRenderEvent),
    diffable(document),
    comment
  )
}

function flattenRenderEvent(x: Node | RenderEvent): Array<Node> {
  if (isRenderEvent(x)) {
    const value = x.valueOf()

    return Array.isArray(value) ? value : [value]
  } else {
    return [x]
  }
}

function matchValue<A, B>(value: unknown, onText: (text: string) => A, onNodes: (nodes: Array<Node>) => B): A | B {
  switch (typeof value) {
    // primitives are handled as text content
    case "string":
    case "symbol":
    case "number":
    case "bigint":
    case "boolean":
      return onText(String(value))
    case "undefined":
    case "object": {
      if (!value) {
        return onNodes([])
      } else if (Array.isArray(value)) {
        // arrays can be used to cleanup, if empty
        if (value.length === 0) return onNodes([])
        // or diffed, if these contains nodes or "wires"
        else if (value.some((x) => typeof x === "object")) {
          return onNodes(
            value.flatMap((x) => (x === null ? [] : [isRenderEvent(x) ? x.valueOf() : x]))
          )
        } // in all other cases the content is stringified as is
        else return onText(String(value))
      } else {
        return onNodes([isRenderEvent(value) ? (value.valueOf() as Node) : (value as Node)])
      }
    }
    case "function":
      return onNodes([])
  }
}
