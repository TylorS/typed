import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import { millis } from '@effect/data/Duration'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { flatMapConcurrently } from './flatMapConcurrently.js'
import { mergeAll } from './merge.js'

describe(import.meta.url, () => {
  describe(flatMapConcurrently.name, () => {
    it('merges inner streams with specified concurrency', async () => {
      const test = pipe(
        fromArray([1, 2, 3, 4]),
        flatMapConcurrently(2, (n) => mergeAll(at(millis(50), n), at(millis(100), n * n))),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [1, 2, 1, 4, 3, 4, 9, 16])
    })
  })
})
