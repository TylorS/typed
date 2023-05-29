import * as Option from '@effect/data/Option'
import { Effect } from '@effect/io/Effect'

import { isElementRef } from '../ElementRef.js'

import { BasePart } from './BasePart.js'

export class RefPart extends BasePart<Effect<never, never, Option.Option<HTMLElement>> | void> {
  readonly _tag = 'Ref'

  constructor(document: Document, readonly element: HTMLElement) {
    super(document)
  }

  /**
   * @internal
   */
  handle(value: unknown) {
    if (value == null) {
      return
    }

    if (isElementRef(value)) {
      return value.set(Option.some(this.element))
    }

    console.error(`Unexpected value for ref of `, this.element, `:`, value)

    throw new Error(`Unexpected value for ref: ${JSON.stringify(value)}`)
  }
}
