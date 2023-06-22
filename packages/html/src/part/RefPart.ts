import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import { Sink } from '@typed/fx'

import { Renderable } from '../Renderable.js'

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

  observe<R, E, R2>(
    placeholder: Renderable<R, E>,
    sink: Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2, never, void> {
    return Effect.catchAllCause(this.update(this.getValue(placeholder)), sink.error)
  }

  static fromElement(element: HTMLElement, index: number) {
    return new RefPart(
      Effect.sync(() => element),
      index,
    )
  }
}
