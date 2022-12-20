import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { millis } from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { collectAll } from '../run/collectAll.js'

import { mergeAll } from './merge.js'
import { switchMap } from './switchMap.js'

describe.only(import.meta.url, () => {
  describe(switchMap.name, () => {
    it('allows mapping to other Fx while prefering the latest stream', async () => {
      const test = pipe(
        mergeAll(at(millis(0), 1), at(millis(20), 2), at(millis(40), 3)),
        switchMap((n) => at(millis(40), n * n)),
        collectAll,
      )
      const events = await Effect.unsafeRunPromise(test)

      deepStrictEqual(events, [9])
    })
  })
})