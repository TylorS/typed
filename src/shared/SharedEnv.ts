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
    // Namespace -> Key stores
    readonly keyStores: Map<PropertyKey, SharedKeyStore<Shared>>
    // Child Namespace -> Parent Namespace
    readonly parents: Map<PropertyKey, PropertyKey>
    // Parent Namespace -> Children Namespaces
    readonly children: Map<PropertyKey, Set<PropertyKey>>
    /**
     * Provider Namespace -> Shared Key -> Consumer Namespace -> Shared instances
     */
    readonly consumers: Map<PropertyKey, Map<PropertyKey, Map<PropertyKey, Set<Shared>>>>
  }
}

/**
 * Derive the environment record for a shared value
 */
export type SharedKeyStore<S extends Shared> = Map<KeyOf<S>, ValueOf<S>>

/**
 * Get the top-level shared map
 */
export const getSharedEnv: Effect<SharedEnv, SharedEnv[SHARED]> = asks((e: SharedEnv) => e[SHARED])

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
 * Get the map associated with a given namespace or create it
 */
export function getKeyStore<S extends Shared = Shared>(
  namespace: PropertyKey,
): Effect<SharedEnv, SharedKeyStore<S>> {
  const eff = doEffect(function* () {
    const { keyStores } = yield* getSharedEnv

    if (keyStores.has(namespace)) {
      return keyStores.get(namespace)! as SharedKeyStore<S>
    }

    yield* sendSharedEvent({ type: 'namespace/created', namespace })

    return keyStores.set(namespace, new Map()).get(namespace)! as SharedKeyStore<S>
  })

  return eff
}

/**
 * Modify a namespace map
 */
export function modifyKeyStore<S extends Shared = Shared>(
  namespace: PropertyKey,
  f: (map: SharedKeyStore<S>) => void,
): Effect<SharedEnv, SharedKeyStore<S>> {
  const eff = doEffect(function* () {
    const shared = yield* getKeyStore<S>(namespace)

    f(shared)

    yield* sendSharedEvent({ type: 'namespace/updated', namespace })

    return shared
  })

  return eff
}

/**
 * Delete a namespace
 */
export function deleteKeyStore<S extends Shared = Shared>(
  namespace: PropertyKey,
): Effect<SharedEnv, Option<SharedKeyStore<S>>> {
  return doEffect(function* () {
    const { keyStores } = yield* getSharedEnv
    const option = fromNullable(keyStores.get(namespace) as SharedKeyStore<S>)

    if (isSome(option)) {
      keyStores.delete(namespace)

      yield* sendSharedEvent({ type: 'namespace/deleted', namespace })
    }

    return option
  })
}
