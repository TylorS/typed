import { diffChildren } from '../diffChildren.js'

import { BasePart } from './BasePart.js'

export class NodePart extends BasePart<void> {
  readonly _tag = 'Node'

  protected text: Text | undefined
  protected nodes: Node[] = []

  constructor(document: Document, readonly comment: Comment) {
    super(document, false)
  }

  /**
   * @internal
   */
  handle(newValue: unknown) {
    const { document, comment } = this

    switch (typeof newValue) {
      // primitives are handled as text content
      case 'string':
      case 'number':
      case 'boolean': {
        if (!this.text) this.text = this.document.createTextNode('')
        const { text } = this

        text.data = String(newValue)

        this.nodes = diffChildren(comment, this.nodes, [text], document)

        return
      }
      // null, and undefined are used to cleanup previous content
      case 'object':
      case 'undefined': {
        if (newValue == null) {
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
  }
}
