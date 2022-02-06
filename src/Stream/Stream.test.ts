import { deepStrictEqual } from 'assert'
import { describe } from 'mocha'

import { pipe } from '@/function'
import * as Fx from '@/Fx'
import { formatSinkTraceElement } from '@/Sink'

import { chain } from './chain'
import { chainFxK } from './chainFxK'
import { collectEventElements, collectEvents } from './collectEvents'
import { ask, of } from './fromFx'

describe(__filename, () => {
  it('traces the stream graph in events', async () => {
    const test = Fx.Fx(function* () {
      const events = yield* pipe(ask<{ a: number }>('foo'), collectEvents)

      const elements = yield* pipe(
        ask<{ a: number }>('foo'),
        chain(({ a }) => of(a)),
        chainFxK((a) => Fx.of(a + 1)),
        collectEventElements,
      )

      console.log(elements.map(formatSinkTraceElement).join('\n'))

      deepStrictEqual(events, [{ a: 1 }])

      return 7
    })

    await Fx.runTrace(test, { a: 1 })
  })
})
