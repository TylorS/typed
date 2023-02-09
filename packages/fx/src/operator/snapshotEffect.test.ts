import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import { millis } from '@effect/data/Duration'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { collectAll } from '../run/collectAll.js'

import { mergeAll } from './merge.js'
import { snapshotEffect } from './snapshotEffect.js'

describe(import.meta.url, () => {
  describe(snapshotEffect.name, () => {
    it('allows accumulating a value over time using an Effect', async () => {
      const test = pipe(
        mergeAll(at(millis(100), 1), at(millis(200), 5), at(millis(300), 10)),
        snapshotEffect(mergeAll(at(millis(0), 1), at(millis(100), 5)), (a, b) =>
          Effect.sync(() => a + b),
        ),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [2, 10, 15])
    })
  })
})
