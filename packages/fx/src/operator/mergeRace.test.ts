import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import { millis } from '@fp-ts/data/Duration'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { collectAll } from '../run/collectAll.js'

import { mergeRace } from './mergeRace.js'

describe(import.meta.url, () => {
  describe(mergeRace.name, () => {
    it('interrupts the second Fx when the first emits', async () => {
      const test = pipe(at(millis(0), 1), mergeRace(at(millis(200), 2)), collectAll)
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [1])
    })

    it('emits both streams when second emits first', async () => {
      const test = pipe(at(millis(200), 1), mergeRace(at(millis(0), 2)), collectAll)
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [2, 1])
    })
  })
})
