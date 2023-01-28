import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { describe, it } from 'vitest'

import { collectAll } from '../run/collectAll.js'

import { Subject } from './Subject.js'

describe(import.meta.url, () => {
  describe('Subject', () => {
    it('allows broadcastig values directly to observers', async () => {
      const test = Effect.gen(function* ($) {
        const subject = Subject.unsafeMake<never, number>()

        const fiber1 = yield* $(Effect.fork(collectAll(subject)))
        const fiber2 = yield* $(Effect.fork(collectAll(subject)))

        yield* $(Effect.yieldNow())

        yield* $(subject.event(1))
        yield* $(subject.event(2))
        yield* $(subject.event(3))
        yield* $(subject.end)

        const events1 = yield* $(Fiber.join(fiber1))
        const events2 = yield* $(Fiber.join(fiber2))

        deepStrictEqual(events1, [1, 2, 3])
        deepStrictEqual(events1, events2)
      })

      await Effect.runPromise(test)
    })
  })
})
