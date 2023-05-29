import { BasePart } from './BasePart.js'

export class TextPart extends BasePart<void> {
  readonly _tag = 'Text'

  constructor(document: Document, readonly node: Node) {
    super(document)
  }

  /**
   * @internal
   */
  handle(newValue: unknown) {
    this.node.textContent = newValue == null ? '' : String(newValue)
  }
}
