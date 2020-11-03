import { createAdapter } from '@most/adapter'
import { filter } from '@most/core'
import { disposeAll } from '@most/disposable'
import { Sink } from '@most/types'
import {
  ask,
  doEffect,
  Effect,
  execPure,
  memo,
  Provider,
  useAll,
  useWith,
} from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/fibers/exports'
import { createGuardFromSchema } from '@typed/fp/io/exports'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { Guard } from 'io-ts/Guard'

import { addDisposable, GlobalNamespace } from '../application/exports'
import {
  respondToNamespaceDeleted,
  respondToNamespaceStarted,
  respondToSharedValueDeleted,
  respondToSharedValueUpdated,
} from '../application/handlers/exports'
import {
  getSharedEvents,
  Namespace,
  NamespaceDeleted,
  NamespaceStarted,
  SharedEnv,
  SharedEvent,
  SharedValueDeleted,
  SharedValueUpdated,
} from '../domain/exports'

const namespaceDeletedGuard = createGuardFromSchema(NamespaceDeleted.schema)
const namespaceStartedGuard = createGuardFromSchema(NamespaceStarted.schema)
const sharedValueDeletedGuard = createGuardFromSchema(SharedValueDeleted.schema)
const sharedValueUpdatedGuard = createGuardFromSchema(SharedValueUpdated.schema)

/**
 * Provides the underlying map used at runtime to dynamically add/remove values
 * within sectioned-off namespaces.
 */
export const provideSharedEnv: Provider<SharedEnv, SchedulerEnv> = <E, A>(
  eff: Effect<E & SharedEnv, A>,
): Effect<E & SchedulerEnv, A> =>
  pipe(eff, useWith(listenToEvents(createSharedEnv(GlobalNamespace))))

/**
 * Listen to delete events to release all resources
 * @internal
 */
const listenToEvents = (env: SharedEnv): Effect<SchedulerEnv, SharedEnv> =>
  memo(
    doEffect(function* () {
      const { scheduler } = yield* ask<SchedulerEnv>()
      const stream = yield* pipe(getSharedEvents, useAll(env))
      const listen = <A extends SharedEvent>(
        guard: Guard<unknown, A>,
        respond: (value: A) => Effect<SharedEnv, void>,
      ) =>
        filter(guard.is, stream).run(
          createEmptySink(flow(respond, useAll(env), execPure)),
          scheduler,
        )

      yield* pipe(
        addDisposable(
          disposeAll([
            listen(namespaceDeletedGuard, respondToNamespaceDeleted),
            listen(namespaceStartedGuard, respondToNamespaceStarted),
            listen(sharedValueUpdatedGuard, respondToSharedValueUpdated),
            listen(sharedValueDeletedGuard, respondToSharedValueDeleted),
          ]),
        ),
        useAll(env),
      )

      return env
    }),
  )

/**
 * Create a new SharedEnv
 */
export const createSharedEnv = (currentNamespace: Namespace): SharedEnv => ({
  currentNamespace,
  sharedEvents: createAdapter(),
  namespaceKeyStores: new Map(),
})

function createEmptySink<A>(onValue: (value: A) => void): Sink<A> {
  return {
    event: (_, a) => onValue(a),
    error: constVoid,
    end: constVoid,
  }
}
