import * as Effect from '@effect/io/Effect'
import { Sink } from '@typed/fx'

import { Renderable } from '../Renderable.js'

import { BasePart } from './BasePart.js'
import { handlePart } from './updates.js'

export class AttrPart extends BasePart<string | null> {
  readonly _tag = 'Attr' as const

  constructor(
    protected setAttribute: (value: string) => Effect.Effect<never, never, void>,
    protected removeAttribute: () => Effect.Effect<never, never, void>,
    index: number,
    value: string | null = null,
  ) {
    super(index, value)
  }

  protected getValue(value: unknown): string | null {
    if (value == null) return null

    return String(value)
  }

  protected setValue(value: string | null): Effect.Effect<never, never, void> {
    return Effect.suspend(() => {
      if (value === null) {
        return this.removeAttribute()
      } else {
        return this.setAttribute(value)
      }
    })
  }

  observe<R, E, R2>(
    placeholder: Renderable<R, E>,
    sink: Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2, never, void> {
    return Effect.matchCauseEffect(handlePart(this, placeholder), sink.error, (fx) =>
      fx ? fx.run(sink) : sink.event(this.value),
    )
  }

  static fromElement(element: Element, name: string, index: number) {
    const setAttribute = (value: string) => Effect.sync(() => element.setAttribute(name, value))
    const removeAttribute = () => Effect.sync(() => element.removeAttribute(name))

    return new AttrPart(setAttribute, removeAttribute, index, element.getAttribute(name))
  }
}
