import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Sink from "@typed/fx/Sink"
import * as Subject from "@typed/fx/Subject"
import * as Effect from "effect/Effect"

describe.concurrent("Context", () => {
  describe.concurrent("RefSubject.tagged", () => {
    const initialValue = Math.random() * 100
    const ref = RefSubject.tagged<number>()("Test")

    it.concurrent("should allow using a RefSubject from the context", async () => {
      const test = Effect.gen(function*(_) {
        expect(yield* _(ref)).toEqual(initialValue)

        yield* _(RefSubject.set(ref, initialValue + 1))

        expect(yield* _(ref)).toEqual(initialValue + 1)

        yield* _(RefSubject.update(ref, (n) => n + 1))

        expect(yield* _(ref)).toEqual(initialValue + 2)

        yield* _(RefSubject.delete(ref))

        expect(yield* _(ref)).toEqual(initialValue)
      }).pipe(
        Effect.provide(ref.make(Effect.succeed(initialValue))),
        Effect.scoped
      )

      await Effect.runPromise(test)
    })

    it.concurrent("allows mapping over a RefSubject", async () => {
      const addOne = RefSubject.map(ref, (n) => n + 1)

      const test = Effect.gen(function*(_) {
        expect(yield* _(addOne)).toEqual(initialValue + 1)

        yield* _(RefSubject.set(ref, initialValue + 1))

        expect(yield* _(addOne)).toEqual(initialValue + 2)
      }).pipe(
        Effect.provide(ref.make(Effect.succeed(initialValue))),
        Effect.scoped
      )

      await Effect.runPromise(test)
    })
  })

  describe.concurrent("Subject.tagged", () => {
    it.concurrent("allows broadcasting values to subscribers via the Context", async () => {
      const subject = Subject.tagged<number>()("Test")
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
        Effect.provide(subject.make()),
        Effect.scoped
      )

      await Effect.runPromise(test)
    })

    it.concurrent("allows configuring replays of last value", async () => {
      const subject = Subject.tagged<number>()("Test")
      const sut = Fx.toReadonlyArray(subject)

      const test = Effect.gen(function*() {
        const fiber = yield* Effect.fork(sut)

        // Wait for the fibers to start
        yield* Effect.sleep(0)

        yield* subject.onSuccess(1)
        yield* subject.onSuccess(2)

        const fiber2 = yield* Effect.fork(sut)
        // Wait for the fibers to start
        yield* Effect.sleep(0)

        yield* subject.onSuccess(3)

        yield* subject.interrupt

        expect(yield* Effect.fromFiber(fiber)).toEqual([1, 2, 3])
        expect(yield* Effect.fromFiber(fiber2)).toEqual([2, 3])
      }).pipe(
        subject.provide(1),
        Effect.scoped
      )

      await Effect.runPromise(test)
    })

    it.concurrent("allows configuring replays of last n values", async () => {
      const subject = Subject.tagged<number>()("Test")
      const fx = Fx.toReadonlyArray(subject)

      const test = Effect.gen(function*() {
        const fiber = yield* Effect.fork(fx)

        // Wait for the fibers to start
        yield* Effect.sleep(0)

        yield* subject.onSuccess(1)
        yield* subject.onSuccess(2)
        yield* subject.onSuccess(3)

        const fiber2 = yield* Effect.fork(fx)
        // Wait for the fibers to start
        yield* Effect.sleep(0)

        yield* subject.interrupt
        expect(yield* Effect.fromFiber(fiber)).toEqual([1, 2, 3])
        expect(yield* Effect.fromFiber(fiber2)).toEqual([1, 2, 3])
      }).pipe(
        subject.provide(3),
        Effect.scoped
      )

      await Effect.runPromise(test)
    })

    it.concurrent("allows input values to be mapped over", async () => {
      const subject = Subject.tagged<number>()((_) => class TestSubject extends _("Test") {})
      const effect = Fx.toReadonlyArray(subject)
      const sink = subject.pipe(Sink.map((s: string) => s.length))

      const test = Effect.gen(function*() {
        const fiber = yield* Effect.fork(effect)

        // Wait for the fibers to start
        yield* Effect.sleep(0)

        yield* sink.onSuccess("a")
        yield* sink.onSuccess("ab")
        yield* sink.onSuccess("abc")

        yield* subject.interrupt

        expect(yield* Effect.fromFiber(fiber)).toEqual([1, 2, 3])
      }).pipe(
        subject.provide(0),
        Effect.scoped
      )

      await Effect.runPromise(test)
    })
  })
})
