import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'

import { isElementRef } from '../ElementRef.js'

import { BasePart } from './BasePart.js'
import { removeAttribute } from './templateHelpers.js'

export class RefPart extends BasePart<never, never> {
  readonly _tag = 'Ref'

  constructor(document: Document, readonly element: HTMLElement) {
    super(document)
  }

  /**
   * @internal
   */
  handle(value: unknown) {
    if (!value) {
      return Effect.unit()
    }

    if (isElementRef(value)) {
      return value.set(Option.some(this.element))
    }

    console.error(`Unexpected value for RefPart`)
    console.error(`Element:`, this.element)
    console.error(`Value:`, value)

    throw new Error(`Unexpected value for ref: ${JSON.stringify(value)}`)
  }

  /**
   * @internal
   */
  getHTML(template: string): string {
    return removeAttribute('ref', template)
  }
}
