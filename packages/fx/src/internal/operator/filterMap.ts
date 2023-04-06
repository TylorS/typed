import { dualWithTrace } from '@effect/data/Debug'
import type { Predicate, Refinement } from '@effect/data/Predicate'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import { Effect, Option, Scope } from '@typed/fx/internal/_externals'

export const filterMap: {
  <R, E, A, B>(self: Fx<R, E, A>, f: (a: A) => Option.Option<B>): Fx<R, E, B>
  <A, B>(f: (a: A) => Option.Option<B>): <R, E>(self: Fx<R, E, A>) => Fx<R, E, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, B>(self: Fx<R, E, A>, f: (a: A) => Option.Option<B>): Fx<R, E, B> =>
      new FilterMapFx(self, f).traced(trace),
)

export const filter: {
  <R, E, A, B extends A>(self: Fx<R, E, A>, refinement: Refinement<A, B>): Fx<R, E, B>
  <R, E, A>(self: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A>

  <A, B extends A>(refinement: Refinement<A, B>): <R, E>(self: Fx<R, E, A>) => Fx<R, E, B>
  <A>(predicate: Predicate<A>): <R, E>(self: Fx<R, E, A>) => Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(self: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A> =>
      filterMap(self, (a) => (predicate(a) ? Option.some(a) : Option.none())).traced(trace),
)

export const filterNot: {
  <R, E, A, B extends A>(self: Fx<R, E, A>, refinement: Refinement<A, B>): Fx<R, E, Exclude<A, B>>
  <R, E, A>(self: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A>

  <A, B extends A>(refinement: Refinement<A, B>): <R, E>(
    self: Fx<R, E, A>,
  ) => Fx<R, E, Exclude<A, B>>
  <A>(predicate: Predicate<A>): <R, E>(self: Fx<R, E, A>) => Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(self: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A> =>
      filterMap(self, (a) => (!predicate(a) ? Option.some(a) : Option.none())).traced(trace),
)

export const compact = <R, E, A>(self: Fx<R, E, Option.Option<A>>): Fx<R, E, A> =>
  filterMap(self, (x) => x)

export class FilterMapFx<R, E, A, B> extends BaseFx<R, E, B> {
  readonly name = 'FilterMap' as const

  constructor(readonly self: Fx<R, E, A>, readonly f: (a: A) => Option.Option<B>) {
    super()
  }

  run(sink: Sink<E, B>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.self.run(
      Sink((a) => Option.match(this.f(a), Effect.unit, sink.event), sink.error, sink.end),
    )
  }
}

export function isFilterMap<R, E, A>(fx: Fx<R, E, A>): fx is FilterMapFx<R, E, unknown, A> {
  return fx instanceof FilterMapFx
}
