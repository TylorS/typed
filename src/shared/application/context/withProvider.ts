import { Effect, Pure } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'
import { addToSet } from '@typed/fp/Shared/common/addToSet'
import {
  EnvOf,
  getCurrentNamespace,
  getKeyStores,
  getOrCreate,
  Namespace,
  Shared,
  SharedEnv,
  SharedKeyStore,
  usingNamespace,
} from '@typed/fp/Shared/domain/exports'
import { pipe } from 'fp-ts/function'
import { isNone } from 'fp-ts/Option'

import { getNamespaceConsumers } from './NamespaceConsumers'
import { getNamespaceParent } from './NamespaceParent'
import { getNamspaceProviders } from './NamespaceProviders'

/**
 * Uses the tree-like nature of namespaces to traverse "up"
 * to find the provider of Shared value. If none has been provided
 * it will use the root of the tree as the provider to store
 * the initial value. Very similar to React's useContext. If you'd
 * like to only be updated based on a specific part of the state, provide
 * a new Eq instance (tip: see contramap in fp-ts/lib/Eq).
 */
export const withProvider = <S extends Shared, E, A>(
  shared: S,
  f: (provider: Namespace) => Effect<E, A>,
): Effect<E & SharedEnv & EnvOf<S>, A> => {
  const eff = doEffect(function* () {
    const namespace = yield* getCurrentNamespace
    const keyStores = yield* getKeyStores
    const provider = yield* findProvider(shared, namespace, keyStores)
    const providers = yield* getNamspaceProviders
    const consumers = yield* getOrCreate(
      yield* pipe(getNamespaceConsumers, usingNamespace(provider)),
      shared.key,
      Pure.fromIO(() => new Map<Namespace, Set<Shared>>()),
    )

    addToSet(consumers, namespace, shared)

    providers.add(provider)

    return yield* f(provider)
  })

  return eff
}

// Algorithm for finding the provider to use
function* findProvider<S extends Shared>(
  shared: S,
  namespace: Namespace,
  states: Map<Namespace, SharedKeyStore<Shared>>,
): Effect<SharedEnv, Namespace> {
  let current = namespace

  while (current) {
    const hasState = states.get(current)?.has(shared.key)

    if (hasState) {
      return current
    }

    const parent = yield* pipe(getNamespaceParent, usingNamespace(namespace))

    if (isNone(parent)) {
      return current
    }

    current = parent.value
  }

  return namespace
}
