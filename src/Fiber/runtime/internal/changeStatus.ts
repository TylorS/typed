import { getCurrentFiber } from '@fp/Fiber/Fiber'
import { doEnv, toEnv } from '@fp/Fx/Env'

import { isTerminal, Status } from '../../Status'
import { setFiberStatus } from '../FiberStatus'
import { sendStatus } from './FiberSendEvent'

export const changeStatus = <A>(status: Status<A>) =>
  toEnv(
    doEnv(function* (_) {
      const currentFiber = yield* _(getCurrentFiber)
      const current = yield* _(() => currentFiber.status)

      // Cannot change status if it is already terminal
      if (isTerminal(current)) {
        return
      }

      yield* _(setFiberStatus(status))
      yield* _(sendStatus(status))
    }),
  )
