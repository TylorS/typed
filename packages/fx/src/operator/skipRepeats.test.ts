import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import { describe, it } from 'vitest'

import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { skipRepeats } from './skipRepeats.js'

describe(import.meta.url, () => {
  describe(skipRepeats.name, () => {
    it('allows accumulating a value over time', async () => {
      const test = pipe(
        fromArray([1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 1, 2]),
        skipRepeats,
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [1, 2, 3, 1, 2])
    })
  })
})
