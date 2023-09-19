import * as Either from "@effect/data/Either"
import * as Option from "@effect/data/Option"
import * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Fiber from "@effect/io/Fiber"
import * as Stream from "@effect/stream/Stream"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Sink from "@typed/fx/Sink"
import * as Subject from "@typed/fx/Subject"

describe.concurrent(__filename, () => {
  it.concurrent("maps a success value", async () => {
    const test = Fx.succeed(1).pipe(
      Fx.map((x) => x + 1),
      Fx.map((x) => x + 1),
      Fx.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual([3])
  })

  it.concurrent("maps multiple values", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.map((x) => x + 1),
      Fx.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual([2, 3, 4])
  })

  it.concurrent("maps a failure value", async () => {
    const test = Fx.fail(1).pipe(
      Fx.mapError((x) => x + 1),
      Fx.mapError((x) => x + 1),
      Fx.toReadonlyArray
    )

    const array = await Effect.runPromise(Effect.either(test))

    expect(array).toEqual(Either.left(3))
  })

  it.concurrent("switchMap favors the latest inner Fx", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.switchMap((x) => Fx.succeed(String(x + 1))),
      Fx.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual(["4"])
  })

  it.concurrent("exhaustMap favors the first inner Fx", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.exhaustMap((x) => Fx.succeed(String(x + 1))),
      Fx.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual(["2"])
  })

  it.concurrent("exhaustMapLatest favors the first and last inner Fx", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.exhaustMapLatest((x) => Fx.succeed(String(x + 1))),
      Fx.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual(["2", "4"])
  })

  it.concurrent("mergeBuffer keeps the ordering of concurrent streams", async () => {
    const test = Fx.mergeBuffer([
      Effect.succeed(1),
      Fx.fromSink<never, never, number>((sink) =>
        Effect.gen(function*(_) {
          yield* _(Effect.sleep(100))
          yield* _(sink.onSuccess(2))
          yield* _(Effect.sleep(100))
          yield* _(sink.onSuccess(3))
        })
      ),
      Stream.fromIterable([4, 5, 6]),
      Effect.delay(Effect.succeed(7), 50)
    ]).pipe(
      Fx.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  describe.concurrent("sharing", () => {
    describe.concurrent("multicast", () => {
      it.concurrent("shares a value", async () => {
        let i = 0
        const iterator = Effect.sync(() => i++)

        const sut = Fx.periodic(iterator, 10).pipe(
          Fx.take(5),
          Fx.multicast,
          Fx.toReadonlyArray
        )

        const test = Effect.gen(function*(_) {
          // start first fiber
          const a = yield* _(Effect.fork(sut))

          // Allow fiber to start
          yield* _(Effect.sleep(0))

          // Allow 2 events to occur
          yield* _(Effect.sleep(20))

          // Start the second
          const b = yield* _(Effect.fork(sut))

          // Validate the outputs
          expect(yield* _(Fiber.join(a))).toEqual([0, 1, 2, 3, 4])
          expect(yield* _(Fiber.join(b))).toEqual([2, 3, 4])
        })

        await Effect.runPromise(test)
      })
    })

    describe.concurrent("hold", () => {
      it.concurrent("shares a value with replay of the last", async () => {
        let i = 0
        const delay = 100
        const iterator = Effect.sync(() => i++)

        const sut = Fx.periodic(iterator, delay).pipe(
          Fx.take(5),
          Fx.hold,
          Fx.toReadonlyArray
        )

        const test = Effect.gen(function*(_) {
          // start first fiber
          const a = yield* _(Effect.fork(sut))

          // Allow fiber to start
          yield* _(Effect.sleep(0))

          // Allow 2 events to occur
          yield* _(Effect.sleep(delay * 2))

          // Start the second
          const b = yield* _(Effect.fork(sut))

          // Validate the outputs
          expect(yield* _(Fiber.join(a))).toEqual([0, 1, 2, 3, 4])
          expect(yield* _(Fiber.join(b))).toEqual([1, 2, 3, 4])
        })

        await Effect.runPromise(test)
      })
    })

    describe.concurrent("replay", () => {
      it.concurrent("shares a value with replay of the last N events", async () => {
        let i = 0
        const iterator = Effect.sync(() => i++)
        const delay = 100

        const sut = Fx.periodic(iterator, delay).pipe(
          Fx.take(5),
          Fx.replay(2),
          Fx.toReadonlyArray
        )

        const test = Effect.gen(function*(_) {
          // start first fiber
          const a = yield* _(Effect.fork(sut))

          // Allow fiber to start
          yield* _(Effect.sleep(0))

          // Allow 2 events to occur
          yield* _(Effect.sleep(delay * 2))

          // Start the second
          const b = yield* _(Effect.fork(sut))

          // Validate the outputs
          expect(yield* _(Fiber.join(a))).toEqual([0, 1, 2, 3, 4])
          expect(yield* _(Fiber.join(b))).toEqual([0, 1, 2, 3, 4])
        })

        await Effect.runPromise(test)
      })
    })
  })

  describe.concurrent("Effect Supertype", () => {
    it.concurrent("lifts a success", async () => {
      const test = Effect.succeed(1).pipe(Fx.toReadonlyArray)

      const array = await Effect.runPromise(test)

      expect(array).toEqual([1])
    })

    it.concurrent("lifts a failure", async () => {
      const test = Effect.fail(1).pipe(Fx.toReadonlyArray, Effect.either)
      const either = await Effect.runPromise(test)

      expect(either).toEqual(Either.left(1))
    })
  })

  describe.concurrent("Stream Supertype", () => {
    it.concurrent("lifts a success", async () => {
      const test = Stream.fromIterable([1, 2, 3]).pipe(Fx.toReadonlyArray)

      const array = await Effect.runPromise(test)

      expect(array).toEqual([1, 2, 3])
    })

    it.concurrent("lifts a failure", async () => {
      const test = Stream.fail(1).pipe(Fx.toReadonlyArray, Effect.either)
      const either = await Effect.runPromise(test)

      expect(either).toEqual(Either.left(1))
    })
  })

  describe.concurrent("Cause Supertype", () => {
    it.concurrent("lifts a failure", async () => {
      const test = Cause.fail(1).pipe(Fx.toReadonlyArray, Effect.either)
      const either = await Effect.runPromise(test)

      expect(either).toEqual(Either.left(1))
    })
  })

  describe.concurrent("RefSubject", () => {
    it.concurrent("allows keeping state", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.of(0))

        expect(yield* _(ref)).toEqual(0)

        yield* _(ref.set(1))

        expect(yield* _(ref)).toEqual(1)

        yield* _(ref.update((x) => x + 1))

        expect(yield* _(ref)).toEqual(2)

        yield* _(ref.delete)

        expect(yield* _(ref)).toEqual(0)
      })

      await Effect.runPromise(test)
    })

    it.concurrent("allows subscribing to those state changes", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.of(0))

        const fiber = yield* _(Effect.fork(Fx.toReadonlyArray(Fx.take(ref, 3))))

        // Allow fiber to start
        yield* _(Effect.sleep(0))

        yield* _(ref.set(1))
        yield* _(ref.set(2))

        expect(yield* _(Fiber.join(fiber))).toEqual([0, 1, 2])
      })

      await Effect.runPromise(test)
    })

    describe.concurrent("map to a computed value", () => {
      it.concurrent("transform success values", async () => {
        const test = Effect.gen(function*(_) {
          const ref = yield* _(RefSubject.of(0))
          const addOne = ref.map((x) => x + 1)

          expect(yield* _(addOne)).toEqual(1)

          yield* _(ref.set(1))

          expect(yield* _(addOne)).toEqual(2)

          yield* _(ref.update((x) => x + 1))

          expect(yield* _(addOne)).toEqual(3)

          yield* _(ref.delete)

          expect(yield* _(addOne)).toEqual(1)
        })

        await Effect.runPromise(test)
      })
    })

    describe.concurrent("filterMap to filtered values", () => {
      it.concurrent("returns Cause.NoSuchElementException when filtered", async () => {
        const test = Effect.gen(function*(_) {
          const ref = yield* _(RefSubject.of(0))
          const filtered = ref.filterMap(Option.liftPredicate((x) => x % 2 === 0))

          expect(yield* _(Effect.optionFromOptional(filtered))).toEqual(Option.some(0))

          yield* _(ref.set(1))

          expect(yield* _(Effect.optionFromOptional(filtered))).toEqual(Option.none())

          yield* _(ref.set(2))

          expect(yield* _(Effect.optionFromOptional(filtered))).toEqual(Option.some(2))
        })

        await Effect.runPromise(test)
      })
    })

    it.concurrent("allows being initialized by an Effect", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.make(Effect.delay(Effect.succeed(0), 50)))

        expect(yield* _(ref)).toEqual(0)

        yield* _(ref.set(1))

        expect(yield* _(ref)).toEqual(1)

        yield* _(ref.update((x) => x + 1))

        expect(yield* _(ref)).toEqual(2)

        yield* _(ref.delete)

        expect(yield* _(ref)).toEqual(0)
      })

      await Effect.runPromise(test)
    })

    it.concurrent("allows being initialized by an Fx", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.make(Fx.merge([
          Fx.at("a", 10),
          Fx.at("z", 50)
        ])))

        // Lazily initializes with the first value of the Fx
        expect(yield* _(ref)).toEqual("a")

        // Allows setting a value
        yield* _(ref.set("b"))
        expect(yield* _(ref)).toEqual("b")

        yield* _(Effect.sleep(50))

        // Further emitted values reset the current state.
        expect(yield* _(ref)).toEqual("z")
      })

      await Effect.runPromise(Effect.scoped(test))
    })
  })

  describe.concurrent("Subject", () => {
    it.concurrent("can map the input values using Sink combinators", async () => {
      const subject = Subject.make<never, number>()
      const sink = subject.pipe(Sink.map((x: string) => x.length))
      const test = Effect.gen(function*(_) {
        const fiber = yield* _(subject, Fx.take(3), Fx.toReadonlyArray, Effect.fork)

        // Allow fiber to start
        yield* _(Effect.sleep(0))

        yield* _(sink.onSuccess("a"))
        yield* _(sink.onSuccess("ab"))
        yield* _(sink.onSuccess("abc"))

        expect(yield* _(Fiber.join(fiber))).toEqual([1, 2, 3])
      })

      await Effect.runPromise(test)
    })
  })
})
