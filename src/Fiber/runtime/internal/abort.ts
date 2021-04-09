import { doEnv, toEnv } from '@fp/Fx/Env'
import { disposeBoth } from '@most/disposable'
import { Disposable } from '@most/types'
import { pipe } from 'fp-ts/function'

import { Fiber } from '../../Fiber'
import { Status } from '../../Status'
import { FiberDisposable } from '../FiberDisposable'
import { sendStatus } from '../FiberSendEvent'
import { setFiberStatus } from '../FiberStatus'
import { finalize } from './finalize'

export function abort<A>(fiber: Fiber<A>, disposable: Disposable) {
  const fx = doEnv(function* (_) {
    // Cancel all the synchronously cancellable resources
    disposeBoth(yield* _(fiber.refs.getRef(FiberDisposable)), disposable).dispose()

    // Check for any registered finalizers which should run before changing status to aborted
    yield* _(finalize(fiber))

    const status: Status<A> = { type: 'aborted' }

    yield* _(setFiberStatus(status))
    yield* _(sendStatus(status))
  })

  return pipe({ currentFiber: fiber }, toEnv(fx))
}
