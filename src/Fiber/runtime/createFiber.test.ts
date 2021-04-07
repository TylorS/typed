import { describe, given, it } from '@typed/test'
import { left, right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import { createVirtualScheduler } from 'most-virtual-scheduler'

import { doEnv, toEnv } from '../../Fx/Env'
import { createReferences, RefValue } from '../../Ref'
import * as R from '../../Resume'
import { delay } from '../../Scheduler'
import { Fiber, fork, pause } from '../Fiber'
import { Status } from '../Status'
import { createFiber } from './createFiber'
import { FiberChildren } from './FiberChildren'
import { runAsFiber } from './runAsFiber'

export const test = describe(`createFiber`, [
  given(`Env CurrentFiber a -> Option (Fiber *) -> Scheduler`, [
    describe(`queued`, [
      it(`creates a fiber w/ queued status`, ({ equal }) => {
        const resume = R.sync(() => 1)
        const parent: O.Option<Fiber<unknown>> = O.none
        const [, scheduler] = createVirtualScheduler()
        const fiber = createFiber(() => resume, parent, scheduler)

        pipe(fiber.status, R.start(equal({ type: 'queued' })))
      }),
    ]),

    describe(`running`, [
      it(`starts running as soon as possible`, ({ equal }) => {
        const [timer, scheduler] = createVirtualScheduler()
        const resume = delay(100)({ scheduler })
        const parent: O.Option<Fiber<unknown>> = O.none
        const fiber = createFiber(() => resume, parent, scheduler)

        timer.progressTimeBy(1)

        pipe(fiber.status, R.start(equal({ type: 'running' })))
      }),
    ]),

    describe(`completed`, [
      describe(`when an error is thrown`, [
        it(`returns a completed status with Left<Error>`, ({ equal }) => {
          const error = new Error('Unable to complete')
          const [timer, scheduler] = createVirtualScheduler()
          const resume = R.sync(() => {
            throw error

            return 1
          })
          const parent: O.Option<Fiber<unknown>> = O.none
          const fiber = createFiber(() => resume, parent, scheduler)

          timer.progressTimeBy(1)

          const expected: Status<number> = { type: 'completed', value: left<Error, number>(error) }

          pipe(fiber.status, R.start(equal<Status<number>>(expected)))
        }),
      ]),

      describe(`when no error is thrown`, [
        it(`returns a completed status with Right<A>`, ({ equal }) => {
          const [timer, scheduler] = createVirtualScheduler()
          const value = 1
          const resume = R.sync(() => value)
          const parent: O.Option<Fiber<unknown>> = O.none
          const fiber = createFiber(() => resume, parent, scheduler)

          timer.progressTimeBy(1)

          const expected: Status<number> = { type: 'completed', value: right(value) }

          pipe(fiber.status, R.start(equal<Status<number>>(expected)))
        }),
      ]),
    ]),

    describe(`failed`, [
      given(`an error is thrown and but there are running child fibers`, [
        it(`returns expected status`, ({ equal }) => {
          const error = new Error('Unable to complete')
          const [timer, scheduler] = createVirtualScheduler()
          const resume = R.sync(() => {
            throw error

            return 1
          })
          const child = createFiber(delay(100), O.none, scheduler)
          const children: RefValue<typeof FiberChildren> = new Map([[child.id, child]])
          const fiber = createFiber(
            () => resume,
            O.none,
            scheduler,
            createReferences([[FiberChildren.id, children]]),
          )

          const expected: Status<number> = { type: 'failed', error }

          timer.progressTimeBy(1)

          pipe(fiber.status, R.start(equal<Status<number>>(expected)))
        }),
      ]),
    ]),
    describe(`finished`, [
      given(`fiber returns a value but there are running child fibers`, [
        it(`returns expected status`, ({ equal }) => {
          const [timer, scheduler] = createVirtualScheduler()
          const value = 1
          const resume = R.sync(() => value)
          const child = createFiber(delay(100), O.none, scheduler)
          const children: RefValue<typeof FiberChildren> = new Map([[child.id, child]])
          const fiber = createFiber(
            () => resume,
            O.none,
            scheduler,
            createReferences([[FiberChildren.id, children]]),
          )

          const expected: Status<number> = { type: 'finished', value }

          timer.progressTimeBy(1)

          pipe(fiber.status, R.start(equal<Status<number>>(expected)))
        }),
      ]),
    ]),

    describe(`pause/play`, [
      it(`allows cooperative scheduling`, ({ equal }, done) => {
        const value = 2
        const [timer, scheduler] = createVirtualScheduler()
        const child = doEnv(function* (_) {
          // Returns the Parent fiber's status
          equal({ type: 'running' }, yield* _(pause))

          return value
        })

        const test = doEnv(function* (_) {
          try {
            const fiber = yield* pipe(child, toEnv, fork, _)

            equal({ type: 'queued' }, yield* _(() => fiber.status))

            // Start fiber
            timer.progressTimeBy(1)

            equal({ type: 'paused' }, yield* _(() => fiber.status))

            equal({ type: 'completed', value: right(value) }, yield* _(() => fiber.play))

            done()
          } catch (error) {
            done(error)
          }
        })

        pipe(test, toEnv, runAsFiber(scheduler))

        timer.progressTimeBy(1)
      }),
    ]),
  ]),
])
