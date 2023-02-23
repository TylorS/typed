import { deepStrictEqual } from 'assert'

import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { describe, it } from 'vitest'

import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { skipAfter } from './skipAfter.js'
import { tap } from './tap.js'

describe(import.meta.url, () => {
  describe(skipAfter.name, () => {
    it('skips values after a predicate has been matched', async () => {
      let count = 0
      const test = pipe(
        fromArray([1, 2, 3, 4, 5, 6, 7, 8]),
        tap(() => Effect.sync(() => count++)),
        skipAfter((x) => x === 4),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [1, 2, 3])
      deepStrictEqual(count, 8)
    })
  })
})
