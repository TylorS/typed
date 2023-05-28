import { BasePart } from './BasePart.js'

export class TextPart extends BasePart<void> {
  constructor(readonly node: Node) {
    super()
  }

  update(newValue: unknown) {
    this.node.textContent = newValue == null ? '' : String(newValue)
  }
}
