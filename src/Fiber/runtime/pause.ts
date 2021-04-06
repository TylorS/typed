import { pipe } from 'fp-ts/function'
import { isNone } from 'fp-ts/Option'

import { undisposable } from '../../Disposable'
import { doResume, toResume } from '../../Fx/Resume'
import * as R from '../../Resume'
import { Fiber } from '../Fiber'
import { Status } from '../Status'
import { setFiberPause } from './FiberPause'
import { setFiberStatus } from './FiberStatus'

export const pause = <A>(
  fiber: Fiber<A>,
  onEvent: (event: Status<A>) => void,
): R.Resume<Status<unknown>> => {
  const fx = doResume(function* (_) {
    // Can not pause a fiber with no parent
    if (isNone(fiber.parent)) {
      throw new Error(`Unable to pause a fiber without a parent`)
    }

    const parent = fiber.parent.value
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
          R.run(undisposable(() => onEvent(status))),
        ),
      ),
    )

    return yield* _(parent.status)
  })

  return toResume(fx)
}
