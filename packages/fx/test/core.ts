import * as Either from "@effect/data/Either"
import * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Fiber from "@effect/io/Fiber"
import * as Stream from "@effect/stream/Stream"
import * as Core from "@typed/fx/internal/core"
import * as Share from "@typed/fx/internal/share"

describe(__filename, () => {
  it("maps a success value", async () => {
    const test = Core.succeed(1).pipe(
      Core.map((x) => x + 1),
      Core.map((x) => x + 1),
      Core.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual([3])
  })

  it("maps multiple values", async () => {
    const test = Core.fromIterable([1, 2, 3]).pipe(
      Core.map((x) => x + 1),
      Core.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual([2, 3, 4])
  })

  it("maps a failure value", async () => {
    const test = Core.fail(1).pipe(
      Core.mapError((x) => x + 1),
      Core.mapError((x) => x + 1),
      Core.toReadonlyArray
    )

    const array = await Effect.runPromise(Effect.either(test))

    expect(array).toEqual(Either.left(3))
  })

  it("switchMap favors the latest inner Fx", async () => {
    const test = Core.fromIterable([1, 2, 3]).pipe(
      Core.switchMap((x) => Core.succeed(String(x + 1))),
      Core.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual(["4"])
  })

  it("exhaustMap favors the first inner Fx", async () => {
    const test = Core.fromIterable([1, 2, 3]).pipe(
      Core.exhaustMap((x) => Core.succeed(String(x + 1))),
      Core.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual(["2"])
  })

  it("exhaustMapLatest favors the first and last inner Fx", async () => {
    const test = Core.fromIterable([1, 2, 3]).pipe(
      Core.exhaustMapLatest((x) => Core.succeed(String(x + 1))),
      Core.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual(["2", "4"])
  })

  it("mergeBuffer keeps the ordering of concurrent streams", async () => {
    const test = Core.mergeBuffer([
      Effect.succeed(1),
      Core.fromSink<never, never, number>((sink) =>
        Effect.gen(function*(_) {
          yield* _(Effect.sleep(100))
          yield* _(sink.onSuccess(2))
          yield* _(Effect.sleep(100))
          yield* _(sink.onSuccess(3))
        })
      ),
      Effect.delay(Effect.succeed(4), 50)
    ]).pipe(
      Core.toReadonlyArray
    )

    const array = await Effect.runPromise(test)

    expect(array).toEqual([1, 2, 3, 4])
  })

  describe("sharing", () => {
    describe("multicast", () => {
      it("shares a value", async () => {
        let i = 0
        const iterator = Effect.sync(() => i++)

        const sut = Core.periodic(iterator, 10).pipe(
          Core.take(5),
          Share.multicast,
          Core.toReadonlyArray
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

        const sut = Core.periodic(iterator, delay).pipe(
          Core.take(5),
          Share.hold,
          Core.toReadonlyArray
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

        const sut = Core.periodic(iterator, delay).pipe(
          Core.take(5),
          Share.replay(2),
          Core.toReadonlyArray
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
      const test = Effect.succeed(1).pipe(Core.toReadonlyArray)

      const array = await Effect.runPromise(test)

      expect(array).toEqual([1])
    })

    it("lifts a failure", async () => {
      const test = Effect.fail(1).pipe(Core.toReadonlyArray, Effect.either)
      const either = await Effect.runPromise(test)

      expect(either).toEqual(Either.left(1))
    })
  })

  describe("Stream Supertype", () => {
    it("lifts a success", async () => {
      const test = Stream.succeed(1).pipe(Core.toReadonlyArray)

      const array = await Effect.runPromise(test)

      expect(array).toEqual([1])
    })

    it("lifts a failure", async () => {
      const test = Stream.fail(1).pipe(Core.toReadonlyArray, Effect.either)
      const either = await Effect.runPromise(test)

      expect(either).toEqual(Either.left(1))
    })
  })

  describe("Cause Supertype", () => {
    it("lifts a failure", async () => {
      const test = Cause.fail(1).pipe(Core.toReadonlyArray, Effect.either)
      const either = await Effect.runPromise(test)

      expect(either).toEqual(Either.left(1))
    })
  })
})
