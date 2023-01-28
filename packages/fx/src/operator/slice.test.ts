import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import { describe, it } from 'vitest'

import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { slice } from './slice.js'

describe(import.meta.url, () => {
  describe(slice.name, () => {
    it('allows skipping and taking a specified amount of values', async () => {
      const test = pipe(fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), slice(3, 4), collectAll)
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [4, 5, 6, 7])
    })
  })
})
