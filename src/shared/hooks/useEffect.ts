import { disposeAll, disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'
import { Effect, Pure } from '@typed/fp/Effect/Effect'
import { ask, chain, doEffect, execPure, provideAll } from '@typed/fp/Effect/exports'
import { delay, SchedulerEnv } from '@typed/fp/fibers/exports'
import { pipe } from 'fp-ts/function'

import { Ref } from '../Ref'
import { SharedEnv } from '../SharedEnv'
import { defaultEqs, EqsOf, tupleEqOf } from './EqsOf'
import { addDisposable, useDepChange } from './exports'
import { useRef } from './useRef'

export const useEffect = <E, A, Deps extends ReadonlyArray<A>>(
  effect: Effect<E, A>,
  deps: Deps,
  eqs: EqsOf<Deps> = defaultEqs(deps),
): Effect<SharedEnv & E & SchedulerEnv, Disposable> => {
  const eff = doEffect(function* () {
    const depsChanged = yield* useDepChange(deps, tupleEqOf(eqs), true)
    const ref: Ref<Disposable> = yield* useRef(Pure.fromIO(disposeNone))

    if (depsChanged) {
      ref.current.dispose()

      const env = yield* ask<E & SchedulerEnv>()
      const disposable = pipe(
        delay(0),
        chain(() => effect),
        provideAll(env),
        execPure,
      )

      ref.current = disposeAll([disposable, yield* addDisposable(disposable)])
    }

    return ref.current
  })

  return eff
}
