import * as Chunk from "@effect/data/Chunk"
import * as Effect from "@effect/io/Effect"
import * as Schedule from "@effect/io/Schedule"
import * as Stream from "@effect/stream/Stream"
import * as Fx from "@typed/fx/Fx"
import * as Pull from "@typed/fx/Pull"
import * as Sink from "@typed/fx/Sink"
import * as FxStream from "@typed/fx/Stream"

describe.concurrent(__filename, () => {
  describe.concurrent(FxStream.toStream, () => {
    it.concurrent("converts an Fx to a Stream", async () => {
      const stream = FxStream.toStream(Fx.succeed(1))

      const actual = await Effect.runPromise(Stream.runCollect(stream))

      expect(Array.from(actual)).toEqual([1])
    })

    it.concurrent("allows skipping values from the Fx", async () => {
      const inputs = Array.from({ length: 20 }, (_, i) => Fx.at(i, (i + 1) * 100))

      const stream = FxStream.toStreamSliding(Fx.merge(inputs), 1)

      const test = Effect.gen(function*(_) {
        const pull = yield* _(Stream.toPull(stream))
        const values: Array<number> = []

        yield* _(
          Pull.schedule(
            pull,
            Schedule.spaced(250),
            Sink.Sink(Effect.failCause, (a) => Effect.sync(() => values.push(a)))
          )
        )

        return values
      }).pipe(Effect.scoped)

      const values = await Effect.runPromise(test)

      expect(values).toEqual([0, 2, 5, 7, 10, 12, 15, 17])
    })
  })

  describe.concurrent(FxStream.chunked, () => {
    it.concurrent("converts a Stream into an Fx of chunks", async () => {
      const stream = FxStream.chunked(Stream.fromIterable([1, 2, 3]))

      const actual = await Effect.runPromise(Fx.toReadonlyArray(stream))

      expect(actual).toEqual([Chunk.unsafeFromArray([1, 2, 3])])
    })
  })
})
