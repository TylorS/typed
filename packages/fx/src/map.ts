import type { Trace } from "@effect/data/Debug"
import { dualWithTrace } from "@effect/data/Debug"
import { pipe } from "@effect/data/Function"
import { flatMap, match, none, type Option, some } from "@effect/data/Option"
import type { Predicate, Refinement } from "@effect/data/Predicate"
import { unit } from "@effect/io/Effect"
import type { Fx } from "@typed/fx/Fx"
import { BaseFx, Sink } from "@typed/fx/Fx"

export const map: {
  <A, B>(f: (a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B>
} = dualWithTrace(
  2,
  (trace) =>
    function map<R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B> {
      return MapFx.make(fx, f, trace)
    },
)

export class MapFx<R, E, A, B> extends BaseFx<R, E, B> {
  constructor(
    readonly fx: Fx<R, E, A>,
    readonly f: (a: A) => B,
    readonly trace: Trace,
  ) {
    super(trace)
  }

  run<R2>(sink: Sink<R2, E, B>) {
    const { f, fx, trace } = this

    return fx.run(Sink((a) => sink.event(f(a)), sink.error)).traced(trace)
  }

  static make<R, E, A, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => B,
    trace: Trace,
  ): Fx<R, E, B> {
    if (fx.instanceof(MapFx)) {
      return new MapFx(fx.fx as Fx<R, E, any>, (a) => f(fx.f(a) as A), trace)
    } else if (fx.instanceof(FilterFx)) {
      return FilterMapFx.make(
        fx.fx as Fx<R, E, any>,
        (a) => (fx.f(a) ? some(f(a as A)) : none()),
        trace,
      )
    } else {
      return new MapFx(fx, f, trace)
    }
  }
}

export const filter: {
  <A, B extends A>(f: Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <A>(f: Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>

  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: Refinement<A, B>): Fx<R, E, B>
  <R, E, A>(fx: Fx<R, E, A>, f: Predicate<A>): Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    function filter<R, E, A>(fx: Fx<R, E, A>, f: Predicate<A>): Fx<R, E, A> {
      return FilterFx.make(fx, f, trace)
    },
)

export class FilterFx<R, E, A> extends BaseFx<R, E, A> {
  constructor(
    readonly fx: Fx<R, E, A>,
    readonly f: Predicate<A>,
    trace: Trace,
  ) {
    super(trace)
  }

  run<R2>(sink: Sink<R2, E, A>) {
    const { f, fx, trace } = this

    return fx
      .run(Sink((a) => (f(a) ? sink.event(a) : unit()), sink.error))
      .traced(trace)
  }

  static make<R, E, A>(
    fx: Fx<R, E, A>,
    f: Predicate<A>,
    trace: Trace,
  ): Fx<R, E, A> {
    if (fx.instanceof(FilterFx)) {
      return new FilterFx(fx.fx as Fx<R, E, any>, (a) => fx.f(a) && f(a), trace)
    } else {
      return new FilterFx(fx, f, trace)
    }
  }
}

export const filterMap: {
  <A, B>(f: (a: A) => Option<B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => Option<B>): Fx<R, E, B>
} = dualWithTrace(
  2,
  (trace) =>
    function filterMap<R, E, A, B>(
      fx: Fx<R, E, A>,
      f: (a: A) => Option<B>,
    ): Fx<R, E, B> {
      return FilterMapFx.make(fx, f, trace)
    },
)

export class FilterMapFx<R, E, A, B> extends BaseFx<R, E, B> {
  constructor(
    readonly fx: Fx<R, E, A>,
    readonly f: (a: A) => Option<B>,
    readonly trace: Trace,
  ) {
    super(trace)
  }

  run<R2>(sink: Sink<R2, E, B>) {
    const { f, fx, trace } = this

    return fx
      .run(Sink((a) => match(f(a), unit, sink.event), sink.error))
      .traced(trace)
  }

  static make<R, E, A, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Option<B>,
    trace: Trace,
  ): Fx<R, E, B> {
    if (fx.instanceof(FilterFx)) {
      return new FilterMapFx(
        fx.fx as Fx<R, E, any>,
        (a) => (fx.f(a) ? f(a) : none()),
        trace,
      )
    } else if (fx.instanceof(MapFx)) {
      return new FilterMapFx(
        fx.fx as Fx<R, E, any>,
        (a) => f(fx.f(a) as A),
        trace,
      )
    } else if (fx.instanceof(FilterMapFx)) {
      return new FilterMapFx(
        fx.fx as Fx<R, E, any>,
        (a) => pipe(fx.f(a) as Option<A>, flatMap(f)),
        trace,
      )
    } else {
      return new FilterMapFx(fx, f, trace)
    }
  }
}
