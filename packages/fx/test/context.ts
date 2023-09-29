import * as Option from "effect/Option"
import * as Effect from "effect/Effect"
import * as Context from "@typed/fx/Context"
import * as Fx from "@typed/fx/Fx"
import * as Sink from "@typed/fx/Sink"
import { deepEqual } from "assert"

describe.concurrent("Context", () => {
  describe.concurrent(Context.RefSubject, () => {
    const initialValue = Math.random() * 100
    const ref = Context.RefSubject<never, number>()("Test")

    it.concurrent("should allow using a RefSubject from the context", async () => {
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

    it.concurrent("allows mapping over a RefSubject", async () => {
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

  describe.concurrent(Context.Subject, () => {
    it.concurrent("allows broadcasting values to subscribers via the Context", async () => {
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

    it.concurrent("allows configuring replays of last value", async () => {
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

    it.concurrent("allows configuring replays of last n values", async () => {
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

    it.concurrent("allows input values to be mapped over", async () => {
      const subject = Context.Subject<never, number>()((_) => class TestSubject extends _("Test") {})
      const effect = Fx.toReadonlyArray(subject)
      const sink = subject.pipe(Sink.map((s: string) => s.length))

      const test = Effect.gen(function*(_) {
        const fiber = yield* _(Effect.fork(effect))

        // Wait for the fibers to start
        yield* _(Effect.sleep(0))

        yield* _(sink.onSuccess("a"))
        yield* _(sink.onSuccess("ab"))
        yield* _(sink.onSuccess("abc"))

        yield _(subject.interrupt)

        expect(yield* _(Effect.fromFiber(fiber))).toEqual([1, 2, 3])
      }).pipe(
        subject.provide()
      )

      await Effect.runPromise(test)
    })
  })

  describe.concurrent(Context.Model, () => {
    it.concurrent("allow working with multiple Refs", async () => {
      const foobar = Context.Model({
        foo: Context.RefSubject<never, number>()("Foo"),
        bar: Context.RefSubject<never, string>()("Bar")
      })
      const foo = foobar.fromKey("foo")
      const bar = foobar.fromKey("bar")

      const test = Effect.gen(function*(_) {
        expect(yield* _(foobar)).toEqual({ foo: 0, bar: "" })

        yield* _(foo.set(1))
        yield* _(bar.set("Hello"))

        expect(yield* _(foobar)).toEqual({ foo: 1, bar: "Hello" })

        deepEqual(yield* _(foobar.delete), Option.some({ foo: 1, bar: "Hello" }))
        deepEqual(yield* _(foobar.delete), Option.none())

        expect(yield* _(foobar)).toEqual({ foo: 0, bar: "" })
      }).pipe(
        Effect.provide(foobar.of({
          foo: 0,
          bar: ""
        }))
      )

      await Effect.runPromise(test)
    })

    it.concurrent("allows being mapped over", async () => {
      const foobar = Context.Model({
        foo: Context.RefSubject<never, number>()("Foo"),
        bar: Context.RefSubject<never, string>()("Bar")
      })
      const mapped = foobar.map(({ bar, foo }) => ({ foo: foo + 1, bar: bar + "!" }))

      const test = Effect.gen(function*(_) {
        expect(yield* _(mapped)).toEqual({ foo: 1, bar: "!" })

        yield* _(foobar.set({ foo: 1, bar: "Hello" }))

        expect(yield* _(mapped)).toEqual({ foo: 2, bar: "Hello!" })
      }).pipe(
        Effect.provide(foobar.of({
          foo: 0,
          bar: ""
        }))
      )

      await Effect.runPromise(test)
    })

    it.concurrent("allows creating layers using sources refs", async () => {
      const foobar = Context.Model({
        foo: Context.RefSubject<never, number>()("Foo"),
        bar: Context.RefSubject<never, string>()("Bar")
      })
      const layer = foobar.makeWith({
        // This is the most flexible way to create a layer from a Model
        // allowing provision using Effects, Fx, and configuring the Equivalence.
        foo: (ref) => ref.make(Effect.succeed(0)),
        bar: (ref) => ref.make(Effect.succeed(""))
      })

      const test = Effect.gen(function*(_) {
        expect(yield* _(foobar)).toEqual({ foo: 0, bar: "" })

        yield* _(foobar.set({ foo: 1, bar: "Hello" }))

        expect(yield* _(foobar)).toEqual({ foo: 1, bar: "Hello" })
      }).pipe(
        Effect.provide(layer)
      )

      await Effect.runPromise(test)
    })

    it.concurrent("allows creating layers using with Effect and Fx", async () => {
      const foobar = Context.Model({
        foo: Context.RefSubject<never, number>()((_) => class Foo extends _("Foo") {}),
        bar: Context.RefSubject<never, string>()((_) => class Bar extends _("Bar") {}),
        baz: Context.Model({
          quux: Context.RefSubject<never, boolean>()((_) => class Quux extends _("Quux") {})
        })
      })

      const quux = foobar.fromKey("baz").fromKey("quux")

      const test = Effect.gen(function*(_) {
        expect(yield* _(foobar)).toEqual({ foo: 0, bar: "", baz: { quux: false } })

        yield* _(foobar.set({ foo: 1, bar: "Hello", baz: { quux: true } }))

        expect(yield* _(foobar)).toEqual({ foo: 1, bar: "Hello", baz: { quux: true } })

        expect(yield* _(quux)).toEqual(true)

        yield* _(quux.set(false))

        expect(yield* _(quux)).toEqual(false)

        yield* _(foobar.set({ foo: 1, bar: "Hello", baz: { quux: false } }))
      }).pipe(
        Effect.provide(foobar.make({
          foo: Effect.succeed(0),
          bar: Fx.succeed(""),
          baz: {
            quux: Fx.succeed(false)
          }
        }))
      )

      await Effect.runPromise(test)
    })

    it.concurrent("works with RefArrays", async () => {
      const foobar = Context.Model({
        foo: Context.RefArray.make<never, number>()("Foo"),
        bar: Context.RefArray.make<never, string>()("Bar")
      })
      const foo = foobar.fromKey("foo")
      const bar = foobar.fromKey("bar")

      const test = Effect.gen(function*(_) {
        expect(yield* _(foobar)).toEqual({ foo: [], bar: [] })

        yield* _(foo, Context.RefArray.appendAll([1, 2, 3]))

        expect(yield* _(foobar)).toEqual({ foo: [1, 2, 3], bar: [] })

        yield* _(bar, Context.RefArray.append("World"))
        yield* _(bar, Context.RefArray.prepend("Hello"))

        expect(yield* _(foobar)).toEqual({ foo: [1, 2, 3], bar: ["Hello", "World"] })

        yield* _(foo.delete)

        expect(yield* _(foobar)).toEqual({ foo: [], bar: ["Hello", "World"] })

        yield* _(bar.delete)

        expect(yield* _(foobar)).toEqual({ foo: [], bar: [] })
      }).pipe(
        Effect.provide(foobar.of({
          foo: [],
          bar: []
        }))
      )

      await Effect.runPromise(test)
    })
  })
})
