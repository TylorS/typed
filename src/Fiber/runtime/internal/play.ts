import { disposeBoth } from '@most/disposable'
import { pipe } from 'fp-ts/function'
import { isNone } from 'fp-ts/Option'

import { doEnv, toEnv } from '../../../Fx/Env'
import { async } from '../../../Resume'
import { Fiber, sendStatus } from '../../Fiber'
import { Status } from '../../Status'
import { getFiberStatus, setFiberStatus } from '../FiberStatus'
import { getFiberPause } from './FiberPause'

export function play<A>(fiber: Fiber<A>) {
  const fx = doEnv(function* (_) {
    const s = yield* _(getFiberStatus<A>())
    const option = yield* _(getFiberPause)

    if (s.type !== 'paused' || isNone(option)) {
      throw new Error(`Unable to play fiber that is not paused`)
    }

    const status: Status<A> = { type: 'running' }
    yield* _(setFiberStatus(status))
    yield* _(sendStatus(status))

    yield* _(() => async<void>((r) => disposeBoth(option.value(), r())))
  })

  return pipe({ currentFiber: fiber }, toEnv(fx))
}
