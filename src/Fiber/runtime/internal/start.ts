import { doEnv, toEnv } from '@fp/Fx/Env'
import { pipe } from 'fp-ts/function'

import { Fiber } from '../../Fiber'
import { Status } from '../../Status'
import { FiberStatus } from '../FiberStatus'
import { FiberSendStatusRef } from './FiberSendEvent'

/**
 * @internal
 */
export function start<A>(ref: FiberSendStatusRef<A>) {
  return (fiber: Fiber<A>) => {
    const fx = doEnv(function* (_) {
      const current = yield* _(() => fiber.status)

      if (current.type !== 'queued') {
        throw new Error(`Unable to start a fiber in status ${JSON.stringify(current)}`)
      }

      // Ensures that all other handlers can access this reference to send events
      const send = yield* _(fiber.refs.getRef(ref))

      const status: Status<A> = { type: 'running' }

      yield* _(pipe(FiberStatus<A>(), fiber.refs.setRef<Status<A>>(status)))

      send(status)
    })

    return toEnv(fx)({})
  }
}
