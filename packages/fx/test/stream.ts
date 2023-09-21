import * as Chunk from "@effect/data/Chunk"
import * as Effect from "@effect/io/Effect"
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
  })

  describe(FxStream.chunked, () => {
    it.concurrent("converts a Stream into an Fx of chunks", async () => {
      const stream = FxStream.chunked(Stream.fromIterable([1, 2, 3]))

      const actual = await Effect.runPromise(Fx.toReadonlyArray(stream))

      expect(actual).toEqual([Chunk.unsafeFromArray([1, 2, 3])])
    })
  })
})
