import { millis } from '@effect/data/Duration'
import * as Effect from '@effect/io/Effect'
import { describe, it, expect } from 'vitest'

import { at } from './at.js'
import { keyed } from './keyed.js'
import { mergeAll } from './mergeAll.js'
import { succeed } from './succeed.js'
import { toReadonlyArray } from './toReadonlyArray.js'

describe(__filename, () => {
  describe(keyed.name, () => {
    it('allow keeping a reference to a running stream', async () => {
      const test = Effect.gen(function* ($) {
        const inputs = mergeAll(
          succeed([1, 2, 3]),
          at([3, 2, 1], millis(200)),
          at([4, 5, 6, 1], millis(400)),
        )

        let calls = 0

        const fx = keyed(
          inputs,
          (source) => {
            calls++
            return source
          },
          (x) => x,
        )

        const events = yield* $(toReadonlyArray(fx))

        expect(events).toEqual([
          [1, 2, 3],
          [3, 2, 1],
          [4, 5, 6, 1],
        ])

        // Should only be called once for each unique value
        expect(calls).toEqual(6)
      })

      await Effect.runPromise(Effect.scoped(test))
    })
  })
})
