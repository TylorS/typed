import { ok } from 'assert'
import { pipe } from 'fp-ts/function'

import { make } from '@/Context'
import { drain } from '@/Fiber/Instruction'
import { Fx, runMain } from '@/Fx'
import { DefaultScheduler } from '@/Scheduler'
import { makeTimeoutTimer } from '@/Timer'

import { tap } from '../operators/tap'
import { now } from './now'

describe(__filename, () => {
  describe(now.name, () => {
    it('emits the provided value', (done) => {
      const value = Symbol('test')
      const stream = pipe(
        value,
        now,
        tap((x) => {
          try {
            ok(value === x)
            done()
          } catch (e) {
            done(e)
          }
        }),
      )

      const sut = Fx(function* () {
        yield* drain(stream)
      })

      void runMain(sut, make({ scheduler: new DefaultScheduler(makeTimeoutTimer()) }))
    })
  })
})
