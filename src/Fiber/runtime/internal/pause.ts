import { doResume, toResume } from '@fp/Fx/Resume'
import * as R from '@fp/Resume'
import { pipe } from 'fp-ts/function'
import { isNone, none, Option, some } from 'fp-ts/Option'

import { Fiber } from '../../Fiber'
import { Status } from '../../Status'
import { sendStatus } from './FiberSendEvent'
import { setFiberStatus } from '../FiberStatus'
import { setFiberPause } from './FiberPause'

export const pause = <A>(fiber: Fiber<A>): R.Resume<Option<Status<unknown>>> => {
  const fx = doResume(function* (_) {
    const currentStatus = yield* _(fiber.status)

    if (currentStatus.type !== 'running') {
      throw new Error(`Unable to pause fiber in status ${JSON.stringify(currentStatus)}`)
    }

    const status: Status<A> = { type: 'paused' }

    yield* _(
      R.async<void>((r) =>
        pipe(
          { currentFiber: fiber },
          setFiberPause(r),
          R.chain(() => pipe({ currentFiber: fiber }, setFiberStatus(status))),
          R.chain(() => pipe({ currentFiber: fiber }, sendStatus(status))),
          R.exec,
        ),
      ),
    )

    if (isNone(fiber.parent)) {
      return none
    }

    return some(yield* _(fiber.parent.value.status))
  })

  return toResume(fx)
}
