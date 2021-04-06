import { pipe } from 'fp-ts/function'
import { isNone } from 'fp-ts/Option'

import { Env, useSome } from '../../Env'
import { doEnv, toEnv } from '../../Fx/Env'
import { CurrentFiber, Fiber } from '../Fiber'
import { Status } from '../Status'
import { getFiberChildren } from './FiberChildren'
import { getFiberReturnValue } from './FiberReturnValue'
import { setFiberStatus } from './FiberStatus'

export function complete(
  fiber: Fiber<unknown>,
  onEvent: (status: Status<unknown>) => void,
): Env<unknown, void> {
  const fx = doEnv(function* (_) {
    const children = yield* _(getFiberChildren)
    const returnValue = yield* _(getFiberReturnValue())

    // Not ready to be completed
    if (children.size > 0 || isNone(returnValue)) {
      return
    }

    const status: Status<unknown> = { type: 'completed', value: returnValue.value }

    yield* _(setFiberStatus(status))

    onEvent(status)

    if (isNone(fiber.parent)) {
      return
    }

    const parent = fiber.parent.value
    const parentStatus = yield* _(() => parent.status)

    if (parentStatus.type === 'aborted' || parentStatus.type === 'completed') {
      return
    }

    yield* _(complete(parent, onEvent))
  })

  return pipe(
    fx,
    toEnv,
    useSome<CurrentFiber>({ currentFiber: fiber }),
  )
}
