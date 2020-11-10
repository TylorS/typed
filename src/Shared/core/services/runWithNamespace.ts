import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { pipe } from 'fp-ts/function'

import { sendSharedEvent } from '../events/SharedEventEnv'
import { Namespace } from '../model/Namespace'
import { getCurrentNamespace } from './getCurrentNamespace'
import { getKeyStores } from './getKeyStores'
import { SharedEnv } from './SharedEnv'
import { usingNamespace } from './usingNamespace'

/**
 * Run an effect using a particular namespace while providing namespace events and managing
 * the shared tree of namespaces.
 */
export const runWithNamespace = curry(
  <E extends SharedEnv, A>(namespace: Namespace, effect: Effect<E, A>): Effect<E, A> => {
    const eff = doEffect(function* () {
      const keyStores = yield* getKeyStores

      if (!keyStores.has(namespace)) {
        keyStores.set(namespace, new Map())

        yield* sendSharedEvent({ type: 'namespace/created', namespace })
      }

      const parent = yield* getCurrentNamespace

      yield* sendSharedEvent({
        type: 'namespace/started',
        parent,
        namespace,
        effect,
      })

      const returnValue = yield* pipe(effect, usingNamespace(namespace))

      yield* sendSharedEvent({
        type: 'namespace/completed',
        parent,
        namespace,
        effect,
        returnValue,
      })

      return returnValue
    })

    return eff
  },
) as {
  <E extends SharedEnv, A>(namespace: Namespace, effect: Effect<E, A>): Effect<E, A>
  (namespace: Namespace): <E extends SharedEnv, A>(effect: Effect<E, A>) => Effect<E, A>
}
