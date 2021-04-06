import { Disposable } from '@most/types'
import { pipe } from 'fp-ts/function'

import { useSome } from '../../Env'
import { doEnv, toEnv } from '../../Fx/Env'
import { CurrentFiber, Fiber } from '../Fiber'
import { Status } from '../Status'
import { setFiberStatus } from './FiberStatus'

export function abort<A>(
  fiber: Fiber<A>,
  disposable: Disposable,
  onEvent: (status: Status<A>) => void,
) {
  const fx = doEnv(function* (_) {
    disposable.dispose()

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
