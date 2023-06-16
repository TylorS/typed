import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'

export abstract class BasePart<A> {
  abstract readonly _tag: string

  // Can be used to track resources for a given Part.
  public fibers: Set<Fiber.Fiber<never, unknown>> = new Set()

  constructor(readonly index: number, public value?: A) {}

  protected abstract getValue(value: unknown): A

  protected abstract setValue(value: A): Effect.Effect<never, never, void>

  update(value: A): Effect.Effect<never, never, void> {
    return Effect.suspend(() => {
      if (value === this.value) return Effect.unit()

      return Effect.tap(this.setValue(value), () => Effect.sync(() => (this.value = value)))
    })
  }

  abstract getHTML(): string
}
