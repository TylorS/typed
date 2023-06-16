import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'

import { BasePart } from './BasePart.js'

import { ElementRef, isElementRef } from '@typed/html/ElementRef.js'

export class RefPart extends BasePart<ElementRef<HTMLElement> | null> {
  readonly _tag = 'Ref' as const

  constructor(readonly getElement: Effect.Effect<never, never, HTMLElement | null>, index: number) {
    super(index, null)
  }

  protected getValue(value: unknown) {
    if (value == null) return null
    if (isElementRef(value)) return value

    console.error(`Unexpected value for RefPart`)
    console.error(`Value:`, value)

    throw new Error(`Unexpected value for ref: ${JSON.stringify(value)}`)
  }

  protected setValue(ref: ElementRef<HTMLElement> | null) {
    if (ref) {
      return Effect.flatMap(this.getElement, (e) => ref.set(Option.fromNullable(e)))
    }

    return Effect.unit()
  }

  getHTML(): string {
    return ''
  }

  static fromElement(element: HTMLElement, index: number) {
    return new RefPart(
      Effect.sync(() => element),
      index,
    )
  }
}
