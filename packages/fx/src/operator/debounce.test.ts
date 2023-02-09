import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import * as Duration from '@effect/data/Duration'
import { describe, it } from 'vitest'

import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { debounce } from './debounce.js'

describe(import.meta.url, () => {
  describe(debounce.name, () => {
    it('filters noisy streams, favoring the latest', async () => {
      const test = pipe(fromArray([1, 2, 3]), debounce(Duration.millis(10)), collectAll)
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [3])
    })
  })
})
