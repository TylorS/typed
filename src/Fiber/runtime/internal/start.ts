import { pipe } from 'fp-ts/function'

import { useSome } from '../../../Env'
import { doEnv, toEnv } from '../../../Fx/Env'
import { CurrentFiber, Fiber, sendStatus } from '../../Fiber'
import { Status } from '../../Status'
import { setFiberStatus } from '../FiberStatus'

export function start<A>(fiber: Fiber<A>) {
  const fx = doEnv(function* (_) {
    const status: Status<A> = { type: 'running' }

    yield* _(setFiberStatus(status))
    yield* _(sendStatus(status))
  })

  return pipe(
    fx,
    toEnv,
    useSome<CurrentFiber>({ currentFiber: fiber }),
  )
}
