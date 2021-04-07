import { Fiber, sendStatus } from '@fp/Fiber'
import { doEnv, toEnv } from '@fp/Fx/Env'
import { left } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { Status } from '../../Status'
import { setFiberReturnValue } from '../FiberReturnValue'
import { setFiberStatus } from '../FiberStatus'
import { complete } from './complete'

export function fail<A>(fiber: Fiber<A>, error: Error) {
  const fx = doEnv(function* (_) {
    const status: Status<A> = { type: 'failed', error }

    yield* _(setFiberStatus(status))
    yield* _(setFiberReturnValue(left(error)))
    yield* _(sendStatus(status))
    yield* _(() => complete(fiber))
  })

  return pipe({ currentFiber: fiber }, toEnv(fx))
}
