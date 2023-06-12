import * as Effect from '@effect/io/Effect'

import { BasePart } from './BasePart.js'
import { removeAttribute, replaceAttribute } from './templateHelpers.js'

export class BooleanPart extends BasePart<never, never> {
  readonly _tag = 'Boolean'

  constructor(document: Document, readonly element: Element, readonly attributeName: string) {
    super(document, element.hasAttribute(attributeName))
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
    return Effect.sync(() => this.element.toggleAttribute(this.attributeName, newValue))
  }

  /**@internal */
  getHTML(template: string) {
    const { attributeName } = this

    if (this.value) {
      return replaceAttribute(`\\?${attributeName}`, attributeName, template)
    }

    return removeAttribute(`\\?${attributeName}`, template)
  }

  setValue(bool: boolean) {
    this.update(bool)
  }

  toggle() {
    this.update(!this.value)
  }
}
