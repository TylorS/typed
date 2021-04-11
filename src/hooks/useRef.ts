import { Env, map } from '@fp/Env'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import { createRef, getRef } from '@fp/Ref'

import { getNextSymbol } from './HookSymbols'

export interface MutableRef<A> {
  current: A
}

const mutableRef = <A>(current: A): MutableRef<A> => ({ current })

export function useRef<E, A>(initial: Env<E, A>) {
  return Do(function* (_) {
    const symbol = yield* _(getNextSymbol)
    const ref = createRef(pipe(initial, map(mutableRef)), symbol)

    return yield* _(getRef(ref))
  })
}
