import { deepStrictEqual } from 'assert'

import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { describe, it } from 'vitest'

import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { continueWith } from './continueWith.js'

describe(import.meta.url, () => {
  describe(continueWith.name, () => {
    it('concatenating a stream after another', async () => {
      const test = pipe(
        fromArray([1, 2, 3]),
        continueWith(() => fromArray([4, 5, 6])),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [1, 2, 3, 4, 5, 6])
    })
  })
})
