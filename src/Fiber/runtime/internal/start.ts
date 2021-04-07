import { Fiber, sendStatus } from '@fp/Fiber'
import { doEnv, toEnv } from '@fp/Fx/Env'
import { pipe } from 'fp-ts/function'

import { Status } from '../../Status'
import { setFiberStatus } from '../FiberStatus'

export function start<A>(fiber: Fiber<A>) {
  const fx = doEnv(function* (_) {
    const status: Status<A> = { type: 'running' }

    yield* _(setFiberStatus(status))
    yield* _(sendStatus(status))
  })

  return pipe({ currentFiber: fiber }, toEnv(fx))
}
