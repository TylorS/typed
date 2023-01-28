import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { describe, it } from 'vitest'

import { collectAll } from '../run/collectAll.js'

import { fromEmitter } from './fromEmitter.js'

describe(import.meta.url, () => {
  describe(fromEmitter.name, () => {
    it('converts an Effect to an Fx', async () => {
      const test = collectAll(
        fromEmitter((emitter) =>
          Effect.sync(() => {
            emitter.emit(1)
            emitter.emit(2)
            emitter.emit(3)
            emitter.end()
          }),
        ),
      )
      const events = await Effect.runPromise(test)

      deepStrictEqual(events, [1, 2, 3])
    })
  })
})
