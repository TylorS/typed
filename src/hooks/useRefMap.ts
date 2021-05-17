import * as E from '@fp/Env'
import { alwaysEqualsEq } from '@fp/Eq'
import { CurrentFiber, DoF, Fiber, getCurrentFiber, usingFiberRefs } from '@fp/Fiber'
import { createRefMap, WrappedRefMap } from '@fp/RefMap'
import { Eq } from 'fp-ts/Eq'
import { flow, pipe } from 'fp-ts/function'

import { HookRefs } from './HookRefs'
import { getNextSymbol } from './HookSymbols'

/**
 * This is the most primitive hook, all other hooks are built using it directly
 * or indirectly. It makes use of getNextSymbol to create a Ref dynamically using
 * a memoizable symbol kept by index.
 */
export function useRefMap<E = unknown, K = any, V = any>(
  initial: E.Env<E, ReadonlyMap<K, V>>,
  key: Eq<K> = alwaysEqualsEq,
  value: Eq<V> = alwaysEqualsEq,
): E.Env<CurrentFiber & E, WrappedRefMap<unknown, E, K, V>> {
  return DoF(function* (_) {
    const map = yield* _(HookRefs.get)
    const symbol = yield* _(getNextSymbol)

    if (map.has(symbol)) {
      return map.get(symbol)! as WrappedRefMap<unknown, E, K, V>
    }

    const currentFiber = yield* _(getCurrentFiber)
    const ref = createFiberRefMap(currentFiber, initial, symbol, key, value)

    map.set(symbol, ref)

    return ref
  })
}

const createFiberRefMap = <E, K, V>(
  currentFiber: Fiber<unknown>,
  initial: E.Env<E, ReadonlyMap<K, V>>,
  id?: PropertyKey | undefined,
  key?: Eq<K> | undefined,
  value?: Eq<V> | undefined,
): WrappedRefMap<unknown, E, K, V> => {
  const ref = createRefMap(initial, id, key, value)
  const provideFiber = E.useSome<CurrentFiber>({ currentFiber })

  return {
    ...ref,
    get: pipe(ref.get, usingFiberRefs, provideFiber),
    has: pipe(ref.has, usingFiberRefs, provideFiber),
    set: flow(ref.set, usingFiberRefs, provideFiber),
    modify: flow(ref.modify, usingFiberRefs, provideFiber),
    delete: pipe(ref.delete, usingFiberRefs, provideFiber),
    lookup: flow(ref.lookup, usingFiberRefs, provideFiber),
    upsertAt: flow(ref.upsertAt, usingFiberRefs, provideFiber),
    deleteAt: flow(ref.deleteAt, usingFiberRefs, provideFiber),
  }
}
