import { Env, map } from '@fp/Env'
import { CurrentFiber, withFiberRefs } from '@fp/Fiber'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import { createRef, getRef } from '@fp/Ref'

import { getNextSymbol } from './HookSymbols'

export interface MutableRef<A> {
  current: A
}

const mutableRef = <A>(current: A): MutableRef<A> => ({ current })

export function useRef<E = unknown, A = any>(
  initial: Env<E, A>,
): Env<CurrentFiber & E, MutableRef<A>> {
  return withFiberRefs(
    Do(function* (_) {
      const symbol = yield* _(getNextSymbol)
      const ref = createRef(pipe(initial, map(mutableRef)), symbol)

      return yield* _(getRef(ref))
    }),
  )
}
