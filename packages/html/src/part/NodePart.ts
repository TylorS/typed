import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'
import { diffable } from '@typed/wire'
import udomdiff from 'udomdiff'

import { DomRenderEvent, HtmlRenderEvent, isRenderEvent } from '../RenderEvent.js'
import { Renderable } from '../Renderable.js'
import { findHoleComment, isComment, isCommentWithValue } from '../utils.js'

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
    return Effect.suspend(() => {
      switch (typeof newValue) {
        // primitives are handled as text content
        case 'string':
        case 'number':
        case 'boolean': {
          return this.handleText(newValue)
        }
        // null, and undefined are used to cleanup previous content
        case 'object':
        case 'undefined': {
          if (!newValue) {
            return this.handleDiff([])
          }
          // arrays and nodes have a special treatment
          else if (Array.isArray(newValue)) {
            // arrays can be used to cleanup, if empty
            if (newValue.length === 0) return this.handleDiff([])
            // or diffed, if these contains nodes or "wires"
            else if (newValue.some((x) => typeof x === 'object'))
              return this.handleDiff(newValue.filter((x) => x !== null))
            // in all other cases the content is stringified as is
            else this.setValue(String(newValue))
          } else {
            return this.handleDiff([newValue as Node])
          }
        }
      }
      return Effect.unit()
    })
  }

  observe<R, E, R2>(
    placeholder: Renderable<R, E>,
    sink: Fx.Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2 | Scope.Scope, never, void> {
    return Effect.forkScoped(
      Fx.drain(
        Fx.switchMatchCauseEffect(unwrapRenderable(placeholder), sink.error, (a: any) =>
          Effect.flatMap(
            this.update(
              isRenderEvent(a) ? (a as HtmlRenderEvent).html || (a as DomRenderEvent).rendered : a,
            ),
            () => sink.event(this.value),
          ),
        ),
      ),
    )
  }

  static fromParentElemnt(document: Document, parent: Element, index: number, isHydrating = false) {
    const comment = findHoleComment(parent, index)
    const previousNodes = isHydrating ? findPreviousNodes(comment, index) : []

    let text: Text

    return new NodePart(
      index,
      (prev, next) => Effect.sync(() => diffChildren(comment, prev, next, document)),
      (content) =>
        Effect.sync(() => {
          if (!text) {
            text = isHydrating
              ? getPreviousTextSibling(comment.previousSibling) || document.createTextNode('')
              : document.createTextNode('')
          }
          text.textContent = content

          return text
        }),
      previousNodes,
    )
  }

  protected handleText(newValue: unknown) {
    return Effect.tap(
      Effect.flatMap(this.setTextNode(String(newValue)), (text) =>
        this.diffChildren(this.nodes, [text], true),
      ),
      (nodes) => Effect.sync(() => (this.nodes = nodes)),
    )
  }

  protected handleDiff(next: Node[]) {
    return Effect.tap(this.diffChildren(this.nodes, next, false), (nodes) =>
      Effect.sync(() => (this.nodes = nodes)),
    )
  }
}

export function getPreviousTextSibling(node: Node | null) {
  if (!node) return null

  if (node && node.nodeType === node.TEXT_NODE) {
    // During hydration there should be a comment to separate these values
    if (
      node.previousSibling &&
      isComment(node.previousSibling) &&
      isCommentWithValue(node.previousSibling, 'text')
    ) {
      return node as Text
    }
  }

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
  while (node && !isCommentWithValue(node, previousIndex) && !isCommentWithValue(node, 'text')) {
    nodes.unshift(node)
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
