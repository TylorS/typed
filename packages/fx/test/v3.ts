import * as core from "@typed/fx/v3/internal/core"
import * as RefSubject from "@typed/fx/v3/RefSubject"
import * as Sink from "@typed/fx/v3/Sink"
import * as Subject from "@typed/fx/v3/Subject"
import { deepStrictEqual } from "assert"
import { Effect, Fiber, Option } from "effect"

describe("V3", () => {
  describe("Fx", () => {
    it("filter + map + loop fusion", async () => {
      const fx = core.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).pipe(
        (x) => core.filter(x, (x) => x % 2 === 0),
        (x) => core.map(x, (x) => x + 1),
        (x) => core.loop(x, 0, (acc, x) => [acc * 2, acc + x]),
        (x) => core.filter(x, (x) => x % 2 === 0),
        (x) => core.map(x, (x) => x + 1),
        (x) => core.loop(x, 0, (acc, x) => [acc * 3, acc + x])
      )

      // Verify Fx has been fused into a single ProducerSyncTransformer
      expect(core.isProducerSyncTransformer(fx)).toBe(true)

      const test = fx.pipe(core.toReadonlyArray, Effect.timed)

      const [time, values] = await Effect.runPromise(test)

      console.log(time.toString())

      deepStrictEqual(values, [0, 3, 24, 75, 168])
    })
  })

  describe("RefSubject", () => {
    it("allows managing state via Effect", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.make(Effect.succeed(0)))

        yield* _(ref)
        yield* _(RefSubject.update(ref, (x) => x + 1))
        yield* _(RefSubject.delete(ref))
        yield* _(ref)

        deepStrictEqual(yield* _(ref), 0)
        deepStrictEqual(yield* _(RefSubject.update(ref, (x) => x + 1)), 1)
        deepStrictEqual(yield* _(RefSubject.delete(ref)), Option.some(1))
        deepStrictEqual(yield* _(ref), 0)
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    it("allows managing state via Fx", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.make(core.succeed(0)))

        yield* _(ref)
        yield* _(RefSubject.update(ref, (x) => x + 1))
        yield* _(RefSubject.delete(ref))
        yield* _(ref)

        deepStrictEqual(yield* _(ref), 0)
        deepStrictEqual(yield* _(RefSubject.update(ref, (x) => x + 1)), 1)
        deepStrictEqual(yield* _(RefSubject.delete(ref)), Option.some(1))
        deepStrictEqual(yield* _(ref), 0)
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    describe.concurrent("runUpdate", () => {
      it("allows changing the value of a ref multiple times withing a single workflow", async () => {
        const test = Effect.gen(function*(_) {
          const ref = yield* _(RefSubject.of(1))
          const fiber = yield* _(core.toReadonlyArray(core.take(ref, 10)), Effect.fork)

          // Allow fiber to start
          yield* _(Effect.sleep(0))

          yield* _(
            ref.runUpdates(({ get, set }) =>
              Effect.gen(function*(_) {
                // Preserves ordering of asynchonous updates
                yield* _(Effect.sleep(100))
                expect(yield* _(get)).toEqual(1)
                expect(yield* _(set(2))).toEqual(2)
                expect(yield* _(set(2))).toEqual(2) // prevents duplicates
                expect(yield* _(set(3))).toEqual(3)
                expect(yield* _(set(4))).toEqual(4)
                expect(yield* _(set(5))).toEqual(5)

                return 42
              })
            ),
            Effect.fork
          )

          yield* _(
            ref.runUpdates(({ get, set }) =>
              Effect.gen(function*(_) {
                expect(yield* _(get)).toEqual(5)
                expect(yield* _(set(6))).toEqual(6)
                expect(yield* _(set(7))).toEqual(7)
                expect(yield* _(set(8))).toEqual(8)
                expect(yield* _(set(9))).toEqual(9)
                expect(yield* _(set(10))).toEqual(10)

                return 99
              })
            ),
            Effect.fork
          )

          const values = yield* _(Effect.fromFiber(fiber))

          expect(values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        }).pipe(Effect.scoped)

        await Effect.runPromise(test)
      })
    })
  })

  describe("Subject", () => {
    it.concurrent("can map the input values using Sink combinators", async () => {
      const subject = Subject.make<never, number>()
      const sink = subject.pipe(Sink.map((x: string) => x.length))
      const test = Effect.gen(function*(_) {
        const fiber = yield* _(core.toReadonlyArray(core.take(subject, 3)), Effect.fork)

        // Allow fiber to start
        yield* _(Effect.sleep(0))

        yield* _(sink.onSuccess("a"))
        yield* _(sink.onSuccess("ab"))
        yield* _(sink.onSuccess("abc"))

        expect(yield* _(Fiber.join(fiber))).toEqual([1, 2, 3])
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })
  })
})
