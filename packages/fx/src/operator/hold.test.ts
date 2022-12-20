import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { millis } from '@fp-ts/data/Duration'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { collectAll } from '../run/collectAll.js'

import { hold } from './hold.js'
import { mergeAll } from './merge.js'

describe(import.meta.url, () => {
  describe(hold.name, () => {
    it('allows replaying latest events to late subscribers', async () => {
      const test = Effect.gen(function* ($) {
        const stream = hold(
          mergeAll(
            at(millis(0), 1),
            at(millis(100), 2),
            at(millis(200), 3),
            at(millis(300), 4),
            at(millis(400), 5),
            at(millis(500), 6),
          ),
        )

        const fiber1 = yield* $(Effect.fork(collectAll(stream)))

        yield* $(Effect.sleep(millis(75)))

        const fiber2 = yield* $(Effect.fork(collectAll(stream)))

        yield* $(Effect.sleep(millis(75)))

        const fiber3 = yield* $(Effect.fork(collectAll(stream)))

        deepStrictEqual(yield* $(Fiber.join(fiber1)), [1, 2, 3, 4, 5, 6], '1')
        deepStrictEqual(yield* $(Fiber.join(fiber2)), [1, 2, 3, 4, 5, 6], '2')
        deepStrictEqual(yield* $(Fiber.join(fiber3)), [2, 3, 4, 5, 6], '3')
      })

      await Effect.unsafeRunPromise(test)
    })
  })
})
