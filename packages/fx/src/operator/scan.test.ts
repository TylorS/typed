import { deepStrictEqual } from 'assert'

import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { describe, it } from 'vitest'

import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { scan } from './scan.js'

describe(import.meta.url, () => {
  describe(scan.name, () => {
    it('allows accumulating a value over time', async () => {
      const test = pipe(
        fromArray([1, 2, 3]),
        scan(0, (acc, n) => acc + n),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [0, 1, 3, 6])
    })
  })
})
