import { zipW } from '@fp/Env'
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
    const children = yield* _(getFiberChildren)
    const fibers = Array.from(children.values())

    // Check for any registered finalizers which should run before changing status to aborted
    // This should run first to allow for a finalizer to never finish to make this fiber "uncancelable"
    // and abort all children in parallel
    yield* _(zipW([finalize(fiber, true), () => zip(fibers.map((f) => f.abort))]))

    // Cancel all the synchronously cancelable resources
    disposeBoth(yield* _(fiber.refs.getRef(FiberDisposable)), disposable).dispose()

    // Set the new status
    const status: Status<A> = { type: 'aborted' }

    yield* _(setFiberStatus(status))
    yield* _(sendStatus(status))
  })

  return pipe({ currentFiber: fiber }, toEnv(fx))
}
