import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import { millis } from '@fp-ts/data/Duration'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { collectAll } from '../run/collectAll.js'

import { mergeAll } from './merge.js'

describe(import.meta.url, () => {
  describe(mergeAll.name, () => {
    it('allows merging multiple streams together', async () => {
      const test = pipe(
        mergeAll(
          at(millis(0), 1),
          at(millis(200), 2),
          at(millis(100), 3),
          at(millis(150), 4),
          at(millis(250), 5),
        ),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [1, 3, 4, 2, 5])
    })
  })
})
