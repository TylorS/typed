import { deepStrictEqual } from 'assert'

import { millis } from '@effect/data/Duration'
import * as Either from '@effect/data/Either'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { fail } from '../constructor/fail.js'
import { collectAll } from '../run/collectAll.js'

import { mergeAll } from './merge.js'
import { switchMap } from './switchMap.js'

describe(import.meta.url, () => {
  describe(switchMap.name, () => {
    it('allows mapping to other Fx while prefering the latest stream', async () => {
      const test = pipe(
        mergeAll(at(millis(0), 1), at(millis(20), 2), at(millis(40), 3)),
        switchMap((n) => at(millis(40), n * n)),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [9])
    })

    it('collects inner errors', async () => {
      const test = pipe(
        mergeAll(at(millis(0), 1), at(millis(20), 2), at(millis(40), 3)),
        switchMap((n) => fail(n)),
        collectAll,
      )

      const either = await Effect.runPromiseEither(test)

      deepStrictEqual(either, Either.left(1))
    })
  })
})
