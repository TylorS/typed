import * as Effect from '@effect/io/Effect'
import type { Scope } from '@effect/io/Scope'

import type { Fx } from './Fx.js'
import { observe } from './observe.js'

export function toArray<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R | Scope, E, Array<A>> {
  return Effect.suspend(() => {
    const array: Array<A> = []

    return Effect.map(
      observe(fx, (a) => Effect.sync(() => array.push(a))),
      () => array,
    )
  })
}
