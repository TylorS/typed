import { doEffect, Effect, EnvOf } from '@typed/fp/Effect/exports'

import { getNextSymbol } from '../sharedRefs/getNextSymbol'
import { getHookEnv, HookEnv } from '../types/HookEnvironment'
import { createRef, Ref } from '../types/Ref'

export function useRef<E, A>(
  initial: Effect<E, A>,
): Effect<HookEnv & EnvOf<typeof getNextSymbol> & E, Ref<A>> {
  const eff = doEffect(function* () {
    const { id, states } = yield* getHookEnv
    const symbol = yield* getNextSymbol(id)

    if (states.has(symbol)) {
      return states.get(symbol) as Ref<A>
    }

    const ref: Ref<A> = createRef(yield* initial)

    states.set(symbol, ref)

    return ref
  })

  return eff
}
