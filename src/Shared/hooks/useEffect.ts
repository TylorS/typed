import { Effect } from '@fp/Effect/Effect'
import { askFor, chain, doEffect, execPure } from '@fp/Effect/exports'
import { delay, SchedulerEnv } from '@fp/Scheduler/exports'
import { defaultEqs, EqsOf } from '@fp/Shared/common/EqsOf'
import { SharedEnv } from '@fp/Shared/core/exports'
import { Disposable } from '@most/types'
import { pipe } from 'fp-ts/function'

import { useDisposable } from './useDisposable'

/**
 * Schedule to perform an Effect everytime the dependencies change,
 * as defined by the (optionally) provided Eq instances.
 */
export const useEffect = <E, A, Deps extends ReadonlyArray<unknown> = ReadonlyArray<unknown>>(
  effect: Effect<E, A>,
  deps: Deps,
  eqs: EqsOf<Deps> = defaultEqs(deps),
): Effect<SharedEnv & E & SchedulerEnv, Disposable> => {
  const eff = doEffect(function* () {
    const pure = yield* askFor(
      pipe(
        delay(0),
        chain(() => effect),
      ),
    )

    return yield* useDisposable(() => execPure(pure), deps, eqs)
  })

  return eff
}
