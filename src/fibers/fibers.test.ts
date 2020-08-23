import { newDefaultScheduler } from '@most/scheduler'
import { doEffect } from '@typed/fp/Effect/doEffect'
import { fork, getParentFiber } from '@typed/fp/fibers/FiberEnv'
import { runAsFiber } from '@typed/fp/fibers/runAsFiber'
import { describe, it } from '@typed/test'
import { none, some } from 'fp-ts/es6/Option'

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
  ]),
])
