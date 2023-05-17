import { dualWithTrace, methodWithTrace } from '@effect/data/Debug'
import type { Duration } from '@effect/data/Duration'
import type { HashSet } from '@effect/data/HashSet'
import type { Predicate, Refinement } from '@effect/data/Predicate'
import type { Equivalence } from '@effect/data/typeclass/Equivalence'
import type { FiberId } from '@effect/io/Fiber/Id'

import type { Fx } from './Fx.js'
import * as internal from './data-first.js'
import type { Cause, Chunk, Context, Effect, Layer, Option, Scope } from './externals.js'

export * from './Fx.js'

export const at: {
  (delay: Duration): <A>(value: A) => Fx<never, never, A>
  <A>(value: A, delay: Duration): Fx<never, never, A>
} = dualWithTrace(
  2,
  (trace) =>
    <A>(value: A, delay: Duration): Fx<never, never, A> =>
      internal.at(value, delay).addTrace(trace),
)

export const catchAllCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E2, A | B>
  <R, E, R2, E2, B>(fx: Fx<R, E, B>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, R2, E2, B>(
      fx: Fx<R, E, B>,
      f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    ): Fx<R | R2, E2, B> =>
      internal.catchAllCause(fx, f).addTrace(trace),
)

export const catchAllCauseEffect: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E2, A | B>
  <R, E, R2, E2, B>(fx: Fx<R, E, B>, f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E2,
    B
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, R2, E2, B>(
      fx: Fx<R, E, B>,
      f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
    ): Fx<R | R2, E2, B> =>
      internal.catchAllCauseEffect(fx, f).addTrace(trace),
)

export const catchAll: {
  <E, R2, E2, B>(f: (e: E) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B> =>
      internal.catchAll(fx, f).addTrace(trace),
)

export const catchAllEffect: {
  <E, R2, E2, B>(f: (e: E) => Effect.Effect<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E2,
    A | B
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(
      fx: Fx<R, E, A>,
      f: (e: E) => Effect.Effect<R2, E2, B>,
    ): Fx<R | R2, E2, A | B> =>
      internal.catchAllEffect(fx, f).addTrace(trace),
)

export const combineAll: <FX extends readonly internal.Fx<any, any, any>[]>(
  ...fx: FX
) => internal.Fx<
  internal.Fx.ResourcesOf<FX[number]>,
  internal.Fx.ErrorsOf<FX[number]>,
  { [k in keyof FX]: internal.Fx.OutputOf<FX[k]> }
> = methodWithTrace(
  (trace) =>
    (...fx) =>
      internal.combineAll(...fx).addTrace(trace),
)

export const combine: {
  <R2, E2, B>(other: Fx<R2, E2, B>): <R, E, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, readonly [A, B]>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, other: Fx<R2, E2, B>): Fx<R | R2, E | E2, readonly [A, B]>
} = dualWithTrace(2, (trace) => (fx, other) => internal.combine(fx, other).addTrace(trace))

export const combineAllDiscard: <FX extends readonly internal.Fx<any, any, any>[]>(
  ...fx: FX
) => internal.Fx<internal.Fx.ResourcesOf<FX[number]>, internal.Fx.ErrorsOf<FX[number]>, void> =
  methodWithTrace(
    (trace) =>
      (...fx) =>
        internal.combineAllDiscard(...fx).addTrace(trace),
  )

export const continueWith: {
  <R2, E2, B>(f: () => Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B> =>
      internal.continueWith(fx, f).addTrace(trace),
)

export const continueWithEffect: {
  <R2, E2, B>(f: () => Effect.Effect<R2, E2, B>): <R, E, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, A | B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: () => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E | E2,
    A | B
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(
      fx: Fx<R, E, A>,
      f: () => Effect.Effect<R2, E2, B>,
    ): Fx<R | R2, E | E2, A | B> =>
      internal.continueWithEffect(fx, f).addTrace(trace),
)

export const startWith: {
  <B>(value: B): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A | B>
  <R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, A | B>
} = dualWithTrace(2, (trace) => (fx, value) => internal.startWith(fx, value).addTrace(trace))

export const debounce: {
  (duration: Duration): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, duration: Duration): Fx<R, E, A>
} = dualWithTrace(2, (trace) => (fx, duration) => internal.debounce(fx, duration).addTrace(trace))

export const delay: {
  (duration: Duration): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, duration: Duration): Fx<R, E, A>
} = dualWithTrace(2, (trace) => (fx, duration) => internal.delay(fx, duration).addTrace(trace))

export const empty: <E = never, A = never>(_: void) => Fx<never, E, A> = methodWithTrace(
  (trace) => () => internal.empty().addTrace(trace),
)

export const exhaustMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>) =>
      internal.exhaustMap(fx, f).addTrace(trace),
)

export const exhaustMapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E | E2,
    B
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>) =>
      internal.exhaustMapEffect(fx, f).addTrace(trace),
)

export const exhaust: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A> =
  methodWithTrace(
    (trace) =>
      <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) =>
        internal.exhaust<R, E, R2, E2, A>(fx).addTrace(trace),
  )

export const exhaustEffect: <R, E, R2, E2, A>(
  fx: Fx<R, E, Effect.Effect<R2, E2, A>>,
) => Fx<R | R2, E | E2, A> = methodWithTrace(
  (trace) =>
    <R, E, R2, E2, A>(fx: Fx<R, E, Effect.Effect<R2, E2, A>>) =>
      internal.exhaustEffect<R, E, R2, E2, A>(fx).addTrace(trace),
)

export const exhaustMapLatest: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>) =>
      internal.exhaustMapLatest(fx, f).addTrace(trace),
)

export const exhaustMapLatestEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E | E2,
    B
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>) =>
      internal.exhaustMapLatestEffect(fx, f).addTrace(trace),
)

export const exhaustLatest: <R, E, R2, E2, A>(
  fx: Fx<R, E, Fx<R2, E2, A>>,
) => Fx<R | R2, E | E2, A> = methodWithTrace(
  (trace) =>
    <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) =>
      internal.exhaustLatest<R, E, R2, E2, A>(fx).addTrace(trace),
)

export const exhaustLatestEffect: <R, E, R2, E2, A>(
  fx: Fx<R, E, Effect.Effect<R2, E2, A>>,
) => Fx<R | R2, E | E2, A> = methodWithTrace(
  (trace) =>
    <R, E, R2, E2, A>(fx: Fx<R, E, Effect.Effect<R2, E2, A>>) =>
      internal.exhaustLatestEffect<R, E, R2, E2, A>(fx).addTrace(trace),
)

export const exhaustMapCause: {
  <E, R2, E2, B>(f: (e: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<
    R | R2,
    E2,
    A | B
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: Cause.Cause<E>) => Fx<R2, E2, B>) =>
      internal.exhaustMapCause(fx, f).addTrace(trace),
)

export const exhaustMapCauseEffect: {
  <E, R2, E2, B>(f: (e: Cause.Cause<E>) => Effect.Effect<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: Cause.Cause<E>) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E2,
    A | B
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: Cause.Cause<E>) => Effect.Effect<R2, E2, B>) =>
      internal.exhaustMapCauseEffect(fx, f).addTrace(trace),
)

export const exhaustMapError: {
  <E, R2, E2, B>(f: (e: E) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Fx<R2, E2, B>) =>
      internal.exhaustMapError(fx, f).addTrace(trace),
)

export const exhaustMapErrorEffect: {
  <E, R2, E2, B>(f: (e: E) => Effect.Effect<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E2,
    A | B
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Effect.Effect<R2, E2, B>) =>
      internal.exhaustMapErrorEffect(fx, f).addTrace(trace),
)

export const exhaustMapLatestCause: {
  <E, R2, E2, B>(f: (e: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<
    R | R2,
    E2,
    A | B
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: Cause.Cause<E>) => Fx<R2, E2, B>) =>
      internal.exhaustMapLatestCause(fx, f).addTrace(trace),
)

export const exhaustMapLatestCauseEffect: {
  <E, R2, E2, B>(f: (e: Cause.Cause<E>) => Effect.Effect<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: Cause.Cause<E>) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E2,
    A | B
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: Cause.Cause<E>) => Effect.Effect<R2, E2, B>) =>
      internal.exhaustMapLatestCauseEffect(fx, f).addTrace(trace),
)

export const exhaustMapLatestError: {
  <E, R2, E2, B>(f: (e: E) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Fx<R2, E2, B>) =>
      internal.exhaustMapLatestError(fx, f).addTrace(trace),
)

export const exhaustMapLatestErrorEffect: {
  <E, R2, E2, B>(f: (e: E) => Effect.Effect<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E2,
    A | B
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Effect.Effect<R2, E2, B>) =>
      internal.exhaustMapLatestErrorEffect(fx, f).addTrace(trace),
)

export const failCause: <E>(cause: Cause.Cause<E>) => Fx<never, E, never> = methodWithTrace(
  (trace) =>
    <E>(cause: Cause.Cause<E>): Fx<never, E, never> =>
      internal.failCause(cause).addTrace(trace),
)

export const fail: <E>(e: E) => Fx<never, E, never> = methodWithTrace(
  (trace) =>
    <E>(e: E): Fx<never, E, never> =>
      internal.fail(e).addTrace(trace),
)

export const interrupt: (id: FiberId) => Fx<never, never, never> = methodWithTrace(
  (trace) =>
    (id: FiberId): Fx<never, never, never> =>
      internal.interrupt(id).addTrace(trace),
)

export const filter: {
  <A, B extends A>(refinement: Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <A>(predicate: Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>

  <R, E, A, B extends A>(fx: Fx<R, E, A>, refinement: Refinement<A, B>): Fx<R, E, B>
  <R, E, A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, B extends A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A | B> =>
      internal.filter(fx, predicate).addTrace(trace),
)

export const filterMap: {
  <A, B>(f: (a: A) => Option.Option<B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => Option.Option<B>): Fx<R, E, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => Option.Option<B>): Fx<R, E, B> =>
      internal.filterMap(fx, f).addTrace(trace),
)

export const compact: <R, E, A>(fx: Fx<R, E, Option.Option<A>>) => Fx<R, E, A> = methodWithTrace(
  (trace) =>
    <R, E, A>(fx: Fx<R, E, Option.Option<A>>): Fx<R, E, A> =>
      internal.compact(fx).addTrace(trace),
)

export const flatMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B> =>
      internal.flatMap(fx, f).addTrace(trace),
)

export const flatMapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E | E2,
    B
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(
      fx: Fx<R, E, A>,
      f: (a: A) => Effect.Effect<R2, E2, B>,
    ): Fx<R | R2, E | E2, B> =>
      internal.flatMapEffect(fx, f).addTrace(trace),
)

export const flatten: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A> =
  methodWithTrace(
    (trace) =>
      <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>): Fx<R | R2, E | E2, A> =>
        internal.flatten<R, E, R2, E2, A>(fx).addTrace(trace),
  )

export const flattenEffect: <R, E, R2, E2, A>(
  fx: Fx<R, E, Effect.Effect<R2, E2, A>>,
) => Fx<R | R2, E | E2, A> = methodWithTrace(
  (trace) =>
    <R, E, R2, E2, A>(fx: Fx<R, E, Effect.Effect<R2, E2, A>>): Fx<R | R2, E | E2, A> =>
      internal.flattenEffect(fx).addTrace(trace),
)

export const fromArray: <A>(as: ReadonlyArray<A>) => Fx<never, never, A> = methodWithTrace(
  (trace) =>
    <A>(as: ReadonlyArray<A>): Fx<never, never, A> =>
      internal.fromArray(as).addTrace(trace),
)

export const fromEffect: <R, E, A>(effect: Effect.Effect<R, E, A>) => Fx<R, E, A> = methodWithTrace(
  (trace) =>
    <R, E, A>(effect: Effect.Effect<R, E, A>): Fx<R, E, A> =>
      internal.fromEffect(effect).addTrace(trace),
)

export interface Emitter<E, A> extends internal.Emitter<E, A> {}

export const fromEmitter: <E, A, R, E2>(
  f: (emitter: internal.Emitter<E, A>) => Effect.Effect<R | Scope.Scope, E2, void>,
) => internal.Fx<Exclude<R, Scope.Scope>, E | E2, A> = methodWithTrace(
  (trace) => (f) => internal.fromEmitter(f).addTrace(trace),
)

export const fromIterable: <A>(as: Iterable<A>) => Fx<never, never, A> = methodWithTrace(
  (trace) =>
    <A>(as: Iterable<A>): Fx<never, never, A> =>
      internal.fromIterable(as).addTrace(trace),
)

export const fromFxEffect: <R, E, R2, E2, A>(
  effect: Effect.Effect<R, E, Fx<R2, E2, A>>,
) => Fx<R | R2, E | E2, A> = methodWithTrace(
  (trace) =>
    <R, E, R2, E2, A>(effect: Effect.Effect<R, E, Fx<R2, E2, A>>): Fx<R | R2, E | E2, A> =>
      internal.fromFxEffect(effect).addTrace(trace),
)

export type EffectGenResources<T> = internal.EffectGenResources<T>

export type EffectGenErrors<T> = internal.EffectGenErrors<T>

export type EffectGenOutput<T> = internal.EffectGenOutput<T>

export const gen: <Y extends Effect.EffectGen<any, any, any>, R, E, A>(
  f: (adaper: Effect.Adapter) => Generator<Y, Fx<R, E, A>, unknown>,
) => Fx<R | internal.EffectGenResources<Y>, E | internal.EffectGenErrors<Y>, A> = methodWithTrace(
  (trace) => (f) => internal.gen(f).addTrace(trace),
)

export const hold: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = methodWithTrace(
  (trace) =>
    <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> =>
      internal.hold(fx).addTrace(trace),
)

export const map: {
  <A, B>(f: (a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B> =>
      internal.map(fx, f).addTrace(trace),
)

export const as: {
  <B>(value: B): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, B> =>
      internal.as(fx, value).addTrace(trace),
)

export const mergeAll: <FXS extends ReadonlyArray<Fx<any, any, any>>>(
  ...fxs: FXS
) => Fx<
  internal.Fx.ResourcesOf<FXS[number]>,
  internal.Fx.ErrorsOf<FXS[number]>,
  internal.Fx.OutputOf<FXS[number]>
> = methodWithTrace(
  (trace) =>
    (...fxs) =>
      internal.mergeAll(...fxs).addTrace(trace),
)

export const merge: {
  <R2, E2, B>(other: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, other: Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
} = dualWithTrace(2, (trace) => (fx, other) => internal.merge(fx, other).addTrace(trace))

export const mergeFirst: {
  <R2, E2, B>(other: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, other: Fx<R2, E2, B>): Fx<R | R2, E | E2, A>
} = dualWithTrace(2, (trace) => (fx, other) => internal.mergeFirst(fx, other).addTrace(trace))

export const multicast: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = methodWithTrace(
  (trace) =>
    <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> =>
      internal.multicast(fx).addTrace(trace),
)

export const never: <E = never, A = never>(_: void) => Fx<never, E, A> = methodWithTrace(
  (trace) => () => internal.never().addTrace(trace),
)

export const observe: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(
    fx: Fx<R, E, A>,
  ) => Effect.Effect<Scope.Scope | R | R2, E | E2, void>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Effect.Effect<
    Scope.Scope | R | R2,
    E | E2,
    void
  >
} = dualWithTrace(2, (trace) => (fx, f) => internal.observe(fx, f).traced(trace))

export const drain: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R | Scope.Scope, E, void> =
  methodWithTrace((trace) => (fx) => internal.drain(fx).traced(trace))

export const onInterrupt: {
  <R2, E2, B>(f: (interruptors: HashSet<FiberId>) => Effect.Effect<R2, E2, B>): <R, E, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, A>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (interruptors: HashSet<FiberId>) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, A>
} = dualWithTrace(2, (trace) => (fx, f) => internal.onInterrupt(fx, f).addTrace(trace))

export const promise: <A>(f: () => Promise<A>) => Fx<never, never, A> = methodWithTrace(
  (trace) => (f) => internal.promise(f).addTrace(trace),
)

export const promiseInterrupt: <A>(f: (signal: AbortSignal) => Promise<A>) => Fx<never, never, A> =
  methodWithTrace((trace) => (f) => internal.promiseInterrupt(f).addTrace(trace))

export const tryPromise: <A>(f: () => Promise<A>) => Fx<never, unknown, A> = methodWithTrace(
  (trace) => (f) => internal.tryPromise(f).addTrace(trace),
)

export const tryPromiseInterrupt: <A>(
  f: (signal: AbortSignal) => Promise<A>,
) => Fx<never, unknown, A> = methodWithTrace(
  (trace) => (f) => internal.tryPromiseInterrupt(f).addTrace(trace),
)

export const tryCatchPromise: <A, E>(
  f: () => Promise<A>,
  g: (error: unknown) => E,
) => Fx<never, E, A> = methodWithTrace(
  (trace) => (f, g) => internal.tryCatchPromise(f, g).addTrace(trace),
)

export const tryCatchPromiseInterrupt: <A, E>(
  f: (signal: AbortSignal) => Promise<A>,
  g: (error: unknown) => E,
) => Fx<never, E, A> = methodWithTrace(
  (trace) => (f, g) => internal.tryCatchPromiseInterrupt(f, g).addTrace(trace),
)

export const promiseFx: <R, E, A>(f: () => Promise<Fx<R, E, A>>) => Fx<R, E, A> = methodWithTrace(
  (trace) => (f) => internal.promiseFx(f).addTrace(trace),
)

export const promiseInterrupFx: <R, E, A>(
  f: (signal: AbortSignal) => Promise<Fx<R, E, A>>,
) => Fx<R, E, A> = methodWithTrace((trace) => (f) => internal.promiseInterruptFx(f).addTrace(trace))

export const tryPromiseFx: <R, E, A>(f: () => Promise<Fx<R, E, A>>) => Fx<R, unknown, A> =
  methodWithTrace((trace) => (f) => internal.tryPromiseFx(f).addTrace(trace))

export const tryPromiseInterruptFx: <R, E, A>(
  f: (signal: AbortSignal) => Promise<Fx<R, E, A>>,
) => Fx<R, unknown, A> = methodWithTrace(
  (trace) => (f) => internal.tryPromiseInterruptFx(f).addTrace(trace),
)

export const tryCatchPromiseFx: <R, E, A, E2>(
  f: () => Promise<Fx<R, E, A>>,
  g: (error: unknown) => E2,
) => Fx<R, E | E2, A> = methodWithTrace(
  (trace) => (f, g) => internal.tryCatchPromiseFx(f, g).addTrace(trace),
)

export const tryCatchPromiseInterruptFx: <R, E, A, E2>(
  f: (signal: AbortSignal) => Promise<Fx<R, E, A>>,
  g: (error: unknown) => E2,
) => Fx<R, E | E2, A> = methodWithTrace(
  (trace) => (f, g) => internal.tryCatchPromiseInterruptFx(f, g).addTrace(trace),
)

export const provideContext: {
  <R>(context: Context.Context<R>): <E, A>(fx: Fx<R, E, A>) => Fx<never, E, A>

  <R, E, A>(fx: Fx<R, E, A>, context: Context.Context<R>): Fx<never, E, A>
} = dualWithTrace(
  2,
  (trace) => (fx, context) => internal.provideContext(fx, context).addTrace(trace),
)

export const provideSomeContext: {
  <S>(context: Context.Context<S>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, S>, E, A>

  <R, E, A, S>(fx: Fx<R, E, A>, context: Context.Context<S>): Fx<Exclude<R, S>, E, A>
} = dualWithTrace(
  2,
  (trace) => (fx, context) => internal.provideSomeContext(fx, context).addTrace(trace),
)

export const provideLayer: {
  <R2, E2, R>(layer: Layer.Layer<R2, E2, R>): <E, A>(fx: Fx<R, E, A>) => Fx<R2, E | E2, A>

  <R, E, A, R2, E2>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, R>): Fx<R2, E | E2, A>
} = dualWithTrace(2, (trace) => (fx, layer) => internal.provideLayer(fx, layer).addTrace(trace))

export const provideSomeLayer: {
  <R2, E2, S>(layer: Layer.Layer<R2, E2, S>): <R, E, A>(
    fx: Fx<R, E, A>,
  ) => Fx<Exclude<R, S> | R2, E | E2, A>

  <R, E, A, R2, E2, S>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, S>): Fx<
    Exclude<R, S> | R2,
    E | E2,
    A
  >
} = dualWithTrace(2, (trace) => (fx, layer) => internal.provideSomeLayer(fx, layer).addTrace(trace))

export const provideService: {
  <I, S>(tag: Context.Tag<I, S>, service: S): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, I>, E, A>

  <R, E, A, I, S>(fx: Fx<R, E, A>, tag: Context.Tag<I, S>, service: S): Fx<Exclude<R, I>, E, A>
} = dualWithTrace(
  3,
  (trace) => (fx, tag, service) => internal.provideService(fx, tag, service).addTrace(trace),
)

export const provideServiceEffect: {
  <I, S, R2, E2>(tag: Context.Tag<I, S>, service: Effect.Effect<R2, E2, S>): <R, E, A>(
    fx: Fx<R, E, A>,
  ) => Fx<Exclude<R, I> | R2, E | E2, A>

  <R, E, A, I, S, R2, E2>(
    fx: Fx<R, E, A>,
    tag: Context.Tag<I, S>,
    service: Effect.Effect<R2, E2, S>,
  ): Fx<Exclude<R, I> | R2, E | E2, A>
} = dualWithTrace(
  3,
  (trace) => (fx, tag, service) => internal.provideServiceEffect(fx, tag, service).addTrace(trace),
)

export const provideServiceFx: {
  <I, S, R2, E2>(tag: Context.Tag<I, S>, service: Fx<R2, E2, S>): <R, E, A>(
    fx: Fx<R, E, A>,
  ) => Fx<Exclude<R, I> | R2, E | E2, A>

  <R, E, A, I, S, R2, E2>(fx: Fx<R, E, A>, tag: Context.Tag<I, S>, service: Fx<R2, E2, S>): Fx<
    Exclude<R, I> | R2,
    E | E2,
    A
  >
} = dualWithTrace(
  3,
  (trace) => (fx, tag, service) => internal.provideServiceFx(fx, tag, service).addTrace(trace),
)

export const reduce: {
  <B, A>(seed: B, f: (b: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, B>

  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (b: B, a: A) => B): Effect.Effect<R, E, B>
} = dualWithTrace(3, (trace) => (fx, seed, f) => internal.reduce(fx, seed, f).traced(trace))

export const scan: {
  <B, A>(seed: B, f: (b: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (b: B, a: A) => B): Fx<R, E, B>
} = dualWithTrace(3, (trace) => (fx, seed, f) => internal.scan(fx, seed, f).addTrace(trace))

export const skipRepeatsWith: {
  <A>(eq: Equivalence<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, eq: Equivalence<A>): Fx<R, E, A>
} = dualWithTrace(2, (trace) => (fx, eq) => internal.skipRepeatsWith(fx, eq).addTrace(trace))

export const skipRepeats: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = methodWithTrace(
  (trace) => (fx) => internal.skipRepeats(fx).addTrace(trace),
)

export const skipWhile: {
  <A>(predicate: Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) => (fx, predicate) => internal.skipWhile(fx, predicate).addTrace(trace),
)

export const skipUntil: {
  <A>(predicate: Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) => (fx, predicate) => internal.skipUntil(fx, predicate).addTrace(trace),
)

export const slice: {
  (skip: number, take: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, skip: number, take: number): Fx<R, E, A>
} = dualWithTrace(3, (trace) => (fx, skip, take) => internal.slice(fx, skip, take).addTrace(trace))

export const skip: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
} = dualWithTrace(2, (trace) => (fx, n) => internal.skip(fx, n).addTrace(trace))

export const take: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
} = dualWithTrace(2, (trace) => (fx, n) => internal.take(fx, n).addTrace(trace))

export const scoped: <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, Scope.Scope>, E, A> =
  methodWithTrace((trace) => (fx) => internal.scoped(fx).addTrace(trace))

export const snapshotEffect: {
  <R2, E2, B, R3, E3, A, C>(sampled: Fx<R2, E2, B>, f: (a: A, b: B) => Effect.Effect<R3, E3, C>): <
    R,
    E,
  >(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2 | R3, E | E2 | E3, C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    sampled: Fx<R2, E2, B>,
    f: (a: A, b: B) => Effect.Effect<R3, E3, C>,
  ): Fx<R | R2 | R3, E | E2 | E3, C>
} = dualWithTrace(
  3,
  (trace) => (fx, sampled, f) => internal.snapshotEffect(fx, sampled, f).addTrace(trace),
)

export const snapshot: {
  <R2, E2, B, A, C>(sampled: Fx<R2, E2, B>, f: (a: A, b: B) => C): <R, E>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, C>

  <R, E, A, R2, E2, B, C>(fx: Fx<R, E, A>, sampled: Fx<R2, E2, B>, f: (a: A, b: B) => C): Fx<
    R | R2,
    E | E2,
    C
  >
} = dualWithTrace(
  3,
  (trace) => (fx, sampled, f) => internal.snapshot(fx, sampled, f).addTrace(trace),
)

export const succeed: <A>(a: A) => Fx<never, never, A> = methodWithTrace(
  (trace) => (a) => internal.succeed(a).addTrace(trace),
)

export const suspend: <R, E, A>(fx: () => Fx<R, E, A>) => Fx<R, E, A> = methodWithTrace(
  (trace) => (fx) => internal.suspend(fx).addTrace(trace),
)

export const switchMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B> =>
      internal.switchMap(fx, f).addTrace(trace),
)

export const switchMapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E | E2,
    B
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(
      fx: Fx<R, E, A>,
      f: (a: A) => Effect.Effect<R2, E2, B>,
    ): Fx<R | R2, E | E2, B> =>
      internal.switchMapEffect(fx, f).addTrace(trace),
)

export const switchLatest: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A> =
  methodWithTrace(
    (trace) =>
      <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>): Fx<R | R2, E | E2, A> =>
        internal.switchLatest<R, E, R2, E2, A>(fx).addTrace(trace),
  )

export const switchLatestEffect: <R, E, R2, E2, A>(
  fx: Fx<R, E, Effect.Effect<R2, E2, A>>,
) => Fx<R | R2, E | E2, A> = methodWithTrace(
  (trace) =>
    <R, E, R2, E2, A>(fx: Fx<R, E, Effect.Effect<R2, E2, A>>): Fx<R | R2, E | E2, A> =>
      internal.switchLatestEffect(fx).addTrace(trace),
)

export const switchMatchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>,
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>,
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dualWithTrace(
  3,
  (trace) =>
    <R, E, A, R2, E2, B, R3, E3, C>(
      fx: Fx<R, E, A>,
      f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
      g: (a: A) => Fx<R3, E3, C>,
    ): Fx<R | R2 | R3, E2 | E3, B | C> =>
      internal.switchMatchCause(fx, f, g).addTrace(trace),
)

export const switchMatchCauseEffect: {
  <E, R2, E2, B, A, R3, E3, C>(
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
    g: (a: A) => Effect.Effect<R3, E3, C>,
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
    g: (a: A) => Effect.Effect<R3, E3, C>,
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dualWithTrace(
  3,
  (trace) =>
    <R, E, A, R2, E2, B, R3, E3, C>(
      fx: Fx<R, E, A>,
      f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
      g: (a: A) => Effect.Effect<R3, E3, C>,
    ): Fx<R | R2 | R3, E2 | E3, B | C> =>
      internal.switchMatchCauseEffect(fx, f, g).addTrace(trace),
)

export const switchMatch: {
  <E, R2, E2, B, A, R3, E3, C>(f: (error: E) => Fx<R2, E2, B>, g: (a: A) => Fx<R3, E3, C>): <R>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (error: E) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>,
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dualWithTrace(
  3,
  (trace) =>
    <R, E, A, R2, E2, B, R3, E3, C>(
      fx: Fx<R, E, A>,
      f: (error: E) => Fx<R2, E2, B>,
      g: (a: A) => Fx<R3, E3, C>,
    ): Fx<R | R2 | R3, E2 | E3, B | C> =>
      internal.switchMatch(fx, f, g).addTrace(trace),
)

export const switchMatchEffect: {
  <E, R2, E2, B, A, R3, E3, C>(
    f: (error: E) => Effect.Effect<R2, E2, B>,
    g: (a: A) => Effect.Effect<R3, E3, C>,
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (error: E) => Effect.Effect<R2, E2, B>,
    g: (a: A) => Effect.Effect<R3, E3, C>,
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dualWithTrace(3, (trace) => (fx, f, g) => internal.switchMatchEffect(fx, f, g).addTrace(trace))

export const switchMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E2, B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<
    R | R2,
    E2,
    B
  >
} = dualWithTrace(2, (trace) => (fx, f) => internal.switchMapCause(fx, f).addTrace(trace))

export const switchMapCauseEffect: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E2, B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E2,
    B
  >
} = dualWithTrace(2, (trace) => (fx, f) => internal.switchMapCauseEffect(fx, f).addTrace(trace))

export const switchMapError: {
  <E, R2, E2, B>(f: (error: E) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (error: E) => Fx<R2, E2, B>): Fx<R | R2, E2, B>
} = dualWithTrace(2, (trace) => (fx, f) => internal.switchMapError(fx, f).addTrace(trace))

export const switchMapErrorEffect: {
  <E, R2, E2, B>(f: (error: E) => Effect.Effect<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E2, B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (error: E) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E2,
    B
  >
} = dualWithTrace(2, (trace) => (fx, f) => internal.switchMapErrorEffect(fx, f).addTrace(trace))

export const takeWhile: {
  <A>(predicate: Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) => (fx, predicate) => internal.takeWhile(fx, predicate).addTrace(trace),
)

export const takeUntil: {
  <A>(predicate: Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) => (fx, predicate) => internal.takeUntil(fx, predicate).addTrace(trace),
)

export const tap: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, A>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E | E2,
    A
  >
} = dualWithTrace(2, (trace) => (fx, f) => internal.tap(fx, f).addTrace(trace))

export const tapSync: {
  <A, B>(f: (a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, A>
} = dualWithTrace(2, (trace) => (fx, f) => internal.tapSync(fx, f).addTrace(trace))

export const tapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, A>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E | E2,
    A
  >
} = dualWithTrace(2, (trace) => (fx, f) => internal.tapCause(fx, f).addTrace(trace))

export const tapCauseSync: {
  <E, B>(f: (cause: Cause.Cause<E>) => B): <R, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => B): Fx<R, E, A>
} = dualWithTrace(2, (trace) => (fx, f) => internal.tapCauseSync(fx, f).addTrace(trace))

export const tapError: {
  <E, R2, E2, B>(f: (error: E) => Effect.Effect<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, A>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (error: E) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E | E2,
    A
  >
} = dualWithTrace(2, (trace) => (fx, f) => internal.tapError(fx, f).addTrace(trace))

export const tapErrorSync: {
  <E, B>(f: (error: E) => B): <R, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (error: E) => B): Fx<R, E, A>
} = dualWithTrace(2, (trace) => (fx, f) => internal.tapErrorSync(fx, f).addTrace(trace))

export const throttle: {
  (delay: Duration): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: Duration): Fx<R, E, A>
} = dualWithTrace(2, (trace) => (fx, delay) => internal.throttle(fx, delay).addTrace(trace))

export const toArray: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R | Scope.Scope, E, Array<A>> =
  methodWithTrace((trace) => (fx) => internal.toArray(fx).traced(trace))

export const toChunk: <R, E, A>(
  fx: Fx<R, E, A>,
) => Effect.Effect<R | Scope.Scope, E, Chunk.Chunk<A>> = methodWithTrace(
  (trace) => (fx) => internal.toChunk(fx).traced(trace),
)

export const toReadonlyArray: <R, E, A>(
  fx: Fx<R, E, A>,
) => Effect.Effect<R | Scope.Scope, E, ReadonlyArray<A>> = methodWithTrace(
  (trace) => (fx) => internal.toReadonlyArray(fx).traced(trace),
)

export const keyed: {
  <A, R2, E2, B>(
    f: (value: Fx<never, never, A>, initial: A) => Fx<R2, E2, B>,
    eq?: Equivalence<A>,
  ): <R, E>(fx: Fx<R, E, readonly A[]>) => Fx<R2, E2, readonly B[]>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, readonly A[]>,
    f: (value: Fx<never, never, A>, initial: A) => Fx<R2, E2, B>,
    eq?: Equivalence<A>,
  ): Fx<R | R2, E | E2, readonly B[]>
} = dualWithTrace(
  (args) => internal.isFx(args[0]),
  (trace) =>
    <R, E, A, R2, E2, B>(
      fx: Fx<R, E, readonly A[]>,
      f: (value: Fx<never, never, A>) => Fx<R2, E2, B>,
      eq?: Equivalence<A>,
    ): Fx<R | R2, E | E2, readonly B[]> =>
      internal.keyed(fx, f, eq).addTrace(trace),
)

export * from './RefSubject.js'
export * from './Subject.js'
