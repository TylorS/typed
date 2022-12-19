import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import { describe, it } from 'vitest'

import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { filterEffect } from './filterEffect.js'

describe(import.meta.url, () => {
  describe(filterEffect.name, () => {
    it('filters an Fx with an Effect', async () => {
      const test = pipe(
        fromArray([1, 2, 3, 4]),
        filterEffect((x) => Effect.sync(() => x % 2 === 0)),
        collectAll,
      )
      const events = await Effect.unsafeRunPromise(test)

      deepStrictEqual(events, [2, 4])
    })
  })
})
