import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as TestClock from '@effect/io/internal/testing/testClock'
import * as TE from '@effect/io/internal/testing/testEnvironment'
import * as Duration from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { periodic } from '../constructor/periodic.js'
import { collectAll } from '../run/collectAll.js'

import { during } from './during.js'
import { withItems } from './withItems.js'

describe(import.meta.url, () => {
  describe(during.name, () => {
    it('interrupts a stream when a signal is received', async () => {
      const delay = 20
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const expected = Math.floor(values.length / 2)
      const fx = pipe(
        periodic(Duration.millis(delay)),
        withItems([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
        during(at(Duration.millis(delay * expected), at(Duration.millis(delay * 2), null))),
      )

      const test = pipe(
        Effect.gen(function* ($) {
          const fiber = yield* $(Effect.fork(collectAll(fx)))

          for (let i = 0; i <= expected * 2; i++) {
            yield* $(TestClock.adjust(Duration.millis(delay)))
          }

          return yield* $(Fiber.join(fiber))
        }),
        Effect.provideSomeLayer(TE.TestEnvironment),
      )

      const events = await Effect.unsafeRunPromise(test)

      deepStrictEqual(events, [6, 7])
    })
  })
})
