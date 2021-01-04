import { raf, RafEnv } from '@fp/dom/raf'
import { doEffect, Effect, forever } from '@fp/Effect/exports'
import { SchedulerEnv } from '@fp/Scheduler/exports'
import {
  Namespace,
  NamespaceUpdated,
  runWithNamespace,
  SharedEnv,
  SharedValueUpdated,
} from '@fp/Shared/core/exports'
import { pipe } from 'fp-ts/function'
import { refine, union } from 'io-ts/Guard'

import { createGuard } from '../io/exports'
import { listenToSharedEvent } from '../Shared/exports'
import { createRef } from '../Shared/Ref/Ref'
import { Patch, patch } from './Patch'

export type PatchOnRafEnv<A, B> = SchedulerEnv & SharedEnv & RafEnv & Patch<A, B>

const namespaceUpdatedGuard = createGuard(NamespaceUpdated.schema)
const sharedValueUpdatedGuard = createGuard(SharedValueUpdated.schema)

const createNamespaceGuard = (namespace: Namespace) =>
  pipe(
    union(namespaceUpdatedGuard, sharedValueUpdatedGuard),
    refine(
      (a: NamespaceUpdated | SharedValueUpdated): a is NamespaceUpdated | SharedValueUpdated =>
        a.namespace === namespace,
    ),
  )

/**
 * Keep the root of an Application properly Patched
 */
export function patchOnRaf<A, E extends SharedEnv, B>(
  initial: A,
  main: Effect<E, B>,
): Effect<E & PatchOnRafEnv<A, B>, never> {
  const eff = doEffect(function* () {
    const namespace = Namespace.wrap(Symbol('PatchOnRaf :: Main'))
    const hasBeenUpdated = createRef(false)
    const runMain = pipe(main, runWithNamespace(namespace))

    yield* listenToSharedEvent(
      createNamespaceGuard(namespace),
      () => (hasBeenUpdated.current = true),
    )

    let previous = yield* patch(initial, yield* runMain)

    return yield* forever(
      doEffect(function* () {
        yield* raf

        if (hasBeenUpdated.current) {
          hasBeenUpdated.current = false
          previous = yield* patch(previous, yield* runMain)
        }
      }),
    )
  })

  return eff
}
