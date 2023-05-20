import * as Chunk from '@effect/data/Chunk'
import * as Duration from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { describe, it, expect } from 'vitest'

import { delay } from './delay.js'
import { flatMap } from './flatMap.js'
import { fromArray } from './fromArray.js'
import { merge } from './mergeAll.js'
import { multicast } from './multicast.js'
import { never } from './never.js'
import { onInterrupt } from './onInterrupt.js'
import { suspend } from './suspend.js'
import { toChunk } from './toChunk.js'

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

    describe('when all subscribers are interrupted', () => {
      it('interrupts the underlying producer', async () => {
        let interrupted = false
        const test = Effect.gen(function* ($) {
          const stream = pipe(
            onInterrupt(never<never, number>(), () => Effect.sync(() => (interrupted = true))),
            multicast,
          )

          const fiber1 = yield* $(Effect.fork(toChunk(stream)))
          const fiber2 = yield* $(Effect.fork(toChunk(stream)))

          yield* $(Fiber.interrupt(fiber1))
          yield* $(Fiber.interrupt(fiber2))
        })

        await Effect.runPromise(Effect.scoped(test))

        expect(interrupted).toEqual(true)
      })
    })
  })
})
