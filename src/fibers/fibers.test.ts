import { newDefaultScheduler } from '@most/scheduler'
import { doEffect } from '@typed/fp/Effect/doEffect'
import { fork, getParentFiber } from '@typed/fp/fibers/FiberEnv'
import { runAsFiber } from '@typed/fp/fibers/runAsFiber'
import { describe, it } from '@typed/test'
import { flow } from 'fp-ts/es6/function'
import { none, some } from 'fp-ts/es6/Option'

import { disposeNone } from '../Disposable'
import { createVirtualScheduler } from '../VirtualTimer'
import { foldFiberInfo } from './Fiber'
import { delay } from './SchedulerEnv'

export const test = describe(`fibers`, [
  describe(`getParentFiber`, [
    it(`returns None when used in main thread`, ({ equal }, done) => {
      const test = doEffect(function* () {
        const parentFiber = yield* getParentFiber

        try {
          equal(none, parentFiber)

          done()
        } catch (error) {
          done(error)
        }
      })

      runAsFiber(test, newDefaultScheduler())
    }),

    it(`returns Some when used in nested fibers`, ({ equal }, done) => {
      const child = doEffect(function* () {
        const parentFiber = yield* getParentFiber

        try {
          equal(some(fiber), parentFiber)
          done()
        } catch (error) {
          done(error)
        }
      })

      const test = doEffect(function* () {
        yield* fork(child)
      })

      const fiber = runAsFiber(test, newDefaultScheduler())
    }),
  ]),

  describe(`fork`, [
    it(`disposes child as soon as parent is`, ({ ok }, done) => {
      // eslint-disable-next-line require-yield
      const child = doEffect(function* () {
        done(new Error(`Should not be called`))
      })

      const test = doEffect(function* () {
        const childFiber = yield* fork(child)

        try {
          fiber.dispose()

          ok(childFiber.disposed)

          done()
        } catch (error) {
          done(error)
        }
      })

      const fiber = runAsFiber(test, newDefaultScheduler())
    }),

    it(`parent emits success notification when waiting on fiber to complete`, ({ equal }, done) => {
      const delayMs = 10
      const [timer, scheduler] = createVirtualScheduler()
      const expected = 10

      const child = doEffect(function* () {
        yield* delay(delayMs)

        return 1
      })

      const parent = doEffect(function* () {
        yield* fork(child)

        return expected
      })

      const fiber = runAsFiber(parent, scheduler)

      fiber.onInfoChange(
        foldFiberInfo(
          flow(() => timer.progressTimeBy(0), disposeNone), // Fork child
          disposeNone,
          flow(done, disposeNone),
          flow(equal(expected), () => timer.progressTimeBy(delayMs), disposeNone), // Return child
          flow(equal(expected), () => done(), disposeNone),
        ),
      )

      timer.progressTimeBy(0) // Start parent fiber
    }),
  ]),
])
