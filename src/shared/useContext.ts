import { Effect } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'
import { pipe } from 'fp-ts/function'

import { addToSet, getOrCreate } from './common'
import { getShared } from './getShared'
import { EnvOf, Shared, ValueOf } from './Shared'
import { getCurrentNamespace, getSharedEnv, SharedEnv, SharedKeyStore } from './SharedEnv'
import { usingNamespace } from './usingNamespace'

/**
 * Uses the tree-like nature of namespaces to traverse "up"
 * to find the provider of Shared value. If none has been provided
 * it will use the root of the tree as the provider to store
 * the initial value. Very similar to React's useContext. If you'd
 * like to only be updated based on a specific part of the state, provide
 * a new Eq instance (tip: see contramap in fp-ts/lib/Eq).
 */
export const useContext = <S extends Shared>(
  shared: S,
): Effect<SharedEnv & EnvOf<S>, ValueOf<S>> => {
  const eff = doEffect(function* () {
    const namespace = yield* getCurrentNamespace
    const { keyStores, parents, consumers } = yield* getSharedEnv
    const provider = findProvider(shared, namespace, keyStores, parents)
    const consumersOfProvider = getOrCreate(
      consumers,
      provider,
      () => new Map<PropertyKey, Map<PropertyKey, Set<Shared>>>(),
    )
    const consumersOfShared = getOrCreate(
      consumersOfProvider,
      shared.key,
      () => new Map<PropertyKey, Set<Shared>>(),
    )

    addToSet(consumersOfShared, shared.key, shared)

    return yield* pipe(shared, getShared, usingNamespace(provider))
  })

  return eff
}

// Algorithm for finding the provider to use
function findProvider<S extends Shared>(
  shared: S,
  namespace: PropertyKey,
  states: Map<PropertyKey, SharedKeyStore<Shared>>,
  parents: Map<PropertyKey, PropertyKey>,
): PropertyKey {
  let current = namespace

  while (current) {
    const state = states.get(current)?.get(shared.key)

    if (state || !parents.has(current)) {
      return current
    }

    current = parents.get(current)!
  }

  return namespace
}
