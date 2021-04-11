import { doEnv, toEnv } from '@fp/Fx/Env'
import { zip } from '@fp/Resume'
import { disposeBoth } from '@most/disposable'
import { Disposable } from '@most/types'
import { pipe } from 'fp-ts/function'

import { Fiber } from '../../Fiber'
import { Status } from '../../Status'
import { getFiberChildren } from '../FiberChildren'
import { FiberDisposable } from '../FiberDisposable'
import { setFiberStatus } from '../FiberStatus'
import { sendStatus } from './FiberSendEvent'
import { finalize } from './finalize'

export function abort<A>(fiber: Fiber<A>, disposable: Disposable) {
  const fx = doEnv(function* (_) {
    // Check for any registered finalizers which should run before changing status to aborted
    // This should run first to allow for a finalizer to never finish to make this fiber "uncancellable"
    yield* _(finalize(fiber, true))

    // Cancel all the synchronously cancellable resources
    disposeBoth(yield* _(fiber.refs.getRef(FiberDisposable)), disposable).dispose()

    const children = yield* _(getFiberChildren)
    const fibers = Array.from(children.values())

    // Abort all the child fibers
    yield* _(() => zip(fibers.map((f) => f.abort)))

    const status: Status<A> = { type: 'aborted' }

    yield* _(setFiberStatus(status))
    yield* _(sendStatus(status))
  })

  return pipe({ currentFiber: fiber }, toEnv(fx))
}
