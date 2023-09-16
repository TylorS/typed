import * as Either from "@effect/data/Either"
import * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Fiber from "@effect/io/Fiber"
import * as Stream from "@effect/stream/Stream"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"

describe(__filename, () => {
  it("maps a success value", async () => {
    const test = Fx.succeed(1).pipe(
      Fx.map((x) => x + 1),
      Fx.map((x) => x + 1),
      Fx.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual([3])
  })

  it("maps multiple values", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.map((x) => x + 1),
      Fx.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual([2, 3, 4])
  })

  it("maps a failure value", async () => {
    const test = Fx.fail(1).pipe(
      Fx.mapError((x) => x + 1),
      Fx.mapError((x) => x + 1),
      Fx.toReadonlyArray
    )

    const array = await Effect.runPromise(Effect.either(test))

    expect(array).toEqual(Either.left(3))
  })

  it("switchMap favors the latest inner Fx", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.switchMap((x) => Fx.succeed(String(x + 1))),
      Fx.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual(["4"])
  })

  it("exhaustMap favors the first inner Fx", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.exhaustMap((x) => Fx.succeed(String(x + 1))),
      Fx.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual(["2"])
  })

  it("exhaustMapLatest favors the first and last inner Fx", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.exhaustMapLatest((x) => Fx.succeed(String(x + 1))),
      Fx.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual(["2", "4"])
  })

  it("mergeBuffer keeps the ordering of concurrent streams", async () => {
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

  describe("sharing", () => {
    describe("multicast", () => {
      it("shares a value", async () => {
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

    describe("hold", () => {
      it("shares a value with replay of the last", async () => {
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

    describe("replay", () => {
      it("shares a value with replay of the last N events", async () => {
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

  describe("Effect Supertype", () => {
    it("lifts a success", async () => {
      const test = Effect.succeed(1).pipe(Fx.toReadonlyArray)

      const array = await Effect.runPromise(test)

      expect(array).toEqual([1])
    })

    it("lifts a failure", async () => {
      const test = Effect.fail(1).pipe(Fx.toReadonlyArray, Effect.either)
      const either = await Effect.runPromise(test)

      expect(either).toEqual(Either.left(1))
    })
  })

  describe("Stream Supertype", () => {
    it("lifts a success", async () => {
      const test = Stream.fromIterable([1, 2, 3]).pipe(Fx.toReadonlyArray)

      const array = await Effect.runPromise(test)

      expect(array).toEqual([1, 2, 3])
    })

    it("lifts a failure", async () => {
      const test = Stream.fail(1).pipe(Fx.toReadonlyArray, Effect.either)
      const either = await Effect.runPromise(test)

      expect(either).toEqual(Either.left(1))
    })
  })

  describe("Cause Supertype", () => {
    it("lifts a failure", async () => {
      const test = Cause.fail(1).pipe(Fx.toReadonlyArray, Effect.either)
      const either = await Effect.runPromise(test)

      expect(either).toEqual(Either.left(1))
    })
  })

  describe("RefSubject", () => {
    it("allows keeping state", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.make(Effect.succeed(0)))

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

    it("allows subscribing to those state changes", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.make(Effect.succeed(0)))

        const fiber = yield* _(Effect.fork(Fx.toReadonlyArray(Fx.take(ref, 3))))

        // Allow fiber to start
        yield* _(Effect.sleep(0))

        yield* _(ref.set(1))
        yield* _(ref.set(2))

        expect(yield* _(Fiber.join(fiber))).toEqual([0, 1, 2])
      })

      await Effect.runPromise(test)
    })
  })
})
