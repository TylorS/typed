import { deepStrictEqual } from 'assert'

import { millis } from '@effect/data/Duration'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { describe, it } from 'vitest'

import { collectAll } from '../run/collectAll.js'

import { HoldSubject } from './HoldSubject.js'

describe(import.meta.url, () => {
  describe('HoldSubject', () => {
    it('allows replaying latest events to late subscribers', async () => {
      const test = Effect.gen(function* ($) {
        const holdSubject = HoldSubject.unsafeMake<never, number>()

        const producer = Effect.gen(function* ($) {
          yield* $(Effect.sleep(millis(0)))
          yield* $(holdSubject.event(1))
          yield* $(Effect.sleep(millis(100)))
          yield* $(holdSubject.event(2))
          yield* $(Effect.sleep(millis(100)))
          yield* $(holdSubject.event(3))
          yield* $(Effect.sleep(millis(100)))
          yield* $(holdSubject.event(4))
          yield* $(Effect.sleep(millis(100)))
          yield* $(holdSubject.event(5))
          yield* $(Effect.sleep(millis(100)))
          yield* $(holdSubject.event(6))
          yield* $(holdSubject.end)
        })

        yield* $(Effect.fork(producer))

        const fiber1 = yield* $(Effect.fork(collectAll(holdSubject)))

        yield* $(Effect.sleep(millis(75)))

        const fiber2 = yield* $(Effect.fork(collectAll(holdSubject)))

        yield* $(Effect.sleep(millis(75)))

        const fiber3 = yield* $(Effect.fork(collectAll(holdSubject)))

        const events1 = yield* $(Fiber.join(fiber1))
        const events2 = yield* $(Fiber.join(fiber2))
        const events3 = yield* $(Fiber.join(fiber3))

        deepStrictEqual(events1, [1, 2, 3, 4, 5, 6], '1')
        deepStrictEqual(events2, [1, 2, 3, 4, 5, 6], '2')
        deepStrictEqual(events3, [2, 3, 4, 5, 6], '3')
      })

      await Effect.runPromise(test)
    })
  })
})
