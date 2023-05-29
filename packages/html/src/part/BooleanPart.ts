import { BasePart } from './BasePart.js'

export class BooleanPart extends BasePart<void> {
  readonly _tag = 'Boolean'

  constructor(document: Document, readonly element: Element, readonly attributeName: string) {
    super(document, false)
  }

  /**
   * @internal
   */
  getValue(value: unknown): boolean {
    return !!value
  }

  /**
   * @internal
   */
  handle(newValue: boolean) {
    this.element.toggleAttribute(this.attributeName, !!newValue)
  }

  setValue(bool: boolean) {
    this.update(bool)
  }

  toggle() {
    this.update(!this.value)
  }
}
