import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { describe, it } from 'vitest'

import { delay } from '@typed/fx/delay'
import { Chunk, Duration } from '@typed/fx/externals'
import { flatMap } from '@typed/fx/flatMap'
import { fromArray } from '@typed/fx/fromArray'
import { merge } from '@typed/fx/mergeAll'
import { multicast } from '@typed/fx/multicast'
import { suspend } from '@typed/fx/suspend'
import { toChunk } from '@typed/fx/toChunk'

describe(__filename, () => {
  describe(multicast.name, () => {
    it('allows sharing the underlying producer of a stream', async () => {
      const values = [1, 2, 3]
      let started = 0

      const test = Effect.gen(function* ($) {
        const stream = multicast(
          suspend(() => {
            started++

            return flatMap(fromArray(values), (a) =>
              merge(fromArray([a, a + 1]), delay(fromArray([a * a, a ** a]), Duration.millis(100))),
            )
          }),
        )

        const fiber1 = yield* $(Effect.fork(toChunk(stream)))
        const fiber2 = yield* $(Effect.fork(toChunk(stream)))

        const events1 = Chunk.toReadonlyArray(yield* $(Fiber.join(fiber1)))
        const events2 = Chunk.toReadonlyArray(yield* $(Fiber.join(fiber2)))

        const expected = [
          values[0],
          values[0] + 1,
          values[1],
          values[1] + 1,
          values[2],
          values[2] + 1,
          values[0] * values[0],
          values[1] * values[1],
          values[2] * values[2],
          values[0] ** values[0],
          values[1] ** values[1],
          values[2] ** values[2],
        ]

        expect(events1).toEqual(expected)

        expect(events1).toEqual(events2)

        expect(started).toEqual(1)
      })

      await Effect.runPromise(Effect.scoped(test))
    })
  })
})
