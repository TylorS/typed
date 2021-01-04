import { Arity2 } from '@fp/common/types'
import { Effect } from '@fp/Effect/Effect'
import { doEffect } from '@fp/Effect/exports'
import { createShared } from '@fp/Shared/core/constructors/exports'
import { applyReducer, getSharedState, State } from '@fp/Shared/State/exports'
import { Eq, eqStrict } from 'fp-ts/Eq'

import { SharedEnv } from '../core/services/SharedEnv'
import { getNextSymbol } from './getNextSymbol'
import { useMemo } from './useMemo'

/**
 * Use a Reducer to keep track of state.
 */
export const useReducer = <A, B, E>(
  reducer: Arity2<A, B, A>,
  initial: Effect<E, A>,
  eq: Eq<A> = eqStrict,
): Effect<E & SharedEnv, State<A, B>> => {
  const eff = doEffect(function* () {
    const symbol = yield* getNextSymbol
    const shared = yield* useMemo(() => createShared(symbol, initial, eq), [symbol, initial, eq])
    const state = yield* getSharedState(shared)

    return yield* useMemo(() => applyReducer(reducer, state), [reducer, state])
  })

  return eff
}
