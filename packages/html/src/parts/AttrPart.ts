import { BasePart } from './BasePart.js'

const getValue = (value: any) => (value == null ? value : value.valueOf())

export class AttrPart extends BasePart<void> {
  protected orphaned = true

  constructor(readonly element: Element, readonly attributeNode: Attr) {
    super(false)
  }

  getValue(value: unknown): unknown {
    return getValue(value)
  }

  update(newValue: unknown) {
    const { attributeNode } = this

    if (newValue == null) {
      if (!this.orphaned) {
        this.element.removeAttributeNode(attributeNode)
        this.orphaned = true
      }
    } else {
      attributeNode.value = newValue as string

      if (this.orphaned) {
        this.element.setAttributeNodeNS(attributeNode)
        this.orphaned = false
      }
    }
  }
}
