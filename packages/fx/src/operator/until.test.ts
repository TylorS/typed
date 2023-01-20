import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as TestClock from '@effect/test/TestClock'
import * as TE from '@effect/test/TestEnvironment'
import * as Duration from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { periodic } from '../constructor/periodic.js'
import { collectAll } from '../run/collectAll.js'

import { until } from './until.js'
import { withItems } from './withItems.js'

// TODO: remove skip when @effect/test has been updated to latest @effect/io
describe.skip(import.meta.url, () => {
  describe(until.name, () => {
    it('interrupts a stream when a signal is received', async () => {
      const delay = 20
      const expected = 5
      const fx = pipe(
        periodic(Duration.millis(delay)),
        withItems([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
        until(at(Duration.millis(delay * expected), null)),
      )

      const test = pipe(
        Effect.gen(function* ($) {
          const fiber = yield* $(Effect.fork(collectAll(fx)))

          for (let i = 0; i < expected; i++) {
            yield* $(TestClock.adjust(Duration.millis(delay)))
          }

          return yield* $(Fiber.join(fiber))
        }),
        Effect.provideSomeLayer(TE.TestEnvironment),
      )

      const events = await Effect.unsafeRunPromise(test)

      deepStrictEqual(events, [1, 2, 3, 4, 5])
    })
  })
})
