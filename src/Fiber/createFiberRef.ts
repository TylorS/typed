import * as E from '@fp/Env'
import { Eq } from '@fp/Eq'
import { flow, pipe } from '@fp/function'
import { createRef, URef } from '@fp/Ref'

import { CurrentFiber, Fiber, usingFiberRefs } from './Fiber'

/**
 * Creates a Reference which is binded to a particular Fiber for its value.
 */
export function createFiberRef<E, A>(
  currentFiber: Fiber<unknown>,
  initial: E.Env<E, A>,
  id?: PropertyKey | undefined,
  eq?: Eq<A> | undefined,
): URef<E, A> {
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
