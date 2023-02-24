import { deepStrictEqual } from 'assert'

import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { describe, it } from 'vitest'

import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { map } from './map.js'

describe(import.meta.url, () => {
  describe(map.name, () => {
    it('transforms an Fx', async () => {
      const test = pipe(
        fromArray([1, 2, 3]),
        map((x) => x + 1),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [2, 3, 4])
    })
  })
})
