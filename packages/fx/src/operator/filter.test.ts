import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import { describe, it } from 'vitest'

import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { filter } from './filter.js'

describe(import.meta.url, () => {
  describe(filter.name, () => {
    it('filters and transforms an Fx', async () => {
      const test = pipe(
        fromArray([1, 2, 3, 4]),
        filter((x) => x % 2 === 0),
        collectAll,
      )
      const events = await Effect.unsafeRunPromise(test)

      deepStrictEqual(events, [2, 4])
    })
  })
})
