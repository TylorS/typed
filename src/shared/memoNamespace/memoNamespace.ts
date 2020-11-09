import { filter } from '@most/core'
import { ask, doEffect, Effect } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/scheduler/exports'
import {
  addDisposable,
  createShared,
  getShared,
  getSharedEvents,
  Namespace,
  NamespaceUpdated,
  runWithNamespace,
  setShared,
  SharedEnv,
  usingNamespace,
} from '@typed/fp/shared/core/exports'
import { constVoid, pipe } from 'fp-ts/function'

import { createRef } from '../Ref/exports'

/**
 * Memoize the result of an effect, only updating when Namespace
 * has been marked as updated.
 */
export const memoNamespace = <E extends SharedEnv, A>(
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
export const RETURN_VALUE = Symbol.for('ReturnValue')
export const ReturnValue = <E, A>(initial: Effect<E, A>) => createShared(RETURN_VALUE, initial)

// Listen to update events and mark as updated
export const HAS_BEEN_UPDATED = Symbol.for('HasBeenUpdated')
export const HasBeenUpdated = (namespace: Namespace) =>
  createShared(
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
