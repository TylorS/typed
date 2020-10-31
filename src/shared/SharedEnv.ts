import { Adapter } from '@most/adapter'
import { Stream } from '@most/types'
import { asks, doEffect, Effect } from '@typed/fp/Effect/exports'
import { fromNullable, isSome, Option } from 'fp-ts/Option'

import { KeyOf, Shared, ValueOf } from './Shared'
import { SharedEvent } from './SharedEvent'

export const SHARED = '@typed/fp/SharedEnv' as const
export type SHARED = typeof SHARED

/**
 * An environment for a shared value within a particular namespace
 */
export interface SharedEnv {
  readonly currentNamespace: PropertyKey
  readonly [SHARED]: {
    readonly events: Adapter<SharedEvent, SharedEvent>
    readonly states: Map<PropertyKey, SharedMap<Shared>>
    readonly parents: Map<PropertyKey, PropertyKey>
    readonly children: Map<PropertyKey, Set<PropertyKey>>
  }
}

/**
 * Derive the environment record for a shared value
 */
export type SharedMap<S extends Shared> = Map<KeyOf<S>, ValueOf<S>>

/**
 * Get the top-level shared map
 */
export const getNamespacesMap: Effect<SharedEnv, Map<PropertyKey, SharedMap<Shared>>> = asks(
  (e: SharedEnv) => e[SHARED].states,
)

/**
 * Get the top-level shared events
 */
export const getSharedEvents: Effect<SharedEnv, Stream<SharedEvent>> = asks(
  (e: SharedEnv) => e[SHARED].events[1],
)

/**
 * Get the current namespace
 */
export const getCurrentNamespace: Effect<SharedEnv, PropertyKey> = asks(
  (e: SharedEnv) => e.currentNamespace,
)

/**
 * Send a shared event
 */
export const sendSharedEvent = (event: SharedEvent): Effect<SharedEnv, void> =>
  asks((e: SharedEnv) => e[SHARED].events[0](event))

/**
 * Send a shared event
 */
export const getSendSharedEvent: Effect<SharedEnv, (event: SharedEvent) => void> = asks(
  (e: SharedEnv) => e[SHARED].events[0],
)

/**
 * Get dependencies tree
 */
export const getNamespaceChildren: Effect<SharedEnv, Map<PropertyKey, Set<PropertyKey>>> = asks(
  (e: SharedEnv) => e[SHARED].children,
)

/**
 * Get dependents tree
 */
export const getNamespaceParents: Effect<SharedEnv, Map<PropertyKey, PropertyKey>> = asks(
  (e: SharedEnv) => e[SHARED].parents,
)

/**
 * Get the map associated with a given namespace or create it
 */
export function getNamespace<S extends Shared = Shared>(
  namespace: PropertyKey,
): Effect<SharedEnv, SharedMap<S>> {
  const eff = doEffect(function* () {
    const shared = yield* getNamespacesMap

    if (shared.has(namespace)) {
      return shared.get(namespace)! as SharedMap<S>
    }

    yield* sendSharedEvent({ type: 'namespace/created', namespace })

    return shared.set(namespace, new Map()).get(namespace)! as SharedMap<S>
  })

  return eff
}

/**
 * Modify a namespace map
 */
export function modifyNamespace<S extends Shared = Shared>(
  namespace: PropertyKey,
  f: (map: SharedMap<S>) => void,
): Effect<SharedEnv, SharedMap<S>> {
  const eff = doEffect(function* () {
    const shared = yield* getNamespace<S>(namespace)

    f(shared)

    yield* sendSharedEvent({ type: 'namespace/updated', namespace })

    return shared
  })

  return eff
}

/**
 * Delete a namespace
 */
export function deleteNamespace<S extends Shared = Shared>(
  namespace: PropertyKey,
): Effect<SharedEnv, Option<SharedMap<S>>> {
  return doEffect(function* () {
    const map = yield* getNamespacesMap
    const option = fromNullable(map.get(namespace) as SharedMap<S>)

    if (isSome(option)) {
      map.delete(namespace)

      yield* sendSharedEvent({ type: 'namespace/deleted', namespace })
    }

    return option
  })
}
