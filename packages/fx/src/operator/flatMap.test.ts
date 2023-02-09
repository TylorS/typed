import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import { millis } from '@effect/data/Duration'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { flatMap } from './flatMap.js'

describe(import.meta.url, () => {
  describe(flatMap.name, () => {
    it('allows mapping to other Fx', async () => {
      const test = pipe(
        fromArray([1, 2, 3]),
        flatMap((n) => fromArray([n * 2, n + 1])),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [2, 2, 4, 3, 6, 4])
    })

    it('allows mapping to other asynchronous Fx', async () => {
      const test = pipe(
        fromArray([1, 2, 3]),
        flatMap((n) => at(millis(10), n * 2)),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [2, 4, 6])
    })
  })
})
