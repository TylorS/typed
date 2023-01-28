import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import { millis } from '@fp-ts/data/Duration'
import { describe, it } from 'vitest'

import { periodic } from '../constructor/periodic.js'
import { collectAll } from '../run/collectAll.js'

import { struct } from './struct.js'
import { withItems } from './withItems.js'

describe(import.meta.url, () => {
  describe(struct.name, () => {
    it('combines a struct of streams into a stream of structs', async () => {
      const test = pipe(
        struct({
          a: pipe(periodic(millis(10)), withItems([1, 2, 3])),
          b: pipe(periodic(millis(10)), withItems(['a', 'b', 'c'])),
          c: pipe(periodic(millis(10)), withItems([true, false, true])),
        }),
        collectAll,
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [
        { a: 1, b: 'a', c: true },
        { a: 2, b: 'a', c: true },
        { a: 2, b: 'b', c: true },
        { a: 2, b: 'b', c: false },
        { a: 3, b: 'b', c: false },
        { a: 3, b: 'c', c: false },
        { a: 3, b: 'c', c: true },
      ])
    })
  })
})
