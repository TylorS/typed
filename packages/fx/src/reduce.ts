import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'

import { Fx } from './Fx.js'
import { observe } from './observe.js'

export function reduce<R, E, A, B>(
  fx: Fx<R, E, A>,
  b: B,
  f: (b: B, a: A) => B,
): Effect.Effect<R | Scope.Scope, E, B> {
  return Effect.gen(function* ($) {
    let acc = b

    yield* $(observe(fx, (a) => Effect.sync(() => (acc = f(acc, a)))))

    return acc
  })
}
