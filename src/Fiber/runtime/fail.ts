import { left } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { useSome } from '../../Env'
import { doEnv, toEnv } from '../../Fx/Env'
import { CurrentFiber, Fiber } from '../Fiber'
import { Status } from '../Status'
import { complete } from './complete'
import { setFiberReturnValue } from './FiberReturnValue'
import { setFiberStatus } from './FiberStatus'

export function fail<A>(fiber: Fiber<A>, error: Error, onEvent: (status: Status<A>) => void) {
  const fx = doEnv(function* (_) {
    const status: Status<A> = { type: 'failed', error }

    yield* _(setFiberStatus(status))
    onEvent(status)
    yield* _(setFiberReturnValue(left(error)))
    yield* _(complete(fiber, onEvent as (status: Status<unknown>) => void))
  })

  return pipe(
    fx,
    toEnv,
    useSome<CurrentFiber>({ currentFiber: fiber }),
  )
}
