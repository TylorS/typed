import { doEnv, toEnv } from '@fp/Fx/Env'
import { zip } from '@fp/Resume'
import { disposeBoth } from '@most/disposable'
import { Disposable } from '@most/types'
import { pipe } from 'fp-ts/function'
import { none } from 'fp-ts/Option'

import { Fiber, sendStatus } from '../../Fiber'
import { Status } from '../../Status'
import { FiberDisposable } from '../FiberDisposable'
import { FiberFinalizers } from '../FiberFinalizers'
import { setFiberStatus } from '../FiberStatus'

export function abort<A>(fiber: Fiber<A>, disposable: Disposable) {
  const fx = doEnv(function* (_) {
    // Cancel all the synchronously cancellable resources
    disposeBoth(yield* _(fiber.refs.getRef(FiberDisposable)), disposable).dispose()

    // Check for any registered finalizers which should run before changing status to aborted
    const finalizers = yield* _(fiber.refs.getRef(FiberFinalizers))

    if (finalizers.length > 0) {
      const status: Status<A> = { type: 'aborting' }

      yield* _(setFiberStatus(status))
      yield* _(sendStatus(status))
      yield* _(() => zip(finalizers.map((f) => f(none))))
    }

    const status: Status<A> = { type: 'aborted' }

    yield* _(setFiberStatus(status))
    yield* _(sendStatus(status))
  })

  return pipe({ currentFiber: fiber }, toEnv(fx))
}
