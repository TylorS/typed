import { useSome } from '@fp/Env'
import { awaitStatus } from '@fp/Fiber/awaitStatus'
import { isTerminal } from '@fp/Fiber/Status'
import { doEnv, toEnv } from '@fp/Fx/Env'
import { zip } from '@fp/Resume'
import { dispose } from '@most/disposable'
import { Scheduler } from '@most/types'
import { pipe } from 'fp-ts/function'

import { Fiber } from '../../Fiber'
import { getFiberChildren } from '../FiberChildren'
import { FiberDisposable } from '../FiberDisposable'
import { changeStatus } from './changeStatus'
import { finalize } from './finalize'

export function abort<A>(fiber: Fiber<A>, scheduler: Scheduler) {
  const fx = doEnv(function* (_) {
    const status = yield* _(() => fiber.status)

    if (isTerminal(status)) {
      return
    }

    // Only run abort workflow once
    if (status.type === 'aborting') {
      return yield* _(
        pipe(
          awaitStatus((x) => x.type === 'aborted'),
          useSome({ currentFiber: fiber }),
        ),
      )
    }

    // Check for any registered finalizers which should run before changing status to aborted
    // This should run first to allow for a finalizer to never finish to make this fiber "uncancellable"
    yield* _(finalize(fiber, true))

    // Cancel all the synchronously cancellable resources
    // Dispose of all other resources contained here
    dispose(yield* _(fiber.refs.getRef(FiberDisposable)))

    const children = yield* _(getFiberChildren)
    const fibers = Array.from(children.values())

    // Abort all the child fibers
    yield* _(() => zip(fibers.map((f) => f.abort)))

    yield* _(changeStatus({ type: 'aborted' }))
  })

  return pipe({ currentFiber: fiber, scheduler }, toEnv(fx))
}
