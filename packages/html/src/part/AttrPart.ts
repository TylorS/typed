import * as Effect from '@effect/io/Effect'

import { BasePart } from './BasePart.js'
import { addQuotations } from './templateHelpers.js'

const getValue = (value: any) => (!value ? value : value.valueOf())

export class AttrPart extends BasePart<never, never> {
  readonly _tag = 'Attr'

  protected orphaned = true

  constructor(document: Document, readonly element: HTMLElement, readonly attributeNode: Attr) {
    super(document, attributeNode.value)
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
    return Effect.sync(() => {
      const { attributeNode } = this

      if (!newValue) {
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
    })
  }

  /**
   * @internal
   */
  getHTML(template: string): string {
    return addQuotations(template, this.attributeNode.value)
  }
}
