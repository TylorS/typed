import { raf, RafEnv } from '@typed/fp/dom/raf'
import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/scheduler/exports'
import { getCurrentNamespace, getShared, SharedEnv } from '@typed/fp/shared/core/exports'
import { HasBeenUpdated } from '@typed/fp/shared/memoNamespace/exports'

import { Patch, patch } from './Patch'

export type PatchOnRafEnv<A, B> = SchedulerEnv & SharedEnv & RafEnv & Patch<A, B>

/**
 * Keep the root of an Application properly Patched
 */
export function patchOnRaf<A, E, B>(
  initial: A,
  main: Effect<E, B>,
): Effect<E & PatchOnRafEnv<A, B>, never> {
  const eff = doEffect(function* () {
    const namespace = yield* getCurrentNamespace
    const hasBeenUpdated = yield* getShared(HasBeenUpdated(namespace))

    let previous = yield* patch(initial, yield* main)

    while (true) {
      yield* raf

      if (hasBeenUpdated.current) {
        previous = yield* patch(previous, yield* main)
      }
    }
  })

  return eff
}
