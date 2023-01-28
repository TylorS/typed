import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import * as Duration from '@fp-ts/data/Duration'
import { describe, it } from 'vitest'

import { fromIterable } from '../constructor/fromIterable.js'
import { collectAll } from '../run/collectAll.js'

import { delay } from './delay.js'
import { exhaustMapLatest } from './exhaustMapLatest.js'

describe(import.meta.url, () => {
  describe(exhaustMapLatest.name, () => {
    it('allows chaining multiple streams, favoring the first, replaying the latest', async () => {
      const result = await pipe(
        fromIterable([1, 2, 3]),
        exhaustMapLatest((n) => delay(Duration.millis(10))(fromIterable([n, n, n]))),
        collectAll,
        Effect.runPromise,
      )

      deepStrictEqual(result, [1, 1, 1, 3, 3, 3])
    })
  })
})
