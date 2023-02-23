import { deepStrictEqual } from 'assert'

import { millis } from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { concatMap } from './concatMap.js'
import { mergeAll } from './merge.js'

describe(import.meta.url, () => {
  describe(concatMap.name, () => {
    it('merges inner streams with a concurrency of 1', async () => {
      const test = pipe(
        fromArray([1, 2, 3]),
        concatMap((n) => mergeAll(at(millis(0), n), at(millis(10), n * n))),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [1, 1, 2, 4, 3, 9])
    })
  })
})
