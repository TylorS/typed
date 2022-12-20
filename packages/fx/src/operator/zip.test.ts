import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { millis } from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { collectAll } from '../run/collectAll.js'

import { mergeAll } from './merge.js'
import { zipAll } from './zip.js'

describe(import.meta.url, () => {
  describe(zipAll.name, () => {
    it('allows combining multiple streams together only emmiting when all streams have emitted at least once', async () => {
      const test = pipe(
        zipAll(
          mergeAll(at(millis(0), 1), at(millis(200), 2)),
          mergeAll(at(millis(100), 3), at(millis(150), 4)),
          mergeAll(at(millis(250), 5), at(millis(300), 6)),
        ),
        collectAll,
      )
      const events = await Effect.unsafeRunPromise(test)

      deepStrictEqual(events, [[2, 4, 5]])
    })
  })
})
