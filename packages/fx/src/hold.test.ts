import { millis } from '@effect/data/Duration'
import { range } from '@effect/data/ReadonlyArray'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { describe, it } from 'vitest'

import { at } from '@typed/fx/at'
import { Chunk } from '@typed/fx/externals'
import { hold } from '@typed/fx/hold'
import { mergeAll } from '@typed/fx/mergeAll'
import { toChunk } from '@typed/fx/toChunk'

describe(__filename, () => {
  describe(hold.name, () => {
    it('allows replaying latest events to late subscribers', async () => {
      const test = Effect.gen(function* ($) {
        const stream = hold(mergeAll(...range(0, 5).map((n) => at(n + 1, millis(n * 100)))))

        const fiber1 = yield* $(Effect.fork(toChunk(stream)))

        yield* $(Effect.sleep(millis(75)))

        const fiber2 = yield* $(Effect.fork(toChunk(stream)))

        yield* $(Effect.sleep(millis(75)))

        const fiber3 = yield* $(Effect.fork(toChunk(stream)))

        expect(Chunk.toReadonlyArray(yield* $(Fiber.join(fiber1)))).toEqual([1, 2, 3, 4, 5, 6])
        expect(Chunk.toReadonlyArray(yield* $(Fiber.join(fiber2)))).toEqual([1, 2, 3, 4, 5, 6])
        expect(Chunk.toReadonlyArray(yield* $(Fiber.join(fiber3)))).toEqual([2, 3, 4, 5, 6])
      })

      await Effect.runPromise(Effect.scoped(test))
    })
  })
})
