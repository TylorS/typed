import { deepStrictEqual } from 'assert'

import { pipe } from '@effect/data/Function'
import { none, some } from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import { describe, it } from 'vitest'

import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { filterMapEffect } from './filterMapEffect.js'

describe(import.meta.url, () => {
  describe(filterMapEffect.name, () => {
    it('filters and transforms an Fx', async () => {
      const test = pipe(
        fromArray([1, 2, 3]),
        filterMapEffect((n) => Effect.sync(() => (n % 2 === 0 ? some(n + 1) : none()))),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [3])
    })
  })
})
