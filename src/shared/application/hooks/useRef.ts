import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { shared, SharedEnv } from '@typed/fp/Shared/domain/exports'
import { Eq, eqStrict } from 'fp-ts/Eq'

import { Ref } from '../model/exports'
import { getSharedRef } from '../services/exports'
import { getNextSymbol } from './getNextSymbol'

/**
 * Create a shared reference
 * @hook
 */
export const useRef = <E, A>(
  initial: Effect<E, A>,
  eq: Eq<A> = eqStrict,
): Effect<E & SharedEnv, Ref<A>> => {
  const eff = doEffect(function* () {
    const symbol = yield* getNextSymbol
    const ref = yield* getSharedRef(shared(symbol, initial, eq))

    return ref
  })

  return eff
}
