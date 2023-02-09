import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import { millis } from '@effect/data/Duration'
import { describe, it } from 'vitest'

import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { scanEffect } from './scanEffect.js'

describe(import.meta.url, () => {
  describe(scanEffect.name, () => {
    it('allows accumulating a value over time using Effect', async () => {
      const test = pipe(
        fromArray([1, 2, 3]),
        scanEffect(Effect.succeed(0), (acc, n) => Effect.sync(() => acc + n)),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [0, 1, 3, 6])
    })

    it('allows ensures reducers are applied in order', async () => {
      const test = pipe(
        fromArray([10, 20, 30]),
        scanEffect(Effect.succeed(0), (acc, n) =>
          pipe(
            Effect.sync(() => acc + n),
            Effect.delay(millis(100 - acc - n)),
          ),
        ),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [0, 10, 30, 60])
    })
  })
})
