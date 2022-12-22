import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import * as Duration from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'
import { describe, it } from 'vitest'

import { fromIterable } from '../constructor/fromIterable.js'
import { collectAll } from '../run/collectAll.js'

import { delay } from './delay.js'
import { exhaustMap } from './exhaustMap.js'

describe(import.meta.url, () => {
  describe(exhaustMap.name, () => {
    it('allows chaining multiple streams, favoring the first', async () => {
      const result = await pipe(
        fromIterable([1, 2, 3]),
        exhaustMap((n) => delay(Duration.millis(10))(fromIterable([n, n, n]))),
        collectAll,
        Effect.unsafeRunPromise,
      )

      deepStrictEqual(result, [1, 1, 1])
    })
  })
})
