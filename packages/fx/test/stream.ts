import * as Chunk from "@effect/data/Chunk"
import * as Either from "@effect/data/Either"
import * as Option from "@effect/data/Option"
import * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Exit from "@effect/io/Exit"
import * as Stream from "@effect/stream/Stream"
import * as Fx from "@typed/fx/Fx"
import * as FxStream from "@typed/fx/Stream"

describe.concurrent(__filename, () => {
  describe(FxStream.toStream, () => {
    it.concurrent("converts an Fx to a Stream", async () => {
      const stream = FxStream.toStream(Fx.succeed(1))

      const actual = await Effect.runPromise(Stream.runCollect(stream))

      expect(Array.from(actual)).toEqual([1])
    })

    it("allows skipping values from the Fx", async () => {
      const inputs = Array.from({ length: 20 }, (_, i) => Fx.at(i, (i + 1) * 100))

      const stream = FxStream.toStreamSliding(Fx.merge(inputs))

      const test = Effect.gen(function*(_) {
        const pull = yield* _(Stream.toPull(stream))
        const values: Array<number> = []

        let exit = yield* _(Effect.exit(pull))

        while (Exit.isSuccess(exit)) {
          values.push(...Chunk.toReadonlyArray(exit.value))
          yield* _(Effect.sleep(250))
          exit = yield* _(Effect.exit(pull))
        }

        const failure = Cause.failureOrCause(exit.cause)

        if (Either.isRight(failure)) {
          return yield* _(Effect.failCause(failure.right))
        }

        if (Option.isNone(failure.left)) {
          return values
        }

        return yield* _(Effect.fail(failure.left.value))
      }).pipe(Effect.scoped)

      const values = await Effect.runPromise(test)

      expect(values).toEqual([0, 2, 5, 7, 10, 12, 15, 17])
    })
  })

  describe(FxStream.chunked, () => {
    it.concurrent("converts a Stream into an Fx of chunks", async () => {
      const stream = FxStream.chunked(Stream.fromIterable([1, 2, 3]))

      const actual = await Effect.runPromise(Fx.toReadonlyArray(stream))

      expect(actual).toEqual([Chunk.unsafeFromArray([1, 2, 3])])
    })
  })
})
