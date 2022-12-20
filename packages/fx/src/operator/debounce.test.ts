import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import * as Duration from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'
import { describe, it } from 'vitest'

import { fromArray } from '../constructor/fromArray.js'
import { collectAll } from '../run/collectAll.js'

import { debounce } from './debounce.js'

describe(import.meta.url, () => {
  describe(debounce.name, () => {
    it('filters noisy streams, favoring the latest', async () => {
      const test = pipe(fromArray([1, 2, 3]), debounce(Duration.millis(10)), collectAll)
      const events = await Effect.unsafeRunPromise(test)

      deepStrictEqual(events, [3])
    })
  })
})
