import { Disposable } from '@most/types'
import { Effect } from '@typed/fp/Effect/Effect'
import { askFor, chain, doEffect, execPure } from '@typed/fp/Effect/exports'
import { delay, SchedulerEnv } from '@typed/fp/Scheduler/exports'
import { defaultEqs, EqsOf } from '@typed/fp/Shared/common/EqsOf'
import { SharedEnv } from '@typed/fp/Shared/core/exports'
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
