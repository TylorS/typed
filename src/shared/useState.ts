import { deepEqualsEq } from '@typed/fp/common/exports'
import { doEffect, Effect, map } from '@typed/fp/Effect/exports'
import { Eq } from 'fp-ts/Eq'

import { getNamespaceState } from './NamespaceStates'
import { getNextSymbol } from './NamespaceSymbols'
import { getCurrentNamespace, getSendSharedEvent, SharedEnv } from './SharedEnv'
import { createState, State } from './State'

/**
 * Create a piece of state
 * @hook
 */
export const useState = <E, A>(
  initial: Effect<E, A>,
  eq: Eq<A> = deepEqualsEq,
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
