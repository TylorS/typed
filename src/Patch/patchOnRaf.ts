import { raf, RafEnv } from '@typed/fp/dom/raf'
import { doEffect, Effect, forever } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/scheduler/exports'
import { getShared, Namespace, runWithNamespace, SharedEnv } from '@typed/fp/Shared/core/exports'
import { HasBeenUpdated } from '@typed/fp/Shared/memoNamespace/exports'
import { pipe } from 'fp-ts/lib/function'

import { Patch, patch } from './Patch'

export type PatchOnRafEnv<A, B> = SchedulerEnv & SharedEnv & RafEnv & Patch<A, B>

/**
 * Keep the root of an Application properly Patched
 */
export function patchOnRaf<A, E extends SharedEnv, B>(
  initial: A,
  main: Effect<E, B>,
): Effect<E & PatchOnRafEnv<A, B>, never> {
  const eff = doEffect(function* () {
    const namespace = Namespace.wrap(Symbol('PatchOnRaf :: Main'))
    const hasBeenUpdated = yield* getShared(HasBeenUpdated(namespace))
    const runMain = pipe(main, runWithNamespace(namespace))

    let previous = yield* patch(initial, yield* runMain)

    return yield* forever(
      doEffect(function* () {
        yield* raf

        if (hasBeenUpdated.current) {
          previous = yield* patch(previous, yield* runMain)
        }
      }),
    )
  })

  return eff
}
