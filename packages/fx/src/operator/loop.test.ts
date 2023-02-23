import { deepStrictEqual } from 'assert'

import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { describe, it } from 'vitest'

import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { loop } from './loop.js'

describe(import.meta.url, () => {
  describe(loop.name, () => {
    it('allows tracking state and computed a value from that state', async () => {
      const test = pipe(
        fromArray([1, 2, 3]),
        loop(0, (acc, n) => [(acc + n).toString(), acc + n]),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, ['1', '3', '6'])
    })
  })
})
