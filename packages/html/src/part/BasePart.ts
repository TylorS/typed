import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { Sink } from '@typed/fx'

import { Renderable } from '../Renderable.js'

export abstract class BasePart<A> {
  abstract readonly _tag: string

  constructor(readonly index: number, public value?: A) {}

  protected abstract getValue(value: unknown): A

  protected abstract setValue(value: A): Effect.Effect<never, never, void>

  update = (input: unknown): Effect.Effect<never, never, A> => {
    return Effect.suspend(() => {
      const value = this.getValue(input)

      if (value === this.value) return Effect.succeed(value)

      return Effect.flatMap(this.setValue(value), () => Effect.sync(() => (this.value = value)))
    })
  }

  abstract observe<R, E, R2>(
    placeholder: Renderable<R, E>,
    sink: Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2 | Scope.Scope, never, void>
}
