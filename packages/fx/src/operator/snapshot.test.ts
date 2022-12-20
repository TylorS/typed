import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import { millis } from 'node_modules/@fp-ts/data/Duration.js'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { collectAll } from '../run/collectAll.js'

import { mergeAll } from './merge.js'
import { snapshot } from './snapshot.js'

describe(import.meta.url, () => {
  describe(snapshot.name, () => {
    it('allows accumulating a value over time', async () => {
      const test = pipe(
        mergeAll(at(millis(0), 1), at(millis(100), 5), at(millis(100), 10)),
        snapshot(mergeAll(at(millis(0), 1), at(millis(100), 5)), (a, b) => a + b),
        collectAll,
      )
      const events = await Effect.unsafeRunPromise(test)

      deepStrictEqual(events, [6, 10, 15])
    })
  })
})
