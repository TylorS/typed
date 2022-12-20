import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import { describe, it } from 'vitest'

import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { takeUntil } from './takeUntil.js'

describe(import.meta.url, () => {
  describe(takeUntil.name, () => {
    it('ends an Fx once a predicate has been matched', async () => {
      const test = pipe(
        fromArray([1, 2, 3, 4, 5, 6, 7, 8]),
        takeUntil((x) => x === 4),
        collectAll,
      )
      const events = await Effect.unsafeRunPromise(test)

      deepStrictEqual(events, [1, 2, 3])
    })
  })
})