import { BasePart } from './BasePart.js'

export class BooleanPart extends BasePart<void> {
  constructor(readonly element: Element, readonly attributeName: string) {
    super(false)
  }

  update(newValue: unknown) {
    this.element.toggleAttribute(this.attributeName, !!newValue)
  }
}
