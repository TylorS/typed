import { doEffect, Effect, map } from '@typed/fp/Effect/exports'

import { createRef, Ref } from '../Ref'
import { SharedEnv } from '../SharedEnv'
import { getNamespaceState } from './NamespaceStates'
import { getNextSymbol } from './NamespaceSymbols'

/**
 * Create a shared reference
 * @hook
 */
export const useRef = <E, A>(initial: Effect<E, A>): Effect<E & SharedEnv, Ref<A>> => {
  const eff = doEffect(function* () {
    const symbol = yield* getNextSymbol
    const ref = yield* getNamespaceState(
      symbol,
      map((a: A) => createRef(a), initial),
    )

    return ref
  })

  return eff
}
