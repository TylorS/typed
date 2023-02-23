import { deepStrictEqual } from 'assert'

import { millis } from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { collectAll } from '../run/collectAll.js'

import { mergeAll } from './merge.js'
import { raceAll } from './race.js'

describe(import.meta.url, () => {
  describe(raceAll.name, () => {
    it('allows combining multiple streams together only emmiting when all streams have emitted at least once', async () => {
      const test = pipe(
        raceAll(
          mergeAll(at(millis(0), 1), at(millis(200), 2)),
          mergeAll(at(millis(100), 3), at(millis(150), 4)),
          mergeAll(at(millis(250), 5), at(millis(300), 6)),
        ),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [1, 2])
    })
  })
})
