import * as E from '@fp/Env'
import { CurrentFiber, DoF, Fiber, getCurrentFiber } from '@fp/Fiber'
import { Ref } from '@fp/Ref'
import { isSome } from 'fp-ts/Option'

import { HookProviders } from './HookProviders'

/**
 * Traverse up the Fiber tree to find the closest provider of a Reference. Similar to React's
 * Context API.
 */
export function findProvider<E, A>(ref: Ref<E, A>): E.Env<CurrentFiber, Fiber<unknown>> {
  return DoF(function* (_) {
    let cursor = yield* _(getCurrentFiber)

    // Try to lookup memoized provider
    const provider = yield* _(HookProviders.lookup(ref.id))
    if (isSome(provider) && (yield* _(provider.value.refs.hasRef(ref)))) {
      return provider.value
    }

    let hasReference = yield* _(cursor.refs.hasRef(ref))

    while (!hasReference && isSome(cursor.parent)) {
      cursor = cursor.parent.value
      hasReference = yield* _(cursor.refs.hasRef(ref))
    }

    // Memoize provider for future lookup
    yield* _(HookProviders.upsertAt(ref.id, cursor))

    return cursor
  })
}
