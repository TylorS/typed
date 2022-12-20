import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import { describe, it } from 'vitest'

import { fail } from '../constructor/fail.js'
import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { catchAllCause } from './catchAllCause.js'

describe(import.meta.url, () => {
  describe(catchAllCause.name, () => {
    it('recoving from failures with another Fx', async () => {
      const test = pipe(
        fail('test'),
        catchAllCause(() => fromArray([4, 5, 6])),
        collectAll,
      )
      const events = await Effect.unsafeRunPromise(test)

      deepStrictEqual(events, [4, 5, 6])
    })
  })
})
