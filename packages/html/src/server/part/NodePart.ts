import * as Effect from '@effect/io/Effect'

import { diffChildren } from '../../diffChildren.js'
import { nodeToHtml } from '../../part/templateHelpers.js'

import { BasePart } from './BasePart.js'

import { TEXT_START } from '@typed/html/meta.js'

export class NodePart extends BasePart<unknown> {
  readonly _tag = 'Node'

  protected text: Text | null = null

  constructor(
    readonly document: Document,
    readonly comment: Comment,
    index: number,
    protected nodes: Node[] = [],
    protected onUpdated: Effect.Effect<never, never, void> = Effect.unit(),
  ) {
    super(index, nodes.length === 1 ? nodes[0] : nodes.filter(notIsEmptyTextNode))
  }

  getValue(u: unknown) {
    return u
  }

  setValue(newValue: unknown) {
    return Effect.suspend(() => {
      const { document, comment } = this

      switch (typeof newValue) {
        // primitives are handled as text content
        case 'string':
        case 'number':
        case 'boolean': {
          const text = this.manageTextNode(String(newValue))

          this.nodes = diffChildren(comment, this.nodes, [text], document)

          break
        }
        // null, and undefined are used to cleanup previous content
        case 'object':
        case 'undefined': {
          if (!newValue) {
            this.nodes = diffChildren(comment, this.nodes, [], document)
          }
          // arrays and nodes have a special treatment
          else if (Array.isArray(newValue)) {
            // arrays can be used to cleanup, if empty
            if (newValue.length === 0) this.nodes = diffChildren(comment, this.nodes, [], document)
            // or diffed, if these contains nodes or "wires"
            else if (newValue.some((x) => typeof x === 'object'))
              this.nodes = diffChildren(
                comment,
                this.nodes,
                // We can't diff null values, so we filter them out
                newValue.filter((x) => x !== null),
                document,
              )
            // in all other cases the content is stringified as is
            else this.setValue(String(newValue))
          } else {
            this.nodes = diffChildren(comment, this.nodes, [newValue as Node], document)
          }

          break
        }
      }

      return this.onUpdated
    })
  }

  getHTML(): string {
    // If there is just text, we need to add a comment to ensure a separate text node is created.
    if (this.text) return `${TEXT_START}${this.text.nodeValue}` + nodeToHtml(this.comment)

    return `${this.nodes.map(nodeToHtml).join('')}${nodeToHtml(this.comment)}`
  }

  protected manageTextNode(content: string) {
    if (!this.text && this.comment.previousSibling) {
      this.text = getPreviousTextSibling(this.comment.previousSibling)
    }

    if (!this.text) {
      this.text = this.document.createTextNode(content)
    }

    const { text } = this

    text.data = content

    return text
  }
}

function getPreviousTextSibling(node: Node | null) {
  if (!node) return null

  if (node && node.nodeType === 3) return node as Text

  return null
}

function notIsEmptyTextNode(node: Node) {
  if (node.nodeType === node.COMMENT_NODE) {
    return node.nodeValue?.trim() === ''
  }

  return true
}
