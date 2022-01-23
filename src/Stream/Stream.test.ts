import { deepStrictEqual } from 'assert'
import { pipe } from 'fp-ts/function'
import { describe } from 'mocha'

import { Fx, runTrace } from '@/Fx'

import { collectEvents } from './collectEvents'
import { ask } from './fromFx'

describe(__filename, () => {
  it('traces the stream graph in events', async () => {
    const test = Fx(function* () {
      const events = yield* pipe(ask<{ a: number }>(), collectEvents)

      deepStrictEqual(events, [{ a: 1 }])
    })

    await runTrace(test, { a: 1 })
  })
})
