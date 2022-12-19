import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { describe, it } from 'vitest'

import { collectAll } from '../run/collectAll.js'

import { fromIterable } from './fromIterable.js'

describe(import.meta.url, () => {
  describe(fromIterable.name, () => {
    it('converts an Effect to an Fx', async () => {
      const test = collectAll(fromIterable([1, 2, 3]))
      const events = await Effect.unsafeRunPromise(test)

      deepStrictEqual(events, [1, 2, 3])
    })
  })
})
