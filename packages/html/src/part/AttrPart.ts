import { BasePart } from './BasePart.js'

const getValue = (value: any) => (value == null ? value : value.valueOf())

export class AttrPart extends BasePart<void> {
  readonly _tag = 'Attr'

  protected orphaned = true

  constructor(document: Document, readonly element: HTMLElement, readonly attributeNode: Attr) {
    super(document, false)
  }

  /**
   * @internal
   */
  getValue(value: unknown) {
    return getValue(value)
  }

  /**
   * @internal
   */
  handle(newValue: unknown) {
    const { attributeNode } = this

    if (newValue == null) {
      if (!this.orphaned) {
        this.element.removeAttributeNode(attributeNode)
        this.orphaned = true
      }
    } else {
      attributeNode.value = String(newValue)

      if (this.orphaned) {
        this.element.setAttributeNodeNS(attributeNode)
        this.orphaned = false
      }
    }
  }
}
