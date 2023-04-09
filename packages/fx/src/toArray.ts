import type { Scope } from '@effect/io/Scope'

import type { Fx } from '@typed/fx/Fx'
import { Effect } from '@typed/fx/externals'
import { observe } from '@typed/fx/observe'

export function toArray<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R | Scope, E, Array<A>> {
  return Effect.gen(function* ($) {
    const array: Array<A> = []

    yield* $(observe(fx, (a) => Effect.sync(() => array.push(a))))

    return array
  })
}
