import { sync } from '@effect/io/Effect'

import { diffChildren } from '../diffChildren.js'

import { BasePart } from './BasePart.js'
import { nodeToHtml } from './templateHelpers.js'

export class NodePart extends BasePart<never, never> {
  readonly _tag = 'Node'

  protected text: Text | undefined

  constructor(document: Document, readonly comment: Comment, protected nodes: Node[] = []) {
    super(document, nodes.length === 1 ? nodes[0] : nodes)
  }

  /**
   * @internal
   */
  handle(newValue: unknown) {
    return sync(() => {
      const { document, comment } = this

      switch (typeof newValue) {
        // primitives are handled as text content
        case 'string':
        case 'number':
        case 'boolean': {
          const text = this.manageTextNode(String(newValue))

          this.nodes = diffChildren(comment, this.nodes, [text], document)

          return
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
            else this.handle(String(newValue))
          } else {
            this.nodes = diffChildren(comment, this.nodes, [newValue as Node], document)
          }

          return
        }
      }
    })
  }

  /**
   * @internal
   */
  getHTML(template: string): string {
    // If there is just text, we need to add a comment to ensure a separate text node is created.
    if (this.text) return `${template}<!--text-start-->${this.text.nodeValue}` + nodeToHtml(this.comment)

    const base = `${template}${this.nodes.map(nodeToHtml).join('')}`

    return `${base}${nodeToHtml(this.comment)}`
  }

  protected manageTextNode(content: string) {
    if (!this.text) {
      const previous = getPreviousTextSibling(this.comment.previousSibling)

      if (previous && previous.nodeType === 3) {
        this.text = previous as Text
      }

      if (!this.text) {
        this.text = this.document.createTextNode(content)
      }
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
