import { pipe, unsafeCoerce } from 'fp-ts/function'
import { isNone } from 'fp-ts/Option'

import { Env, useSome } from '../../../Env'
import { doEnv, toEnv } from '../../../Fx/Env'
import { zip } from '../../../Resume'
import { CurrentFiber, Fiber, sendStatus } from '../../Fiber'
import { Status } from '../../Status'
import { getFiberChildren } from '../FiberChildren'
import { FiberFinalizers } from '../FiberFinalizers'
import { getFiberReturnValue } from '../FiberReturnValue'
import { setFiberStatus } from '../FiberStatus'

const isTerminal = (status: Status<any>): boolean =>
  status.type === 'aborted' || status.type === 'completed'

export function complete<A>(fiber: Fiber<A>): Env<unknown, void> {
  const fx = doEnv(function* (_) {
    const children = yield* _(getFiberChildren)
    const returnValue = yield* _(getFiberReturnValue<A>())
    const childStatuses = yield* _(() => zip(Array.from(children.values()).map((c) => c.status)))

    // Not ready to be completed
    if (!childStatuses.every(isTerminal) || isNone(returnValue)) {
      return
    }

    const finalizers = yield* _(fiber.refs.getRef(FiberFinalizers))

    // If there are finalizers make sure they run
    if (finalizers.length > 0) {
      yield* _(() => zip(finalizers.map((f) => f(returnValue))))
      yield* _(pipe(FiberFinalizers, fiber.refs.setRef(unsafeCoerce([]))))
    }

    const status: Status<A> = { type: 'completed', value: returnValue.value }

    yield* _(setFiberStatus(status))
    yield* _(sendStatus(status))

    if (isNone(fiber.parent)) {
      return
    }

    const parent = fiber.parent.value
    const parentStatus = yield* _(() => parent.status)

    if (isTerminal(parentStatus)) {
      return
    }

    yield* _(complete(parent))
  })

  return pipe(
    fx,
    toEnv,
    useSome<CurrentFiber>({ currentFiber: fiber }),
  )
}
