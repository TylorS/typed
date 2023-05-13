import type { Effect } from "@effect/io/Effect"
import { gen, map, succeed } from "@effect/io/Effect"
import type { Scope } from "@effect/io/Scope"
import { Empty } from "@typed/fx/empty"
import { FromArray } from "@typed/fx/fromArray"
import { FromEffect } from "@typed/fx/fromEffect"
import { FromIterable } from "@typed/fx/fromIterable"

import type { Fx } from "./Fx"
import { observeSync } from "./observe"

const empty: Array<never> = []

const of = <A>(a: A): Array<A> => [a]

export function toArray<R, E, A>(
  fx: Fx<R, E, A>,
): Effect<R | Scope, E, Array<A>> {
  if (fx.instanceof(Empty)) {
    return succeed(empty).traced(fx.trace)
  } else if (fx.instanceof(FromEffect)) {
    return map(fx.effect as Effect<R, E, A>, of).traced(fx.trace)
  } else if (fx.instanceof(FromArray)) {
    return succeed(fx.iterable as Array<A>).traced(fx.trace)
  } else if (fx.instanceof(FromIterable)) {
    return succeed(Array.from(fx.iterable) as Array<A>).traced(fx.trace)
  } else {
    return gen(function* ($) {
      const array: Array<A> = []

      yield* $(observeSync(fx, (a) => array.push(a)))

      return array
    })
  }
}

export function toReadonlyArray<R, E, A>(
  fx: Fx<R, E, A>,
): Effect<R | Scope, E, ReadonlyArray<A>> {
  return toArray(fx)
}
