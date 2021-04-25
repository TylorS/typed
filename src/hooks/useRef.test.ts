import * as E from '@fp/Env'
import { runAsFiber } from '@fp/Fiber'
import * as Fx from '@fp/Fx/Env'
import { describe, given, it } from '@typed/test'
import { pipe } from 'fp-ts/function'
import { createVirtualScheduler } from 'most-virtual-scheduler'

import { useRef } from './useRef'

export const test = describe(__filename, [
  given(`an initial value`, [
    it(`returns a mutable reference starting with that value`, ({ same }, done) => {
      const expected = {}
      const [timer, scheduler] = createVirtualScheduler()

      const test = Fx.Do(function* (_) {
        const ref = yield* _(useRef(E.fromIO(() => expected)))

        try {
          same(expected, ref.current)
          done()
        } catch (e) {
          done(e)
        }
      })

      pipe(test, runAsFiber(scheduler))

      timer.progressTimeBy(1)
    }),
  ]),

  given(`no initial value`, [
    it(`returns an initial value of undefined`, ({ equal }, done) => {
      const [timer, scheduler] = createVirtualScheduler()

      const test = Fx.Do(function* (_) {
        const ref = yield* _(useRef())

        try {
          equal(undefined, ref.current)
          done()
        } catch (e) {
          done(e)
        }
      })

      pipe(test, runAsFiber(scheduler))

      timer.progressTimeBy(1)
    }),
  ]),
])
