import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { millis } from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { collectAll } from '../run/collectAll.js'

import { combineAll } from './combine.js'
import { mergeAll } from './merge.js'

describe(import.meta.url, () => {
  describe(combineAll.name, () => {
    it('allows merging multiple streams together', async () => {
      const test = pipe(
        combineAll(
          at(millis(0), 1),
          at(millis(200), 2),
          at(millis(100), 3),
          at(millis(150), 4),
          mergeAll(at(millis(250), 5), at(millis(300), 6)),
        ),
        collectAll,
      )
      const events = await Effect.unsafeRunPromise(test)

      deepStrictEqual(events, [
        [1, 2, 3, 4, 5],
        [1, 2, 3, 4, 6],
      ])
    })
  })
})
