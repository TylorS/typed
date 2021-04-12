import { doEnv, toEnv } from '@fp/Fx/Env'
import { Resume, zip } from '@fp/Resume'
import { pipe } from 'fp-ts/function'
import { getOrElse, isNone } from 'fp-ts/Option'

import { Fiber } from '../../Fiber'
import { isTerminal, Status } from '../../Status'
import { getFiberChildren } from '../FiberChildren'
import { getFiberReturnValue } from '../FiberReturnValue'
import { changeStatus } from './changeStatus'
import { finalize } from './finalize'

export function complete<A>(fiber: Fiber<A>): Resume<void> {
  const fx = doEnv(function* (_) {
    const current = yield* _(() => fiber.status)

    if (isTerminal(current)) {
      return
    }

    const children = yield* _(getFiberChildren)
    const returnValue = yield* _(getFiberReturnValue<A>())
    const childStatuses = yield* _(() => zip(Array.from(children.values()).map((c) => c.status)))

    // Not ready to be completed
    if (!childStatuses.every(isTerminal) || isNone(returnValue)) {
      return
    }

    // Check for any registered finalizers which should run before changing status to aborted
    yield* _(finalize(fiber))

    const status: Status<A> = {
      type: 'completed',
      value: pipe(
        yield* _(getFiberReturnValue<A>()),
        getOrElse(() => returnValue.value),
      ),
    }

    yield* _(changeStatus(status))

    if (isNone(fiber.parent)) {
      return
    }

    const parent = fiber.parent.value
    const parentStatus = yield* _(() => parent.status)

    if (isTerminal(parentStatus)) {
      return
    }

    yield* _(() => complete(parent))
  })

  return pipe({ currentFiber: fiber }, toEnv(fx))
}
