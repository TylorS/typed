import { filter } from '@most/core'
import { ask, doEffect, Effect } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/fibers/exports'
import {
  getShared,
  getSharedEvents,
  Namespace,
  NamespaceUpdated,
  setShared,
  shared,
  SharedEnv,
  usingNamespace,
} from '@typed/fp/Shared/domain/exports'
import { constVoid, pipe } from 'fp-ts/function'

import { createRef } from './model/Ref'
import { runWithNamespace } from './runWithNamespace'
import { addDisposable } from './services/exports'

/**
 * Memoize the result of an effect, only updating when Namespace
 * has been marked as updated.
 */
export const useMemoNamespace = <E extends SharedEnv, A>(
  namespace: Namespace,
  effect: Effect<E, A>,
): Effect<E & SchedulerEnv, A> => {
  const using = usingNamespace(namespace)
  const run = runWithNamespace(namespace, effect)
  const eff = doEffect(function* () {
    // Listen to updated events
    const hasBeenUpdated = yield* pipe(HasBeenUpdated(namespace), getShared, using)
    const previous = yield* pipe(ReturnValue(run), getShared, using)

    if (hasBeenUpdated.current) {
      return yield* setShared(ReturnValue(effect), yield* run)
    }

    return previous
  })

  return eff
}

// Keep track of the current return value
export const RETURN_VALUE = Symbol('ReturnValue')
export const ReturnValue = <E, A>(initial: Effect<E, A>) => shared(RETURN_VALUE, initial)

// Listen to update events and mark as updated
export const HAS_BEEN_UPDATED = Symbol('HAS_BEEN_UPDATED')
export const HasBeenUpdated = (namespace: Namespace) =>
  shared(
    HAS_BEEN_UPDATED,
    doEffect(function* () {
      const { scheduler } = yield* ask<SchedulerEnv>()
      const events = yield* getSharedEvents
      const updatedEvents = filter(
        (e): e is NamespaceUpdated => e.type === 'namespace/updated' && e.namespace === namespace,
        events,
      )
      const hasBeenUpdated = createRef(false)
      const disposable = updatedEvents.run(
        {
          event: () => (hasBeenUpdated.current = true),
          end: constVoid,
          error: constVoid,
        },
        scheduler,
      )

      yield* addDisposable(disposable)

      return hasBeenUpdated
    }),
  )
