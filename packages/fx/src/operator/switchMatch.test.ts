import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { millis } from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { fail } from '../constructor/fail.js'
import { collectAll } from '../run/collectAll.js'

import { flatten } from './flatMap.js'
import { mergeAll } from './merge.js'
import { switchMatchError } from './switchMatch.js'

describe(import.meta.url, () => {
  describe(switchMatchError.name, () => {
    it('allows mapping to other Fx while prefering the latest stream', async () => {
      const test = pipe(
        mergeAll(
          at(millis(0), 1),
          at(millis(20), 2),
          at(millis(40), 3),
          pipe(at(millis(60), fail(4)), flatten),
        ),
        switchMatchError(
          (n) => at(millis(60), n * n),
          (n) => at(millis(60), n * n),
        ),
        collectAll,
      )
      const events = await Effect.unsafeRunPromise(test)

      deepStrictEqual(events, [16])
    })
  })
})
