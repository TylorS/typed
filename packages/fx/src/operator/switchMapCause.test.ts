import { deepStrictEqual } from 'assert'

import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import { millis } from '@fp-ts/data/Duration'
import * as Either from '@fp-ts/data/Either'
import { flow, pipe } from '@fp-ts/data/Function'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { fail } from '../constructor/fail.js'
import { collectAll } from '../run/collectAll.js'

import { flatMap } from './flatMap.js'
import { mergeAll } from './merge.js'
import { switchMapCause } from './switchMapCause.js'

describe.only(import.meta.url, () => {
  describe(switchMapCause.name, () => {
    it('allows mapping to other Fx during failures while prefering the latest stream', async () => {
      const test = pipe(
        mergeAll(at(millis(0), 1), at(millis(20), 2), at(millis(40), 3)),
        flatMap((n) => fail(n)),
        switchMapCause(
          flow(
            Cause.failureOrCause,
            Either.match(
              (n) => at(millis(40), n * n),
              (cause) => fail(cause),
            ),
          ),
        ),
        collectAll,
      )
      const events = await Effect.unsafeRunPromise(test)

      deepStrictEqual(events, [9])
    })
  })
})
