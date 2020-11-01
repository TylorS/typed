import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { pipe } from 'fp-ts/function'

import { addToSet } from './common'
import { resetPosition } from './hooks/exports'
import { getCurrentNamespace, getSharedEnv, sendSharedEvent, SharedEnv } from './SharedEnv'
import { usingNamespace } from './usingNamespace'

/**
 * Run an effect using a particular namespace while providing namespace events and managing
 * the shared tree of namespaces.
 */
export const runWithNamespace = curry(
  <E extends SharedEnv, A>(namespace: PropertyKey, effect: Effect<E, A>): Effect<E, A> => {
    const eff = doEffect(function* () {
      yield* sendSharedEvent({ type: 'namespace/started', namespace })

      const { keyStores } = yield* getSharedEnv

      if (!keyStores.has(namespace)) {
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
    const { parents, children } = yield* getSharedEnv

    parents.set(namespace, currentNamespace)

    addToSet(children, currentNamespace, namespace)
  })

  return eff
}
