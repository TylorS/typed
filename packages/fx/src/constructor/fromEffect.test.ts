import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { describe, it } from 'vitest'

import { collectAll } from '../run/collectAll.js'

import { fromEffect } from './fromEffect.js'

describe(import.meta.url, () => {
  describe(fromEffect.name, () => {
    it('converts an Effect to an Fx', async () => {
      const test = collectAll(fromEffect(Effect.sync(() => 1)))
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [1])
    })
  })
})
