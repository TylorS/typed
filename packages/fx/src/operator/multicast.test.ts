import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { pipe } from '@fp-ts/core/Function'
import { millis } from '@effect/data/Duration'
import { describe, it } from 'vitest'

import { fromIterable } from '../constructor/fromIterable.js'
import { suspend } from '../constructor/suspend.js'
import { collectAll } from '../run/collectAll.js'

import { delay } from './delay.js'
import { flatMap } from './flatMap.js'
import { merge } from './merge.js'
import { multicast } from './multicast.js'

describe(import.meta.url, () => {
  describe(multicast.name, () => {
    it('allows sharing the underlying producer of a stream', async () => {
      const values = [1, 2, 3]
      let started = 0

      const test = Effect.gen(function* ($) {
        const stream = multicast(
          suspend(() => {
            started++
            return pipe(
              fromIterable(values),
              flatMap((a) =>
                pipe(
                  fromIterable([a, a + 1]),
                  merge(pipe(fromIterable([a * a, a ** a]), delay(millis(50)))),
                ),
              ),
            )
          }),
        )

        const fiber1 = yield* $(Effect.fork(collectAll(stream)))
        const fiber2 = yield* $(Effect.fork(collectAll(stream)))

        const events1 = yield* $(Fiber.join(fiber1))
        const events2 = yield* $(Fiber.join(fiber2))

        deepStrictEqual(events1, [
          1,
          1 + 1,
          2,
          2 + 1,
          3,
          3 + 1,
          1 * 1,
          2 * 2,
          3 * 3,
          1 ** 1,
          2 ** 2,
          3 ** 3,
        ])

        deepStrictEqual(events1, events2)

        deepStrictEqual(started, 1)
      })

      await Effect.runPromise(test)
    })
  })
})
