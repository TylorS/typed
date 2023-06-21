import * as Effect from '@effect/io/Effect'
import { Sink } from '@typed/fx'

import { Renderable } from '../Renderable.js'
import { handlePart } from '../server/updates.js'

import { BasePart } from './BasePart.js'

export class BooleanPart extends BasePart<boolean> {
  readonly _tag = 'Boolean' as const

  constructor(
    protected toggleAttribute: (bool: boolean) => Effect.Effect<never, never, void>,
    index: number,
    value = false,
  ) {
    super(index, value)
  }

  observe<R, E, R2>(
    placeholder: Renderable<R, E>,
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

  protected getValue(value: unknown): boolean {
    return !!value
  }

  protected setValue(value: boolean): Effect.Effect<never, never, void> {
    return this.toggleAttribute(value)
  }

  static fromElement(element: Element, name: string, index: number) {
    return new BooleanPart(
      (b) => Effect.sync(() => element.toggleAttribute(name, b)),
      index,
      element.hasAttribute(name),
    )
  }
}
