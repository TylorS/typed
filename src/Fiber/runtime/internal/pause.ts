import { doResume, toResume } from '@fp/Fx/Resume'
import * as R from '@fp/Resume'
import { pipe } from 'fp-ts/function'
import { isNone, none, Option, some } from 'fp-ts/Option'

import { Fiber } from '../../Fiber'
import { Status } from '../../Status'
import { changeStatus } from './changeStatus'
import { setFiberPause } from './FiberPause'

/**
 * @internal
 */
export const pause = <A>(fiber: Fiber<A>): R.Resume<Option<Status<unknown>>> => {
  const fx = doResume(function* (_) {
    const currentStatus = yield* _(fiber.status)

    if (currentStatus.type !== 'running') {
      throw new Error(`Unable to pause fiber in status ${JSON.stringify(currentStatus)}`)
    }

    const status: Status<A> = { type: 'paused' }
    const env = { currentFiber: fiber }

    yield* _(changeStatus(status)({ currentFiber: fiber }))

    yield* _(R.async<void>((r) => pipe(env, setFiberPause(r), R.exec)))

    if (isNone(fiber.parent)) {
      return none
    }

    return some(yield* _(fiber.parent.value.status))
  })

  return toResume(fx)
}
