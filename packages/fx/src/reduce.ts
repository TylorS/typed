import { dualWithTrace } from "@effect/data/Debug"
import { isSome } from "@effect/data/Option"
import type { Effect } from "@effect/io/Effect"
import { gen, map, succeed } from "@effect/io/Effect"
import type * as Scope from "@effect/io/Scope"
import { Empty } from "@typed/fx/empty"
import { FromArray } from "@typed/fx/fromArray"
import { FromEffect } from "@typed/fx/fromEffect"
import { FromIterable } from "@typed/fx/fromIterable"
import { FilterMapFx, MapFx } from "@typed/fx/map"

import type { Fx } from "./Fx"
import { observeSync } from "./observe"

export const reduce: {
  <B, A>(b: B, f: (b: B, a: A) => B): <R, E>(
    fx: Fx<R, E, A>,
  ) => Effect<R | Scope.Scope, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, b: B, f: (b: B, a: A) => B): Effect<
    R | Scope.Scope,
    E,
    B
  >
} = dualWithTrace(
  3,
  (trace) =>
    function reduce<R, E, A, B>(
      fx: Fx<R, E, A>,
      b: B,
      f: (b: B, a: A) => B,
    ): Effect<R | Scope.Scope, E, B> {
      if (fx.instanceof(Empty)) {
        return succeed(b).traced(fx.trace).traced(trace)
      } else if (fx.instanceof(FromEffect)) {
        return map(fx.effect as Effect<R, E, A>, (a) => f(b, a))
          .traced(fx.trace)
          .traced(trace)
      } else if (fx.instanceof(FromArray)) {
        return succeed((fx.iterable as Array<A>).reduce(f, b))
          .traced(fx.trace)
          .traced(trace)
      } else if (fx.instanceof(FromIterable)) {
        return succeed(Array.from(fx.iterable as Iterable<A>).reduce(f, b))
          .traced(fx.trace)
          .traced(trace)
      } else if (fx.instanceof(FilterMapFx)) {
        return gen(function* ($) {
          let acc = b

          yield* $(
            observeSync(fx.fx as Fx<R, E, any>, (x) => {
              const a = fx.f(x)

              if (isSome(a)) {
                acc = f(acc, a.value as A)
              }
            }),
          )

          return acc
        }).traced(trace)
      } else if (fx.instanceof(MapFx)) {
        return gen(function* ($) {
          let acc = b

          yield* $(
            observeSync(fx.fx as Fx<R, E, any>, (x) => {
              acc = f(acc, fx.f(x) as A)
            }),
          )

          return acc
        }).traced(trace)
      } else {
        return gen(function* ($) {
          let acc = b

          yield* $(observeSync(fx, (a) => (acc = f(acc, a))))

          return acc
        }).traced(trace)
      }
    },
)
