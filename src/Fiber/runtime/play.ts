import { disposeBoth } from '@most/disposable'
import { pipe } from 'fp-ts/function'
import { isNone } from 'fp-ts/Option'

import { useSome } from '../../Env'
import { doEnv, toEnv } from '../../Fx/Env'
import { async } from '../../Resume'
import { CurrentFiber, Fiber } from '../Fiber'
import { Status } from '../Status'
import { getFiberPause } from './FiberPause'
import { getFiberStatus, setFiberStatus } from './FiberStatus'

export function play<A>(fiber: Fiber<A>, onEvent: (status: Status<A>) => void) {
  const fx = doEnv(function* (_) {
    const s = yield* _(getFiberStatus<A>())
    const option = yield* _(getFiberPause)

    if (s.type !== 'paused' || isNone(option)) {
      throw new Error(`Unable to play fiber that is not paused`)
    }

    const status: Status<A> = { type: 'running' }
    yield* _(setFiberStatus(status))

    onEvent(status)

    yield* _(() => async<void>((r) => disposeBoth(option.value(), r())))
  })

  return pipe(fx, toEnv, useSome<CurrentFiber>({ currentFiber: fiber }))({})
}
