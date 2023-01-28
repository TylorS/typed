import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { describe, it } from 'vitest'

import { collectAll } from '../run/collectAll.js'

import { fromArray } from './fromArray.js'

describe(import.meta.url, () => {
  describe(fromArray.name, () => {
    it('converts an Effect to an Fx', async () => {
      const test = collectAll(fromArray([1, 2, 3]))
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [1, 2, 3])
    })
  })
})
