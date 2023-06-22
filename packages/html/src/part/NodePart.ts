import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'
import { diffable } from '@typed/wire'
import udomdiff from 'udomdiff'

import { Renderable } from '../Renderable.js'
import { findHoleComment, isCommentWithValue } from '../utils.js'

import { BasePart } from './BasePart.js'
import { unwrapRenderable } from './updates.js'

export class NodePart extends BasePart<unknown> {
  readonly _tag = 'Node'

  constructor(
    index: number,
    protected diffChildren: (
      previous: Node[],
      updated: Node[],
      isText: boolean,
    ) => Effect.Effect<never, never, Node[]>,
    protected setTextNode: (text: string) => Effect.Effect<never, never, Text>,
    protected nodes: Node[] = [],
  ) {
    super(index, nodes.length === 1 ? nodes[0] : nodes.filter(notIsEmptyTextNode))
  }

  getValue(u: unknown) {
    return u
  }

  setValue(newValue: unknown): Effect.Effect<never, never, unknown> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this

    return Effect.gen(function* ($) {
      switch (typeof newValue) {
        // primitives are handled as text content
        case 'string':
        case 'number':
        case 'boolean': {
          const text = yield* $(that.setTextNode(String(newValue)))
          that.nodes = yield* $(that.diffChildren(that.nodes, [text], true))

          break
        }
        // null, and undefined are used to cleanup previous content
        case 'object':
        case 'undefined': {
          if (!newValue) {
            that.nodes = yield* $(that.diffChildren(that.nodes, [], false))
          }
          // arrays and nodes have a special treatment
          else if (Array.isArray(newValue)) {
            // arrays can be used to cleanup, if empty
            if (newValue.length === 0)
              that.nodes = yield* $(that.diffChildren(that.nodes, [], false))
            // or diffed, if these contains nodes or "wires"
            else if (newValue.some((x) => typeof x === 'object'))
              that.nodes = yield* $(
                that.diffChildren(
                  that.nodes,
                  // We can't diff null values, so we filter them out
                  newValue.filter((x) => x !== null),
                  false,
                ),
              )
            // in all other cases the content is stringified as is
            else yield* $(that.setValue(String(newValue)))
          } else {
            that.nodes = yield* $(that.diffChildren(that.nodes, [newValue as Node], false))
          }

          break
        }
      }
    })
  }

  observe<R, E, R2>(
    placeholder: Renderable<R, E>,
    sink: Fx.Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2 | Scope.Scope, never, void> {
    return Fx.drain(
      Fx.switchMatchCauseEffect(unwrapRenderable(placeholder), sink.error, sink.event),
    )
  }

  static fromParentElemnt(document: Document, parent: Element, index: number) {
    const comment = findHoleComment(parent, index)
    const previousNodes = findPreviousNodes(comment, index)

    let text: Text

    return new NodePart(
      index,
      (prev, next) => Effect.sync(() => diffChildren(comment, prev, next, document)),
      (content) =>
        Effect.sync(() => {
          if (!text) {
            text = getPreviousTextSibling(comment.previousSibling) || document.createTextNode('')
          }
          text.textContent = content

          return text
        }),
      previousNodes,
    )
  }
}

export function getPreviousTextSibling(node: Node | null) {
  if (!node) return null

  if (node && node.nodeType === 3) return node as Text

  return null
}

export function notIsEmptyTextNode(node: Node) {
  if (node.nodeType === node.COMMENT_NODE) {
    return node.nodeValue?.trim() === ''
  }

  return true
}

export function findPreviousNodes(comment: Comment, index: number) {
  const previousIndex = `hole${index - 1}`

  const nodes: Node[] = []

  let node = comment.previousSibling
  while (node && !isCommentWithValue(node, previousIndex)) {
    nodes.push(node)
    node = node.previousSibling
  }

  return nodes
}

export function diffChildren(
  comment: Comment,
  currentNodes: Node[],
  nextNodes: Node[],
  document: Document,
) {
  return udomdiff(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    comment.parentNode!,
    // Document Fragments cannot be removed, so we filter them out
    currentNodes.filter((x) => x.nodeType !== x.DOCUMENT_FRAGMENT_NODE),
    nextNodes,
    diffable(document),
    comment,
  )
}
