import { describe, it } from "@effect/vitest"
import * as Signal from "@typed/signal"
import { deepEqual, ok } from "assert"
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
      const computed = Signal.map(count, (x) => {
        called++
        return x + 1
      })

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

  it.effect("Computed signals with dependencies", () =>
    Effect.gen(function*(_) {
      const count = yield* _(Signal.make(Effect.succeed(0)))
      const double = Signal.map(count, (x) => x * 2)
      const triple = Signal.map(double, (x) => x * 3)
      const computed = Signal.zipWith(double, triple, (x, y) => x + y)

      expect(yield* _(computed)).toEqual(0)
      yield* _(count, Signal.update((n) => n + 1))
      expect(yield* _(computed)).toEqual(8)
      yield* _(count, Signal.update((n) => n + 1))
      expect(yield* _(computed)).toEqual(16)
    }).pipe(provideEnv))

  it.effect("computeds should work with asynchronous scheduling queues", () =>
    Effect.gen(function*(_) {
      const count = yield* _(Signal.make(Effect.succeed(0)))
      const double = Signal.map(count, (x) => x * 2)
      const triple = Signal.map(double, (x) => x * 3)
      const computed = Signal.zipWith(double, triple, (x, y) => x + y)

      expect(yield* _(computed)).toEqual(0)
      yield* _(count, Signal.update((n) => n + 1))
      expect(yield* _(computed)).toEqual(8)
      yield* _(count, Signal.update((n) => n + 1))
      expect(yield* _(computed)).toEqual(16)
    }).pipe(
      Effect.provide(Signal.layer()),
      Effect.provide(Signal.mixedQueue()),
      Effect.scoped
    ))

  it.live("computeds can utilize priority", () =>
    Effect.gen(function*(_) {
      const calls: Array<"count" | "double" | "triple" | "computed"> = []

      const count = yield* _(Signal.make(
        Effect.sync(() => {
          calls.push("count")
          return 0
        })
      ))
      const double = Signal.map(
        count,
        (x) => {
          calls.push("double")
          return x * 2
        },
        {
          priority: Signal.Priority.Idle(0)
        }
      )
      const triple = Signal.map(
        double,
        (x) => {
          calls.push("triple")
          return x * 3
        },
        { priority: Signal.Priority.Raf(0) }
      )
      const computed = Signal.zipWith(
        double,
        triple,
        (x, y) => {
          calls.push("computed")
          return x + y
        },
        {
          priority: Signal.Priority.MacroTask(0)
        }
      )

      // Will always operate the same regardless of priority when directly sampling
      expect(yield* _(computed)).toEqual(0)
      yield* _(count, Signal.update((n) => n + 1))
      expect(yield* _(computed)).toEqual(8)
      yield* _(count, Signal.update((n) => n + 1))
      expect(yield* _(computed)).toEqual(16)

      const depTree = ["double", "triple", "computed"]

      deepEqual(calls, [
        "count",
        ...depTree,
        ...depTree,
        ...depTree
      ])
    }).pipe(
      Effect.provide(Signal.layer()),
      Effect.provide(Signal.mixedQueue()),
      Effect.scoped
    ))

  it.effect("waitForExit allows skipping loading states while initiating a signal", () =>
    Effect.gen(function*(_) {
      const delay = 10
      const count = yield* _(Signal.make(Effect.delay(Effect.succeed(0), delay)))
      expect(yield* _(count)).toEqual(0)
    }).pipe(
      Effect.provide(Signal.layer({ waitForExit: true })),
      Effect.provide(Signal.mixedQueue()),
      Effect.scoped
    ))

  it.effect("allows recovering from errors", () =>
    Effect.gen(function*(_) {
      const count = yield* _(Signal.make<number, string>(Effect.fail("error")))
      const double = count.pipe(
        Signal.map((x) => x * 2),
        Signal.catchAll(() => Effect.succeed(0))
      )

      expect(yield* _(double)).toEqual(0)
      yield* _(count.set(1))
      expect(yield* _(double)).toEqual(2)
    }).pipe(provideEnv))

  it("multicasts computed values to multiple listeners ", () =>
    Effect.gen(function*(_) {
      const count = yield* _(Signal.make<number>(Effect.succeed(0)))
      const calls: Array<string> = []
      const double = count.pipe(
        Signal.tap(() => calls.push("double")),
        Signal.map((x) => x * 2)
      )

      const a = double.pipe(
        Signal.setPriority(Signal.Priority.Idle(0)),
        Signal.tap(() => calls.push("idle"))
      )
      const b = double.pipe(
        Signal.setPriority(Signal.Priority.Raf(0)),
        Signal.tap(() => calls.push("raf"))
      )
      const c = double.pipe(
        Signal.setPriority(Signal.Priority.MacroTask(0)),
        Signal.tap(() => calls.push("macro"))
      )
      const d = double.pipe(
        Signal.setPriority(Signal.Priority.MicroTask(0)),
        Signal.tap(() => calls.push("micro"))
      )
      const e = double.pipe(
        Signal.setPriority(Signal.Priority.Sync),
        Signal.tap(() => calls.push("sync"))
      )
      const all = yield* _(Signal.all([a, b, c, d, e], { concurrency: "unbounded" }))

      expect(all).toEqual([0, 0, 0, 0, 0])

      // Will always operate the same regardless of priority when directly sampling
      const initial = ["double", "idle", "raf", "macro", "micro", "sync"]
      expect(calls).toEqual(initial)

      // trigger async updates by not calling "yield* _(all)"
      yield* _(count.set(1))

      // Wait for all async updates to complete
      yield* _(Effect.sleep(5))

      expect(calls).toEqual([
        ...initial,
        // only 1 call of double, despite multiple tasks to verify no updates are needed
        "double",
        // Async scheduling will utilize priority
        "sync",
        "micro",
        "macro",
        "raf",
        "idle"
      ])
    }).pipe(Effect.provide(Signal.layer()), Effect.provide(Signal.mixedQueue()), Effect.scoped, Effect.runPromise))
})
