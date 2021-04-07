import { right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { useSome } from '../../../Env'
import { doEnv, toEnv } from '../../../Fx/Env'
import { CurrentFiber, Fiber } from '../../Fiber'
import { Status } from '../../Status'
import { setFiberReturnValue } from '../FiberReturnValue'
import { setFiberStatus } from '../FiberStatus'
import { complete } from './complete'

export function finish<A>(fiber: Fiber<A>, value: A, onEvent: (status: Status<A>) => void) {
  const fx = doEnv(function* (_) {
    const status: Status<A> = { type: 'finished', value }

    yield* _(setFiberStatus(status))
    onEvent(status)
    yield* _(setFiberReturnValue(right(value)))
    yield* _(complete(fiber, onEvent as (status: Status<unknown>) => void))
  })

  return pipe(
    fx,
    toEnv,
    useSome<CurrentFiber>({ currentFiber: fiber }),
  )
}
