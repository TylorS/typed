import { Effect } from '@typed/fp/Effect/Effect'
import { SchedulerEnv } from '@typed/fp/Scheduler/exports'

import { SharedEnv, withCurrentNamespace } from '../core/exports'
import { memoNamespace } from './memoNamespace'

export const withMemo = <E extends SharedEnv, A>(
  effect: Effect<E, A>,
): Effect<E & SchedulerEnv, A> =>
  withCurrentNamespace(function* (namespace) {
    return yield* memoNamespace(namespace, effect)
  })
