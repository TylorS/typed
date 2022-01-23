import { deepStrictEqual } from 'assert'
import { pipe } from 'fp-ts/function'
import { describe } from 'mocha'

import { Fx, runTrace } from '@/Fx'
import { formatSinkTraceElement } from '@/Sink'

import { collectEventElements, collectEvents } from './collectEvents'
import { ask } from './fromFx'

describe(__filename, () => {
  it('traces the stream graph in events', async () => {
    const test = Fx(function* () {
      const events = yield* pipe(ask<{ a: number }>('foo'), collectEvents)

      const elements = yield* pipe(ask<{ a: number }>('foo'), collectEventElements)

      console.log(elements.map((e) => formatSinkTraceElement(e)).join('\n'))

      deepStrictEqual(events, [{ a: 1 }])
    })

    await runTrace(test, { a: 1 })
  })
})
