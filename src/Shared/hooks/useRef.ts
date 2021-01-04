import { doEffect, Effect } from '@fp/Effect/exports'
import { createShared, SharedEnv } from '@fp/Shared/core/exports'
import { Eq, eqStrict } from 'fp-ts/Eq'

import { getSharedRef, Ref } from '../Ref/exports'
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
    const ref = yield* getSharedRef(createShared(symbol, initial, eq))

    return ref
  })

  return eff
}
