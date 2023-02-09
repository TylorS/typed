import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import { millis } from '@effect/data/Duration'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
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
  })
})
