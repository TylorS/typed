import * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import * as Context from "@typed/fx/Context"
import * as Fx from "@typed/fx/Fx"
import { deepEqual } from "assert"

describe("Context", () => {
  describe(Context.RefSubject, () => {
    const initialValue = Math.random() * 100
    const ref = Context.RefSubject<never, number>()("Test")

    it("should allow using a RefSubject from the context", async () => {
      const test = Effect.gen(function*(_) {
        expect(yield* _(ref)).toEqual(initialValue)

        yield* _(ref.set(initialValue + 1))

        expect(yield* _(ref)).toEqual(initialValue + 1)

        yield* _(ref.update((n) => n + 1))

        expect(yield* _(ref)).toEqual(initialValue + 2)

        yield* _(ref.delete)

        expect(yield* _(ref)).toEqual(initialValue)
      }).pipe(
        ref.provide(Effect.succeed(initialValue))
      )

      await Effect.runPromise(test)
    })

    it("allows mapping over a RefSubject", async () => {
      const addOne = ref.map((n) => n + 1)

      const test = Effect.gen(function*(_) {
        expect(yield* _(addOne)).toEqual(initialValue + 1)

        yield* _(ref.set(initialValue + 1))

        expect(yield* _(addOne)).toEqual(initialValue + 2)
      }).pipe(
        ref.provide(Effect.succeed(initialValue))
      )

      await Effect.runPromise(test)
    })
  })

  describe(Context.Subject, () => {
    it("allows broadcasting values to subscribers via the Context", async () => {
      const subject = Context.Subject<never, number>()("Test")
      const sut = Fx.toReadonlyArray(Fx.take(subject, 3))

      const test = Effect.gen(function*(_) {
        const fiber = yield* _(Effect.fork(sut))

        // Wait for the fiber to start
        yield* _(Effect.sleep(0))

        yield* _(subject.onSuccess(1))
        yield* _(subject.onSuccess(2))
        yield* _(subject.onSuccess(3))

        expect(yield* _(Effect.fromFiber(fiber))).toEqual([1, 2, 3])
      }).pipe(
        subject.provide()
      )

      await Effect.runPromise(test)
    })

    it("allows configuring replays of last value", async () => {
      const subject = Context.Subject<never, number>()("Test")
      const sut = Fx.toReadonlyArray(subject)

      const test = Effect.gen(function*(_) {
        const fiber = yield* _(Effect.fork(sut))

        // Wait for the fibers to start
        yield* _(Effect.sleep(0))

        yield* _(subject.onSuccess(1))
        yield* _(subject.onSuccess(2))

        const fiber2 = yield* _(Effect.fork(sut))
        // Wait for the fibers to start
        yield* _(Effect.sleep(0))

        yield* _(subject.onSuccess(3))

        yield _(subject.interrupt)

        expect(yield* _(Effect.fromFiber(fiber))).toEqual([1, 2, 3])
        expect(yield* _(Effect.fromFiber(fiber2))).toEqual([2, 3])
      }).pipe(
        subject.provide(1)
      )

      await Effect.runPromise(test)
    })

    it("allows configuring replays of last n values", async () => {
      const subject = Context.Subject<never, number>()("Test")
      const fx = Fx.toReadonlyArray(subject)

      const test = Effect.gen(function*(_) {
        const fiber = yield* _(Effect.fork(fx))

        // Wait for the fibers to start
        yield* _(Effect.sleep(0))

        yield* _(subject.onSuccess(1))
        yield* _(subject.onSuccess(2))
        yield* _(subject.onSuccess(3))

        const fiber2 = yield* _(Effect.fork(fx))
        // Wait for the fibers to start
        yield* _(Effect.sleep(0))

        yield _(subject.interrupt)

        expect(yield* _(Effect.fromFiber(fiber))).toEqual([1, 2, 3])
        expect(yield* _(Effect.fromFiber(fiber2))).toEqual([1, 2, 3])
      }).pipe(
        subject.provide(3)
      )

      await Effect.runPromise(test)
    })
  })

  describe(Context.Model, () => {
    it("allow working with multiple Refs", async () => {
      const foobar = Context.Model({
        foo: Context.RefSubject<never, number>()("Foo"),
        bar: Context.RefSubject<never, string>()("Bar")
      })
      const foo = foobar.fromKey("foo")
      const bar = foobar.fromKey("bar")

      const test = Effect.gen(function*(_) {
        expect(yield* _(foobar.get)).toEqual({ foo: 0, bar: "" })

        yield* _(foo.set(1))
        yield* _(bar.set("Hello"))

        expect(yield* _(foobar.get)).toEqual({ foo: 1, bar: "Hello" })

        deepEqual(yield* _(foobar.delete), Option.some({ foo: 1, bar: "Hello" }))
        deepEqual(yield* _(foobar.delete), Option.none())

        expect(yield* _(foobar.get)).toEqual({ foo: 0, bar: "" })
      }).pipe(
        foobar.provide({
          foo: 0,
          bar: ""
        }),
        Effect.scoped
      )

      await Effect.runPromise(test)
    })

    it("allows being mapped over", async () => {
      const foobar = Context.Model({
        foo: Context.RefSubject<never, number>()("Foo"),
        bar: Context.RefSubject<never, string>()("Bar")
      })
      const mapped = foobar.map(({ bar, foo }) => ({ foo: foo + 1, bar: bar + "!" }))

      const test = Effect.gen(function*(_) {
        expect(yield* _(mapped.get)).toEqual({ foo: 1, bar: "!" })

        yield* _(foobar.set({ foo: 1, bar: "Hello" }))

        expect(yield* _(mapped.get)).toEqual({ foo: 2, bar: "Hello!" })
      }).pipe(
        foobar.provide({
          foo: 0,
          bar: ""
        }),
        Effect.scoped
      )

      await Effect.runPromise(test)
    })
  })
})
