import * as E from '@fp/Env'
import { alwaysEqualsEq } from '@fp/Eq'
import { CurrentFiber, usingFiberRefs } from '@fp/Fiber'
import { createRef, WrappedRef } from '@fp/Ref'
import { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'

import { getNextSymbol } from './HookSymbols'

/**
 * This is the most primitive hook, all other hooks are built using it directly
 * or indirectly. It makes use of getNextSymbol to create a Ref dynamically using
 * a memoizable symbol kept by index.
 */
export function useRef<E = unknown, A = any>(
  initial: E.Env<E, A>,
  eq: Eq<A> = alwaysEqualsEq,
): E.Env<CurrentFiber & E, WrappedRef<E, A>> {
  return pipe(
    getNextSymbol,
    E.map((symbol) => createRef(initial, symbol, eq)),
    usingFiberRefs,
  )
}
