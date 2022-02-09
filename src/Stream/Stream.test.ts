import { deepStrictEqual } from 'assert'
import { describe } from 'mocha'

import * as Fx from '@/Fx'
import { pipe } from '@/Prelude/function'

import { collectEvents } from './collectEvents'
import { ask } from './fromFx'

describe(__filename, () => {
  it('traces the stream graph in events', async () => {
    const test = Fx.Fx(function* () {
      const events = yield* pipe(ask<{ a: number }>('foo'), collectEvents)

      deepStrictEqual(events, [{ a: 1 }])

      return 7
    })

    await Fx.runTrace(test, { a: 1 })
  })
})
