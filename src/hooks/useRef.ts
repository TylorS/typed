import * as E from '@fp/Env'
import { alwaysEqualsEq } from '@fp/Eq'
import { CurrentFiber, Fiber, getCurrentFiber, usingFiberRefs } from '@fp/Fiber'
import { Do } from '@fp/Fx/Env'
import { createRef, WrappedRef } from '@fp/Ref'
import { Eq } from 'fp-ts/Eq'
import { flow, pipe } from 'fp-ts/function'

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
  return usingFiberRefs(
    Do(function* (_) {
      const map = yield* _(HookRefs.get)
      const symbol = yield* _(getNextSymbol)

      if (map.has(symbol)) {
        return map.get(symbol)! as WrappedRef<unknown, E, A>
      }

      const currentFiber = yield* _(getCurrentFiber)
      const ref = createFiberRef(currentFiber, initial, symbol, eq)

      map.set(symbol, ref)

      return ref
    }),
  )
}

function createFiberRef<E, A>(
  currentFiber: Fiber<unknown>,
  initial: E.Env<E, A>,
  id?: PropertyKey | undefined,
  eq?: Eq<A> | undefined,
): WrappedRef<unknown, E, A> {
  const ref = createRef(initial, id, eq)
  const provideFiber = E.useSome<CurrentFiber>({ currentFiber })

  return {
    ...ref,
    get: pipe(ref.get, usingFiberRefs, provideFiber),
    has: pipe(ref.has, usingFiberRefs, provideFiber),
    set: flow(ref.set, usingFiberRefs, provideFiber),
    modify: flow(ref.modify, usingFiberRefs, provideFiber),
    delete: pipe(ref.delete, usingFiberRefs, provideFiber),
  }
}
