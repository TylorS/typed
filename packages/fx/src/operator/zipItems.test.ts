import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import { describe, it } from 'vitest'

import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { zipItems } from './zipItems.js'

describe(import.meta.url, () => {
  describe(zipItems.name, () => {
    it('zips a stream together with an iterable', async () => {
      const test = pipe(
        fromArray([1, 2, 3]),
        zipItems([3, 4], (x, y) => x + y),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [4, 6])
    })
  })
})
