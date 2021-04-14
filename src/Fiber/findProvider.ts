import { useSome } from '@fp/Env'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import { hasRef, Ref } from '@fp/Ref'
import { isSome } from 'fp-ts/Option'

import { CurrentFiber, getCurrentFiber, withFiberRefs } from './Fiber'

/**
 * Traverse up the part tree
 */
export function findProvider<E, A>(ref: Ref<E, A>) {
  return Do(function* (_) {
    let current = yield* _(getCurrentFiber)

    const check = () =>
      _(
        pipe(
          ref,
          hasRef,
          withFiberRefs,
          useSome<CurrentFiber>({ currentFiber: current }),
        ),
      )

    let has: boolean = yield* check()

    while (!has && isSome(current.parent)) {
      current = current.parent.value
      has = yield* check()
    }

    return current
  })
}
