import { disposeBoth } from '@most/disposable'
import { Disposable } from '@most/types'
import { pipe } from 'fp-ts/function'
import { none } from 'fp-ts/Option'

import { useSome } from '../../../Env'
import { doEnv, toEnv } from '../../../Fx/Env'
import { zip } from '../../../Resume'
import { CurrentFiber, Fiber } from '../../Fiber'
import { Status } from '../../Status'
import { FiberDisposable } from '../FiberDisposable'
import { FiberFinalizers } from '../FiberFinalizers'
import { setFiberStatus } from '../FiberStatus'

export function abort<A>(
  fiber: Fiber<A>,
  disposable: Disposable,
  onEvent: (status: Status<A>) => void,
) {
  const fx = doEnv(function* (_) {
    const finalizers = yield* _(fiber.refs.getRef(FiberFinalizers))

    if (finalizers.length > 0) {
      const status: Status<A> = { type: 'aborting' }

      yield* _(setFiberStatus(status))
      onEvent(status)

      yield* _(() => zip(finalizers.map((f) => f(none))))
    }

    disposeBoth(yield* _(fiber.refs.getRef(FiberDisposable)), disposable).dispose()

    const status: Status<A> = { type: 'aborted' }

    yield* _(setFiberStatus(status))
    onEvent(status)
  })

  return pipe(
    fx,
    toEnv,
    useSome<CurrentFiber>({ currentFiber: fiber }),
  )
}
