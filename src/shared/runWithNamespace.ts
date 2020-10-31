import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { pipe } from 'fp-ts/function'

import { resetPosition } from './hooks/exports'
import {
  getCurrentNamespace,
  getNamespaceChildren,
  getNamespaceParents,
  getNamespacesMap,
  sendSharedEvent,
  SharedEnv,
} from './SharedEnv'
import { usingNamespace } from './usingNamespace'

/**
 * Run an effect using a particular namespace while providing namespace events and managing
 * the shared tree of namespaces.
 */
export const runWithNamespace = curry(
  <E extends SharedEnv, A>(namespace: PropertyKey, effect: Effect<E, A>): Effect<E, A> => {
    const eff = doEffect(function* () {
      yield* sendSharedEvent({ type: 'namespace/started', namespace })

      const namespaces = yield* getNamespacesMap

      if (!namespaces.has(namespace)) {
        yield* addToTree(namespace)
      }

      yield* pipe(resetPosition, usingNamespace(namespace))

      const returnValue = yield* pipe(effect, usingNamespace(namespace))

      yield* sendSharedEvent({ type: 'namespace/completed', namespace, returnValue })

      return returnValue
    })

    return eff
  },
) as {
  <E extends SharedEnv, A>(namespace: PropertyKey, effect: Effect<E, A>): Effect<E, A>
  (namespace: PropertyKey): <E extends SharedEnv, A>(effect: Effect<E, A>) => Effect<E, A>
}

function addToTree(namespace: PropertyKey) {
  const eff = doEffect(function* () {
    const currentNamespace = yield* getCurrentNamespace
    const parents = yield* getNamespaceParents
    const children = yield* getNamespaceChildren

    parents.set(namespace, currentNamespace)
    addToSet(children, currentNamespace, namespace)
  })

  return eff
}

function addToSet<A, B>(map: Map<A, Set<B>>, key: A, value: B) {
  if (!map.get(key)) {
    map.set(key, new Set())
  }

  const set = map.get(key)!

  set.add(value)
}
