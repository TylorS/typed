import { createAdapter } from '@most/adapter'
import { filter } from '@most/core/dist/combinator/filter'
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
  useSome,
  useWith,
} from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/fibers/exports'
import { createGuardFromSchema } from '@typed/fp/io/exports'
import { constVoid, flow, pipe } from 'fp-ts/function'

import { GLOBAL_NAMESPACE } from './global'
import { addDisposable } from './hooks/NamespaceDisposables'
import { respondToNamespaceDeleted } from './respondToNamespaceDeleted'
import { respondToSharedValueDeleted } from './respondToSharedValueDeleted'
import { respondToSharedValueUpdated } from './respondToSharedValueUpdated'
import { getSharedEvents, SHARED, SharedEnv } from './SharedEnv'
import { NamespaceDeleted, SharedValueDeleted, SharedValueUpdated } from './SharedEvent'

const namespaceDeletedGuard = createGuardFromSchema(NamespaceDeleted.schema)
const sharedValueDeletedGuard = createGuardFromSchema(SharedValueDeleted.schema)
const sharedValueUpdatedGuard = createGuardFromSchema(SharedValueUpdated.schema)

/**
 * Provides the underlying map used at runtime to dynamically add/remove values
 * within sectioned-off namespaces.
 */
export const provideSharedEnv: Provider<SharedEnv, SchedulerEnv> = <E, A>(
  eff: Effect<E & SharedEnv, A>,
): Effect<E & SchedulerEnv, A> => {
  const env = createSharedEnv(GLOBAL_NAMESPACE)

  return pipe(eff, useWith(listenToEvents(env)), useSome(env))
}

/**
 * Listen to delete events to release all resources
 * @internal
 */
const listenToEvents = (env: SharedEnv) =>
  memo(
    doEffect(function* () {
      const { scheduler } = yield* ask<SchedulerEnv>()
      const stream = yield* getSharedEvents
      const removedEvents = filter(namespaceDeletedGuard.is, stream)
      const sharedValueUpdated = filter(sharedValueUpdatedGuard.is, stream)
      const sharedValueDeleted = filter(sharedValueDeletedGuard.is, stream)

      yield* addDisposable(
        disposeAll([
          removedEvents.run(
            createEmptySink(flow(respondToNamespaceDeleted, useAll(env), execPure)),
            scheduler,
          ),
          sharedValueUpdated.run(
            createEmptySink(flow(respondToSharedValueUpdated, useAll(env), execPure)),
            scheduler,
          ),
          sharedValueDeleted.run(
            createEmptySink(flow(respondToSharedValueDeleted, useAll(env), execPure)),
            scheduler,
          ),
        ]),
      )

      return env
    }),
  )

/**
 * Create a new SharedEnv
 */
export const createSharedEnv = (currentNamespace: PropertyKey): SharedEnv => ({
  currentNamespace,
  [SHARED]: {
    events: createAdapter(),
    keyStores: new Map(),
    children: new Map(),
    parents: new Map(),
    consumers: new Map(),
  },
})

function createEmptySink<A>(onValue: (value: A) => void): Sink<A> {
  return {
    event: (_, a) => onValue(a),
    error: constVoid,
    end: constVoid,
  }
}
