import * as Effect from '@effect/io/Effect'
import { Sink } from '@typed/fx'

import { handlePart } from '../updates.js'

import { BasePart } from './BasePart.js'

import { Placeholder } from '@typed/html/Placeholder.js'

export class PropertyPart extends BasePart<unknown> {
  readonly _tag = 'Property' as const

  constructor(
    protected setProperty: (value: unknown) => Effect.Effect<never, never, void>,
    index: number,
    value: unknown = null,
  ) {
    super(index, value)
  }

  protected getValue(value: unknown): unknown {
    return value
  }

  protected setValue(value: unknown) {
    return this.setProperty(value)
  }

  observe<R, E, R2>(
    placeholder: Placeholder<R, E, unknown>,
    sink: Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2, never, void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const part = this

    return Effect.catchAllCause(
      Effect.gen(function* (_) {
        const fx = yield* _(handlePart(part, placeholder))

        if (fx) {
          yield* _(fx.run(sink))
        } else {
          yield* _(sink.event(part.value))
        }
      }),
      sink.error,
    )
  }

  static fromElement(element: Element, name: string, index: number) {
    const setProperty = (value: unknown) =>
      Effect.sync(() => {
        ;(element as any)[name] = value
      })

    return new PropertyPart(setProperty, index, (element as any)[name])
  }
}
