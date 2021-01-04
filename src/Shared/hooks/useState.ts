import { deepEqualsEq } from '@fp/common/exports'
import { Effect } from '@fp/Effect/Effect'
import { doEffect } from '@fp/Effect/exports'
import { createShared, SharedEnv } from '@fp/Shared/core/exports'
import { Eq } from 'fp-ts/Eq'

import { getSharedState, State } from '../State/exports'
import { getNextSymbol } from './getNextSymbol'

/**
 * Create a piece of local state
 * @hook
 */
export const useState = <E, A>(
  initial: Effect<E, A>,
  eq: Eq<A> = deepEqualsEq,
): Effect<E & SharedEnv, State<A>> => {
  const eff = doEffect(function* () {
    const symbol = yield* getNextSymbol
    return yield* getSharedState(createShared(symbol, initial, eq))
  })

  return eff
}
