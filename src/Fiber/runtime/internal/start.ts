import { doEnv, toEnv } from '@fp/Fx/Env'
import { pipe } from 'fp-ts/function'

import { Fiber } from '../../Fiber'
import { Status } from '../../Status'
import { FiberSendStatusRef } from './FiberSendEvent'
import { setFiberStatus } from '../FiberStatus'

export function start<A>(ref: FiberSendStatusRef<A>) {
  return (fiber: Fiber<A>) => {
    const fx = doEnv(function* (_) {
      // Ensures that all other handlers can access this reference to send events
      const send = yield* _(fiber.refs.getRef(ref))

      const status: Status<A> = { type: 'running' }

      yield* _(setFiberStatus(status))

      send(status)
    })

    return pipe({ currentFiber: fiber }, toEnv(fx))
  }
}
