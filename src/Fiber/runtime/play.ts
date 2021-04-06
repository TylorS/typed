import { disposeBoth } from '@most/disposable'
import { pipe } from 'fp-ts/function'
import { isNone } from 'fp-ts/Option'

import { doEnv, toEnv } from '../../Fx/Env'
import { async } from '../../Resume'
import { Status } from '../Status'
import { getFiberPause } from './FiberPause'
import { getFiberStatus, setFiberStatus } from './FiberStatus'

export function play<A>(onEvent: (status: Status<A>) => void) {
  const fx = doEnv(function* (_) {
    const s = yield* _(getFiberStatus<A>())
    const option = yield* pipe(getFiberPause, _)

    if (s.type !== 'paused' || isNone(option)) {
      throw new Error(`Unable to play fiber that is not paused`)
    }

    const status: Status<A> = { type: 'running' }

    yield* _(() => async<void>((r) => disposeBoth(option.value(), r())))
    yield* _(setFiberStatus(status))

    onEvent(status)
  })

  return pipe(fx, toEnv)
}
