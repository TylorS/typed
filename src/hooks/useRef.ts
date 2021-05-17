import * as E from '@fp/Env'
import { alwaysEqualsEq } from '@fp/Eq'
import { createFiberRef, CurrentFiber, DoF, getCurrentFiber } from '@fp/Fiber'
import { WrappedRef } from '@fp/Ref'
import { Eq } from 'fp-ts/Eq'

import { HookRefs } from './HookRefs'
import { getNextSymbol } from './HookSymbols'

/**
 * This is the most primitive hook, all other hooks are built using it directly
 * or indirectly. It makes use of getNextSymbol to create a Ref dynamically using
 * a memoizable symbol kept by index.
 */
export function useRef<E = unknown, A = any>(
  initial: E.Env<E, A>,
  eq: Eq<A> = alwaysEqualsEq,
): E.Env<CurrentFiber & E, WrappedRef<unknown, E, A>> {
  return DoF(function* (_) {
    const map = yield* _(HookRefs.get)
    const symbol = yield* _(getNextSymbol)

    if (map.has(symbol)) {
      return map.get(symbol)! as WrappedRef<unknown, E, A>
    }

    const currentFiber = yield* _(getCurrentFiber)
    const ref = createFiberRef(currentFiber, initial, symbol, eq)

    map.set(symbol, ref)

    return ref
  })
}
