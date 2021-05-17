import * as E from '@fp/Env'
import { CurrentFiber, Fiber, getCurrentFiber } from '@fp/Fiber'
import { Do } from '@fp/Fx/Env'
import { Ref } from '@fp/Ref'
import { isSome } from 'fp-ts/Option'

/**
 * Traverse up the Fiber tree to find the closest provider of a Reference. Similar to React's
 * Context API.
 */
export function findProvider<E, A>(ref: Ref<E, A>): E.Env<CurrentFiber & E, Fiber<unknown>> {
  return Do(function* (_) {
    let cursor = yield* _(getCurrentFiber)
    let hasReference = yield* _(cursor.refs.hasRef(ref))

    while (!hasReference && isSome(cursor.parent)) {
      cursor = cursor.parent.value
      hasReference = yield* _(cursor.refs.hasRef(ref))
    }

    return cursor
  })
}
