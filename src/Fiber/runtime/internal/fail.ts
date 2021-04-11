import { doEnv, toEnv } from '@fp/Fx/Env'
import { left } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { Fiber } from '../../Fiber'
import { isTerminal, Status } from '../../Status'
import { setFiberReturnValue } from '../FiberReturnValue'
import { changeStatus } from './changeStatus'
import { complete } from './complete'

export function fail<A>(fiber: Fiber<A>, error: Error) {
  const fx = doEnv(function* (_) {
    const current = yield* _(() => fiber.status)

    if (isTerminal(current)) {
      return
    }

    const status: Status<A> = { type: 'failed', error }

    yield* _(setFiberReturnValue(left(error)))
    yield* _(changeStatus(status))
    yield* _(() => complete(fiber))
  })

  return pipe({ currentFiber: fiber }, toEnv(fx))
}
