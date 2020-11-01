import { doEffect, Effect, map } from '@typed/fp/Effect/exports'
import { Eq, eqStrict } from 'fp-ts/Eq'

import { getCurrentNamespace, getSendSharedEvent, SharedEnv } from '../SharedEnv'
import { createState, State } from '../State'
import { getNamespaceState } from './NamespaceStates'
import { getNextSymbol } from './NamespaceSymbols'

/**
 * Create a piece of state
 * @hook
 */
export const useState = <E, A>(
  initial: Effect<E, A>,
  eq: Eq<A> = eqStrict,
): Effect<E & SharedEnv, State<A>> => {
  const eff = doEffect(function* () {
    const symbol = yield* getNextSymbol
    const sendEvent = yield* getSendSharedEvent
    const namespace = yield* getCurrentNamespace
    const state = yield* getNamespaceState(
      symbol,
      map(
        (a) =>
          createState({
            initial: a,
            eq,
            onValue: () => sendEvent({ type: 'namespace/updated', namespace }),
          }),
        initial,
      ),
    )

    return state
  })

  return eff
}
