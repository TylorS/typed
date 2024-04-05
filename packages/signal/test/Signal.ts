import { describe, it } from "@effect/vitest"
import * as Signal from "@typed/signal"
import { ok } from "assert"
import { Effect, Either, flow, Option } from "effect"
import * as TestClock from "effect/TestClock"

const provideEnv = flow(
  Effect.provide(Signal.layer()),
  Effect.provide(Signal.syncQueue),
  Effect.scoped
)

describe("Signal", () => {
  it.effect("Creates a signal with lazily available value for async effect", () =>
    Effect.gen(function*(_) {
      const delay = 10
      const count = yield* _(Signal.make(Effect.delay(Effect.succeed(0), delay)))

      let either = yield* _(count, Effect.either)

      ok(Either.isLeft(either))

      yield* _(TestClock.adjust(delay))

      either = yield* _(count, Effect.either)

      ok(Either.isRight(either))
      expect(yield* _(count)).toEqual(0)
    }).pipe(provideEnv))

  it.effect("Creates a signal with immediately available value for sync effects", () =>
    Effect.gen(function*(_) {
      expect(yield* _(Signal.make(Effect.succeed(0)), Effect.flatten)).toEqual(0)
      expect(yield* _(Signal.make(Option.some(0)), Effect.flatten)).toEqual(0)
      expect(yield* _(Signal.make(Either.right(0)), Effect.flatten)).toEqual(0)
    }).pipe(provideEnv))

  it.effect("Update a signal", () =>
    Effect.gen(function*(_) {
      const count = yield* _(Signal.make(Effect.succeed(0)))
      const modified = yield* _(count, Signal.update((n) => n + 1))
      expect(modified).toEqual(1)
    }).pipe(provideEnv))

  it.effect("Tagged Signals help with using with Effect Context", () => {
    const count = Signal.tagged<number>()("count")

    return Effect.gen(function*(_) {
      expect(yield* _(count)).toEqual(0)
      expect(yield* _(count, Signal.update((n) => n + 1))).toEqual(1)
    }).pipe(count.provide(Effect.succeed(0)), provideEnv)
  })

  it.effect("Computed signals", () =>
    Effect.gen(function*(_) {
      const count = yield* _(Signal.make(Effect.succeed(0)))
      let called = 0
      const computed = yield* _(Signal.compute(Effect.map(count, (x) => {
        called++
        return x + 1
      })))

      expect(yield* _(computed)).toEqual(1)
      expect(called).toEqual(1)
      expect(yield* _(count, Signal.update((n) => n + 1))).toEqual(1)
      expect(yield* _(computed)).toEqual(2)
      expect(called).toEqual(2)
      expect(yield* _(count, Signal.update((n) => n + 1))).toEqual(2)

      // Computed signals are computed in the background automatically if they're not read
      yield* _(TestClock.adjust(1))
      expect(called).toEqual(3)
    }).pipe(provideEnv))
})
