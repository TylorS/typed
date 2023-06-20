import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Scope from '@effect/io/Scope'
import { Sink } from '@typed/fx'

import { Placeholder } from '@typed/html/Placeholder.js'

export abstract class BasePart<A> {
  abstract readonly _tag: string

  // Can be used to track resources for a given Part.
  public fibers: Set<Fiber.Fiber<never, unknown>> = new Set()

  constructor(readonly index: number, public value?: A) {}

  protected abstract getValue(value: unknown): A

  protected abstract setValue(value: A): Effect.Effect<never, never, void>

  update(input: unknown): Effect.Effect<never, never, A> {
    return Effect.suspend(() => {
      const value = this.getValue(input)

      if (value === this.value) return Effect.succeed(value)

      return Effect.flatMap(this.setValue(value), () => Effect.sync(() => (this.value = value)))
    })
  }

  abstract observe<R, E, R2>(
    placeholder: Placeholder<R, E, unknown>,
    sink: Sink<R2, E, unknown>,
  ): Effect.Effect<R | R2 | Scope.Scope, never, void>
}
