import { doEnv, toEnv } from '@fp/Fx/Env'
import { async } from '@fp/Resume'
import { disposeBoth } from '@most/disposable'
import { pipe } from 'fp-ts/function'
import { isNone } from 'fp-ts/Option'

import { Fiber } from '../../Fiber'
import { getFiberStatus } from '../FiberStatus'
import { changeStatus } from './changeStatus'
import { getFiberPause } from './FiberPause'

export function play<A>(fiber: Fiber<A>) {
  const fx = doEnv(function* (_) {
    const s = yield* _(getFiberStatus<A>())
    const option = yield* _(getFiberPause)

    if (s.type !== 'paused' || isNone(option)) {
      throw new Error(`Unable to play fiber that is not paused`)
    }

    yield* _(changeStatus({ type: 'running' }))
    yield* _(() => async<void>((r) => disposeBoth(option.value(), r())))
  })

  return pipe({ currentFiber: fiber }, toEnv(fx))
}
