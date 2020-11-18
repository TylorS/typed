import { disposeAll, disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'
import { Effect, Pure } from '@typed/fp/Effect/Effect'
import { ask, chain, doEffect, execPure, provideAll } from '@typed/fp/Effect/exports'
import { delay, SchedulerEnv } from '@typed/fp/Scheduler/exports'
import { defaultEqs, EqsOf, tupleEqOf } from '@typed/fp/Shared/common/EqsOf'
import { SharedEnv } from '@typed/fp/Shared/core/exports'
import { pipe } from 'fp-ts/function'

import { addDisposable } from '../core/disposables/exports'
import { Ref } from '../Ref/exports'
import { useDepChange } from './useDepChange'
import { useRef } from './useRef'

/**
 * Schedule to perform an Effect everytime the dependencies change,
 * as defined by the (optionally) provided Eq instances.
 */
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
