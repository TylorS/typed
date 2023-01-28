import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import { describe, it } from 'vitest'

import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { skipUntil } from './skipUntil.js'

describe(import.meta.url, () => {
  describe(skipUntil.name, () => {
    it('skips values until a predicate has been matched', async () => {
      const test = pipe(
        fromArray([1, 2, 3, 4, 5, 6, 7, 8]),
        skipUntil((x) => x === 4),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [4, 5, 6, 7, 8])
    })
  })
})
