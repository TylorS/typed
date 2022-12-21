import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { millis } from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { collectAll } from '../run/collectAll.js'

import { mergeAll } from './merge.js'
import { snapshot } from './snapshot.js'

describe(import.meta.url, () => {
  describe(snapshot.name, () => {
    it('allows accumulating a value over time', async () => {
      const test = pipe(
        mergeAll(at(millis(100), 1), at(millis(200), 5), at(millis(300), 10)),
        snapshot(mergeAll(at(millis(0), 1), at(millis(100), 5)), (a, b) => a + b),
        collectAll,
      )
      const events = await Effect.unsafeRunPromise(test)

      deepStrictEqual(events, [2, 10, 15])
    })
  })
})
