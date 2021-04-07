import { pipe } from 'fp-ts/function'

import { useSome } from '../../../Env'
import { doEnv, toEnv } from '../../../Fx/Env'
import { CurrentFiber, Fiber } from '../../Fiber'
import { Status } from '../../Status'
import { setFiberStatus } from '../FiberStatus'

export function start<A>(fiber: Fiber<A>, onEvent: (status: Status<A>) => void) {
  const fx = doEnv(function* (_) {
    const status: Status<A> = { type: 'running' }

    yield* _(setFiberStatus(status))

    onEvent(status)
  })

  return pipe(
    fx,
    toEnv,
    useSome<CurrentFiber>({ currentFiber: fiber }),
  )
}
