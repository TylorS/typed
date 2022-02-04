import { deepStrictEqual } from 'assert'
import { pipe } from 'fp-ts/function'
import { describe } from 'mocha'

import * as Fx from '@/Fx'
import { prettyPrint } from '@/Sink'

import { chainFxK } from '.'
import { chain } from './chain'
import { collectEventElements, collectEvents } from './collectEvents'
import { ask, of } from './fromFx'

describe(__filename, () => {
  it('traces the stream graph in events', async () => {
    const test = Fx.Fx(function* () {
      const events = yield* pipe(ask<{ a: number }>('foo'), collectEvents)

      const elements = yield* pipe(
        ask<{ a: number }>('foo'),
        chain(({ a }) => of(a)),
        chainFxK((a) => Fx.of(a)),
        collectEventElements,
      )

      console.log(elements.map((e) => prettyPrint(e)).join('\n'))

      deepStrictEqual(events, [{ a: 1 }])

      return 7
    })

    await Fx.runTrace(test, { a: 1 })
  })
})
