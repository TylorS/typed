import type { Scope } from '@effect/io/Scope'

import type { Fx } from './Fx.js'
import { Effect } from './externals.js'
import { observe } from './observe.js'

export function toReadonlyArray<R, E, A>(
  fx: Fx<R, E, A>,
): Effect.Effect<R | Scope, E, ReadonlyArray<A>> {
  return Effect.gen(function* ($) {
    const array: Array<A> = []

    yield* $(observe(fx, (a) => Effect.sync(() => array.push(a))))

    return array
  })
}
