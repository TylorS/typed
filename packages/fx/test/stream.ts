import * as Fx from "@typed/fx/Fx"
import * as Pull from "@typed/fx/Pull"
import * as Sink from "@typed/fx/Sink"
import * as FxStream from "@typed/fx/Stream"
import { TestClock, TestContext } from "effect"
import * as Chunk from "effect/Chunk"
import * as Effect from "effect/Effect"
import * as Schedule from "effect/Schedule"
import * as Stream from "effect/Stream"

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
          ),
          Effect.fork
        )

        for (let i = 0; i < 10; ++i) {
          yield* _(TestClock.adjust(250))
        }

        return values
      }).pipe(Effect.provide(TestContext.TestContext), Effect.scoped)

      const values = await Effect.runPromise(test)

      expect(values).toEqual([0, 2, 4, 7, 9, 12, 14, 17])
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
