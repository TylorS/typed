import * as Chunk from '@effect/data/Chunk'
import * as Context from '@effect/data/Context'
import type { Duration } from '@effect/data/Duration'
import type { Equivalence } from '@effect/data/Equivalence'
import { dual } from '@effect/data/Function'
import type { HashSet } from '@effect/data/HashSet'
import * as Option from '@effect/data/Option'
import type { Predicate, Refinement } from '@effect/data/Predicate'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import * as Fiber from '@effect/io/Fiber'
import type { FiberId } from '@effect/io/Fiber/Id'
import * as Hub from '@effect/io/Hub'
import * as Layer from '@effect/io/Layer'
import * as Queue from '@effect/io/Queue'
import * as Scope from '@effect/io/Scope'

import type { Fx } from './Fx.js'
import * as internal from './data-first.js'
export * from './Fx.js'

export const at: {
  (delay: Duration): <A>(value: A) => Fx<never, never, A>
  <A>(value: A, delay: Duration): Fx<never, never, A>
} = dual(
  2,

  <A>(value: A, delay: Duration): Fx<never, never, A> => internal.at(value, delay),
)

export const catchAllCause: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, R2, E2, B>(fx: Fx<R, E, B>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, B>
} = dual(
  2,

  <R, E, R2, E2, B>(
    fx: Fx<R, E, B>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  ): Fx<R | R2, E2, B> => internal.catchAllCause(fx, f),
)

export const catchAllCauseEffect: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, R2, E2, B>(
    fx: Fx<R, E, B>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E2, B>
} = dual(
  2,

  <R, E, R2, E2, B>(
    fx: Fx<R, E, B>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E2, B> => internal.catchAllCauseEffect(fx, f),
)

export const catchAll: {
  <E, R2, E2, B>(f: (e: E) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B> =>
    internal.catchAll(fx, f),
)

export const catchAllDefect: {
  <R2, E2, B>(
    f: (e: unknown) => Fx<R2, E2, B>,
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: unknown) => Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: unknown) => Fx<R2, E2, B>,
  ): Fx<R | R2, E | E2, A | B> => internal.catchAllDefect(fx, f),
)

export const catchAllEffect: {
  <E, R2, E2, B>(
    f: (e: E) => Effect.Effect<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: E) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E2, A | B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: E) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E2, A | B> => internal.catchAllEffect(fx, f),
)

export const combineAll: <FX extends readonly internal.Fx<any, any, any>[]>(
  ...fx: FX
) => internal.Fx<
  internal.Fx.ResourcesOf<FX[number]>,
  internal.Fx.ErrorsOf<FX[number]>,
  { [k in keyof FX]: internal.Fx.OutputOf<FX[k]> }
> = (...fx) => internal.combineAll(...fx)

export const combine: {
  <R2, E2, B>(
    other: Fx<R2, E2, B>,
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, readonly [A, B]>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, other: Fx<R2, E2, B>): Fx<R | R2, E | E2, readonly [A, B]>
} = dual(2, (fx, other) => internal.combine(fx, other))

export const combineAllDiscard: <FX extends readonly internal.Fx<any, any, any>[]>(
  ...fx: FX
) => internal.Fx<internal.Fx.ResourcesOf<FX[number]>, internal.Fx.ErrorsOf<FX[number]>, void> = (
  ...fx
) => internal.combineAllDiscard(...fx)

export const continueWith: {
  <R2, E2, B>(f: () => Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B> =>
    internal.continueWith(fx, f),
)

export const continueWithEffect: {
  <R2, E2, B>(
    f: () => Effect.Effect<R2, E2, B>,
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: () => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, A | B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: () => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, A | B> => internal.continueWithEffect(fx, f),
)

export const startWith: {
  <B>(value: B): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A | B>
  <R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, A | B>
} = dual(2, (fx, value) => internal.startWith(fx, value))

export const debounce: {
  (duration: Duration): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, duration: Duration): Fx<R, E, A>
} = dual(2, (fx, duration) => internal.debounce(fx, duration))

export const delay: {
  (duration: Duration): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, duration: Duration): Fx<R, E, A>
} = dual(2, (fx, duration) => internal.delay(fx, duration))

export const empty: <E = never, A = never>(_: void) => Fx<never, E, A> = internal.empty

export const exhaustMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>) => internal.exhaustMap(fx, f),
)

export const exhaustMapEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>) =>
    internal.exhaustMapEffect(fx, f),
)

export const exhaust: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A> = <
  R,
  E,
  R2,
  E2,
  A,
>(
  fx: Fx<R, E, Fx<R2, E2, A>>,
) => internal.exhaust<R, E, R2, E2, A>(fx)

export const exhaustEffect: <R, E, R2, E2, A>(
  fx: Fx<R, E, Effect.Effect<R2, E2, A>>,
) => Fx<R | R2, E | E2, A> = <R, E, R2, E2, A>(fx: Fx<R, E, Effect.Effect<R2, E2, A>>) =>
  internal.exhaustEffect<R, E, R2, E2, A>(fx)

export const exhaustMapLatest: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>) =>
    internal.exhaustMapLatest(fx, f),
)

export const exhaustMapLatestEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>) =>
    internal.exhaustMapLatestEffect(fx, f),
)

export const exhaustLatest: <R, E, R2, E2, A>(
  fx: Fx<R, E, Fx<R2, E2, A>>,
) => Fx<R | R2, E | E2, A> = <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) =>
  internal.exhaustLatest<R, E, R2, E2, A>(fx)

export const exhaustLatestEffect: <R, E, R2, E2, A>(
  fx: Fx<R, E, Effect.Effect<R2, E2, A>>,
) => Fx<R | R2, E | E2, A> = <R, E, R2, E2, A>(fx: Fx<R, E, Effect.Effect<R2, E2, A>>) =>
  internal.exhaustLatestEffect<R, E, R2, E2, A>(fx)

export const exhaustMapCause: {
  <E, R2, E2, B>(
    f: (e: Cause.Cause<E>) => Fx<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: Cause.Cause<E>) => Fx<R2, E2, B>,
  ): Fx<R | R2, E2, A | B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: Cause.Cause<E>) => Fx<R2, E2, B>) =>
    internal.exhaustMapCause(fx, f),
)

export const exhaustMapCauseEffect: {
  <E, R2, E2, B>(
    f: (e: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E2, A | B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: Cause.Cause<E>) => Effect.Effect<R2, E2, B>) =>
    internal.exhaustMapCauseEffect(fx, f),
)

export const exhaustMapError: {
  <E, R2, E2, B>(f: (e: E) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Fx<R2, E2, B>) =>
    internal.exhaustMapError(fx, f),
)

export const exhaustMapErrorEffect: {
  <E, R2, E2, B>(
    f: (e: E) => Effect.Effect<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: E) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E2, A | B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Effect.Effect<R2, E2, B>) =>
    internal.exhaustMapErrorEffect(fx, f),
)

export const exhaustMapLatestCause: {
  <E, R2, E2, B>(
    f: (e: Cause.Cause<E>) => Fx<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: Cause.Cause<E>) => Fx<R2, E2, B>,
  ): Fx<R | R2, E2, A | B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: Cause.Cause<E>) => Fx<R2, E2, B>) =>
    internal.exhaustMapLatestCause(fx, f),
)

export const exhaustMapLatestCauseEffect: {
  <E, R2, E2, B>(
    f: (e: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E2, A | B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: Cause.Cause<E>) => Effect.Effect<R2, E2, B>) =>
    internal.exhaustMapLatestCauseEffect(fx, f),
)

export const exhaustMapLatestError: {
  <E, R2, E2, B>(f: (e: E) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Fx<R2, E2, B>) =>
    internal.exhaustMapLatestError(fx, f),
)

export const exhaustMapLatestErrorEffect: {
  <E, R2, E2, B>(
    f: (e: E) => Effect.Effect<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: E) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E2, A | B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Effect.Effect<R2, E2, B>) =>
    internal.exhaustMapLatestErrorEffect(fx, f),
)

export const failCause: <E>(cause: Cause.Cause<E>) => Fx<never, E, never> = <E>(
  cause: Cause.Cause<E>,
): Fx<never, E, never> => internal.failCause(cause)

export const fail: <E>(e: E) => Fx<never, E, never> = <E>(e: E): Fx<never, E, never> =>
  internal.fail(e)

export const interrupt: (id: FiberId) => Fx<never, never, never> = (
  id: FiberId,
): Fx<never, never, never> => internal.interrupt(id)

export const die: (defect: unknown) => Fx<never, never, never> = (
  defect: unknown,
): Fx<never, never, never> => internal.die(defect)

export const filter: {
  <A, B extends A>(refinement: Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <A>(predicate: Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>

  <R, E, A, B extends A>(fx: Fx<R, E, A>, refinement: Refinement<A, B>): Fx<R, E, B>
  <R, E, A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A>
} = dual(
  2,

  <R, E, A, B extends A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A | B> =>
    internal.filter(fx, predicate),
)

export const filterMap: {
  <A, B>(f: (a: A) => Option.Option<B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => Option.Option<B>): Fx<R, E, B>
} = dual(
  2,

  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => Option.Option<B>): Fx<R, E, B> =>
    internal.filterMap(fx, f),
)

export const compact: <R, E, A>(fx: Fx<R, E, Option.Option<A>>) => Fx<R, E, A> = <R, E, A>(
  fx: Fx<R, E, Option.Option<A>>,
): Fx<R, E, A> => internal.compact(fx)

export const flatMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B> =>
    internal.flatMap(fx, f),
)

export const flatMapEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, B> => internal.flatMapEffect(fx, f),
)

export const mapEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, B>
} = dual(
  2,
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, B> => internal.mapEffect(fx, f),
)

export const flatten: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A> = <
  R,
  E,
  R2,
  E2,
  A,
>(
  fx: Fx<R, E, Fx<R2, E2, A>>,
): Fx<R | R2, E | E2, A> => internal.flatten<R, E, R2, E2, A>(fx)

export const flattenEffect: <R, E, R2, E2, A>(
  fx: Fx<R, E, Effect.Effect<R2, E2, A>>,
) => Fx<R | R2, E | E2, A> = <R, E, R2, E2, A>(
  fx: Fx<R, E, Effect.Effect<R2, E2, A>>,
): Fx<R | R2, E | E2, A> => internal.flattenEffect(fx)

export const fromArray: <A>(as: ReadonlyArray<A>) => Fx<never, never, A> = <A>(
  as: ReadonlyArray<A>,
): Fx<never, never, A> => internal.fromArray(as)

export const fromEffect: <R, E, A>(effect: Effect.Effect<R, E, A>) => Fx<R, E, A> = <R, E, A>(
  effect: Effect.Effect<R, E, A>,
): Fx<R, E, A> => internal.fromEffect(effect)

export interface Emitter<E, A> extends internal.Emitter<E, A> {}

export const fromEmitter: <E, A, R, E2>(
  f: (emitter: internal.Emitter<E, A>) => Effect.Effect<R | Scope.Scope, E2, void>,
) => internal.Fx<Exclude<R, Scope.Scope>, E | E2, A> = (f) => internal.fromEmitter(f)

export const fromIterable: <A>(as: Iterable<A>) => Fx<never, never, A> = <A>(
  as: Iterable<A>,
): Fx<never, never, A> => internal.fromIterable(as)

export const fromFxEffect: <R, E, R2, E2, A>(
  effect: Effect.Effect<R, E, Fx<R2, E2, A>>,
) => Fx<R | R2, E | E2, A> = <R, E, R2, E2, A>(
  effect: Effect.Effect<R, E, Fx<R2, E2, A>>,
): Fx<R | R2, E | E2, A> => internal.fromFxEffect(effect)

export type EffectGenResources<T> = internal.EffectGenResources<T>

export type EffectGenErrors<T> = internal.EffectGenErrors<T>

export type EffectGenOutput<T> = internal.EffectGenOutput<T>

export const gen: <Y extends Effect.EffectGen<any, any, any>, R, E, A>(
  f: (adaper: Effect.Adapter) => Generator<Y, Fx<R, E, A>, unknown>,
) => Fx<R | internal.EffectGenResources<Y>, E | internal.EffectGenErrors<Y>, A> = (f) =>
  internal.gen(f)

export const hold: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = <R, E, A>(
  fx: Fx<R, E, A>,
): Fx<R, E, A> => internal.hold(fx)

export const map: {
  <A, B>(f: (a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B>
} = dual(
  2,

  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B> => internal.map(fx, f),
)

export const as: {
  <B>(value: B): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, B>
} = dual(
  2,

  <R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, B> => internal.as(fx, value),
)

export const mergeAll: <FXS extends ReadonlyArray<Fx<any, any, any>>>(
  ...fxs: FXS
) => Fx<
  internal.Fx.ResourcesOf<FXS[number]>,
  internal.Fx.ErrorsOf<FXS[number]>,
  internal.Fx.OutputOf<FXS[number]>
> = (...fxs) => internal.mergeAll(...fxs)

export const merge: {
  <R2, E2, B>(other: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, other: Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
} = dual(2, (fx, other) => internal.merge(fx, other))

export const mergeFirst: {
  <R2, E2, B>(other: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, other: Fx<R2, E2, B>): Fx<R | R2, E | E2, A>
} = dual(2, (fx, other) => internal.mergeFirst(fx, other))

export const mergeConcurrently: <FXS extends ReadonlyArray<Fx<any, any, any>>>(
  ...fxs: FXS
) => Fx<
  internal.Fx.ResourcesOf<FXS[number]>,
  internal.Fx.ErrorsOf<FXS[number]>,
  internal.Fx.OutputOf<FXS[number]>
> = (...fxs) => internal.mergeConcurrently(...fxs)

export const mergeBufferConcurrently: <FXS extends ReadonlyArray<Fx<any, any, any>>>(
  ...fxs: FXS
) => Fx<
  internal.Fx.ResourcesOf<FXS[number]>,
  internal.Fx.ErrorsOf<FXS[number]>,
  internal.Fx.OutputOf<FXS[number]>
> = (...fxs) => internal.mergeBufferConcurrently(...fxs)

export const multicast: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = <R, E, A>(
  fx: Fx<R, E, A>,
): Fx<R, E, A> => internal.multicast(fx)

export const never: <E = never, A = never>(_: void) => Fx<never, E, A> = internal.never

export const observe: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<Scope.Scope | R | R2, E | E2, void>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): Effect.Effect<Scope.Scope | R | R2, E | E2, void>
} = dual(2, (fx, f) => internal.observe(fx, f))

export const drain: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R | Scope.Scope, E, void> = (fx) =>
  internal.drain(fx)

export const forkScoped: <R, E, A>(
  fx: Fx<R, E, A>,
) => Effect.Effect<R | Scope.Scope, never, Fiber.RuntimeFiber<E, void>> = (fx) =>
  internal.forkScoped(fx)

export const onExit: {
  <E, R2, E2, B>(
    f: (exit: Exit.Exit<E, void>) => Effect.Effect<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (exit: Exit.Exit<E, void>) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, A>
} = dual(2, (fx, f) => internal.onExit(fx, f))

export const onInterrupt: {
  <R2, E2, B>(
    f: (interruptors: HashSet<FiberId>) => Effect.Effect<R2, E2, B>,
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (interruptors: HashSet<FiberId>) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, A>
} = dual(2, (fx, f) => internal.onInterrupt(fx, f))

export const promise: <A>(f: (signal: AbortSignal) => Promise<A>) => Fx<never, never, A> = (f) =>
  internal.promise(f)

export const tryPromise: <A>(f: (signal: AbortSignal) => Promise<A>) => Fx<never, unknown, A> = (
  f,
) => internal.tryPromise(f)

export const tryCatchPromise: <A, E>(
  f: (signal: AbortSignal) => Promise<A>,
  g: (error: unknown) => E,
) => Fx<never, E, A> = (f, g) => internal.tryCatchPromise(f, g)

export const promiseFx: <R, E, A>(f: () => Promise<Fx<R, E, A>>) => Fx<R, E, A> = (f) =>
  internal.promiseFx(f)

export const tryPromiseFx: <R, E, A>(
  f: (signal: AbortSignal) => Promise<Fx<R, E, A>>,
) => Fx<R, unknown, A> = (f) => internal.tryPromiseFx(f)

export const tryCatchPromiseFx: <R, E, A, E2>(
  f: (signal: AbortSignal) => Promise<Fx<R, E, A>>,
  g: (error: unknown) => E2,
) => Fx<R, E | E2, A> = (f, g) => internal.tryCatchPromiseFx(f, g)

export const provideContext: {
  <R>(context: Context.Context<R>): <E, A>(fx: Fx<R, E, A>) => Fx<never, E, A>

  <R, E, A>(fx: Fx<R, E, A>, context: Context.Context<R>): Fx<never, E, A>
} = dual(2, (fx, context) => internal.provideContext(fx, context))

export const provideSomeContext: {
  <S>(context: Context.Context<S>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, S>, E, A>

  <R, E, A, S>(fx: Fx<R, E, A>, context: Context.Context<S>): Fx<Exclude<R, S>, E, A>
} = dual(2, (fx, context) => internal.provideSomeContext(fx, context))

export const provideLayer: {
  <R2, E2, R>(layer: Layer.Layer<R2, E2, R>): <E, A>(fx: Fx<R, E, A>) => Fx<R2, E | E2, A>

  <R, E, A, R2, E2>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, R>): Fx<R2, E | E2, A>
} = dual(2, (fx, layer) => internal.provideLayer(fx, layer))

export const provideSomeLayer: {
  <R2, E2, S>(
    layer: Layer.Layer<R2, E2, S>,
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, S> | R2, E | E2, A>

  <R, E, A, R2, E2, S>(
    fx: Fx<R, E, A>,
    layer: Layer.Layer<R2, E2, S>,
  ): Fx<Exclude<R, S> | R2, E | E2, A>
} = dual(2, (fx, layer) => internal.provideSomeLayer(fx, layer))

export const provideService: {
  <I, S>(tag: Context.Tag<I, S>, service: S): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, I>, E, A>

  <R, E, A, I, S>(fx: Fx<R, E, A>, tag: Context.Tag<I, S>, service: S): Fx<Exclude<R, I>, E, A>
} = dual(3, (fx, tag, service) => internal.provideService(fx, tag, service))

export const provideServiceEffect: {
  <I, S, R2, E2>(
    tag: Context.Tag<I, S>,
    service: Effect.Effect<R2, E2, S>,
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, I> | R2, E | E2, A>

  <R, E, A, I, S, R2, E2>(
    fx: Fx<R, E, A>,
    tag: Context.Tag<I, S>,
    service: Effect.Effect<R2, E2, S>,
  ): Fx<Exclude<R, I> | R2, E | E2, A>
} = dual(3, (fx, tag, service) => internal.provideServiceEffect(fx, tag, service))

export const provideServiceFx: {
  <I, S, R2, E2>(
    tag: Context.Tag<I, S>,
    service: Fx<R2, E2, S>,
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, I> | R2, E | E2, A>

  <R, E, A, I, S, R2, E2>(
    fx: Fx<R, E, A>,
    tag: Context.Tag<I, S>,
    service: Fx<R2, E2, S>,
  ): Fx<Exclude<R, I> | R2, E | E2, A>
} = dual(3, (fx, tag, service) => internal.provideServiceFx(fx, tag, service))

export const reduce: {
  <B, A>(seed: B, f: (b: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, B>

  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (b: B, a: A) => B): Effect.Effect<R, E, B>
} = dual(3, (fx, seed, f) => internal.reduce(fx, seed, f))

export const scan: {
  <B, A>(seed: B, f: (b: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (b: B, a: A) => B): Fx<R, E, B>
} = dual(3, (fx, seed, f) => internal.scan(fx, seed, f))

export const skipRepeatsWith: {
  <A>(eq: Equivalence<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, eq: Equivalence<A>): Fx<R, E, A>
} = dual(2, (fx, eq) => internal.skipRepeatsWith(fx, eq))

export const skipRepeats: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = (fx) =>
  internal.skipRepeats(fx)

export const skipWhile: {
  <A>(predicate: Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A>
} = dual(2, (fx, predicate) => internal.skipWhile(fx, predicate))

export const skipUntil: {
  <A>(predicate: Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A>
} = dual(2, (fx, predicate) => internal.skipUntil(fx, predicate))

export const slice: {
  (skip: number, take: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, skip: number, take: number): Fx<R, E, A>
} = dual(3, (fx, skip, take) => internal.slice(fx, skip, take))

export const skip: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
} = dual(2, (fx, n) => internal.skip(fx, n))

export const take: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
} = dual(2, (fx, n) => internal.take(fx, n))

export const scoped: <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, Scope.Scope>, E, A> = (fx) =>
  internal.scoped(fx)

export const snapshotEffect: {
  <R2, E2, B, R3, E3, A, C>(
    sampled: Fx<R2, E2, B>,
    f: (a: A, b: B) => Effect.Effect<R3, E3, C>,
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E | E2 | E3, C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    sampled: Fx<R2, E2, B>,
    f: (a: A, b: B) => Effect.Effect<R3, E3, C>,
  ): Fx<R | R2 | R3, E | E2 | E3, C>
} = dual(3, (fx, sampled, f) => internal.snapshotEffect(fx, sampled, f))

export const snapshot: {
  <R2, E2, B, A, C>(
    sampled: Fx<R2, E2, B>,
    f: (a: A, b: B) => C,
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, C>

  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, A>,
    sampled: Fx<R2, E2, B>,
    f: (a: A, b: B) => C,
  ): Fx<R | R2, E | E2, C>
} = dual(3, (fx, sampled, f) => internal.snapshot(fx, sampled, f))

export const succeed: <A>(a: A) => Fx<never, never, A> = (a) => internal.succeed(a)

export const suspend: <R, E, A>(fx: () => Fx<R, E, A>) => Fx<R, E, A> = (fx) => internal.suspend(fx)

export const switchMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B> =>
    internal.switchMap(fx, f),
)

export const switchMapEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, B> => internal.switchMapEffect(fx, f),
)

export const switchLatest: <R, E, R2, E2, A>(
  fx: Fx<R, E, Fx<R2, E2, A>>,
) => Fx<R | R2, E | E2, A> = <R, E, R2, E2, A>(
  fx: Fx<R, E, Fx<R2, E2, A>>,
): Fx<R | R2, E | E2, A> => internal.switchLatest<R, E, R2, E2, A>(fx)

export const switchLatestEffect: <R, E, R2, E2, A>(
  fx: Fx<R, E, Effect.Effect<R2, E2, A>>,
) => Fx<R | R2, E | E2, A> = <R, E, R2, E2, A>(
  fx: Fx<R, E, Effect.Effect<R2, E2, A>>,
): Fx<R | R2, E | E2, A> => internal.switchLatestEffect(fx)

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
} = dual(
  3,

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>,
  ): Fx<R | R2 | R3, E2 | E3, B | C> => internal.switchMatchCause(fx, f, g),
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
} = dual(
  3,

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
    g: (a: A) => Effect.Effect<R3, E3, C>,
  ): Fx<R | R2 | R3, E2 | E3, B | C> => internal.switchMatchCauseEffect(fx, f, g),
)

export const switchMatch: {
  <E, R2, E2, B, A, R3, E3, C>(
    f: (error: E) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>,
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (error: E) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>,
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(
  3,

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (error: E) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>,
  ): Fx<R | R2 | R3, E2 | E3, B | C> => internal.switchMatch(fx, f, g),
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
} = dual(3, (fx, f, g) => internal.switchMatchEffect(fx, f, g))

export const switchMapCause: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  ): Fx<R | R2, E2, B>
} = dual(2, (fx, f) => internal.switchMapCause(fx, f))

export const switchMapCauseEffect: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E2, B>
} = dual(2, (fx, f) => internal.switchMapCauseEffect(fx, f))

export const switchMapDefect: {
  <R2, E2, B>(
    f: (e: unknown) => Fx<R2, E2, B>,
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: unknown) => Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
} = dual(
  2,

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: unknown) => Fx<R2, E2, B>,
  ): Fx<R | R2, E | E2, A | B> => internal.switchMapDefect(fx, f),
)

export const switchMapError: {
  <E, R2, E2, B>(f: (error: E) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, B>

  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (error: E) => Fx<R2, E2, B>): Fx<R | R2, E2, B>
} = dual(2, (fx, f) => internal.switchMapError(fx, f))

export const switchMapErrorEffect: {
  <E, R2, E2, B>(
    f: (error: E) => Effect.Effect<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (error: E) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E2, B>
} = dual(2, (fx, f) => internal.switchMapErrorEffect(fx, f))

export const takeWhile: {
  <A>(predicate: Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A>
} = dual(2, (fx, predicate) => internal.takeWhile(fx, predicate))

export const takeUntil: {
  <A>(predicate: Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A>
} = dual(2, (fx, predicate) => internal.takeUntil(fx, predicate))

export const tap: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, A>
} = dual(2, (fx, f) => internal.tap(fx, f))

export const tapSync: {
  <A, B>(f: (a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, A>
} = dual(2, (fx, f) => internal.tapSync(fx, f))

export const tapCause: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, A>
} = dual(2, (fx, f) => internal.tapCause(fx, f))

export const tapCauseSync: {
  <E, B>(f: (cause: Cause.Cause<E>) => B): <R, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => B): Fx<R, E, A>
} = dual(2, (fx, f) => internal.tapCauseSync(fx, f))

export const tapError: {
  <E, R2, E2, B>(
    f: (error: E) => Effect.Effect<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (error: E) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, A>
} = dual(2, (fx, f) => internal.tapError(fx, f))

export const tapErrorSync: {
  <E, B>(f: (error: E) => B): <R, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (error: E) => B): Fx<R, E, A>
} = dual(2, (fx, f) => internal.tapErrorSync(fx, f))

export const throttle: {
  (delay: Duration): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: Duration): Fx<R, E, A>
} = dual(2, (fx, delay) => internal.throttle(fx, delay))

export const toArray: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R | Scope.Scope, E, Array<A>> = (
  fx,
) => internal.toArray(fx)

export const toChunk: <R, E, A>(
  fx: Fx<R, E, A>,
) => Effect.Effect<R | Scope.Scope, E, Chunk.Chunk<A>> = (fx) => internal.toChunk(fx)

export const toReadonlyArray: <R, E, A>(
  fx: Fx<R, E, A>,
) => Effect.Effect<R | Scope.Scope, E, ReadonlyArray<A>> = (fx) => internal.toReadonlyArray(fx)

export const keyed: {
  <A, R2, E2, B, C>(
    f: (value: internal.RefSubject<never, A>) => Fx<R2, E2, B>,
    getKey: (a: A) => C,
  ): <R, E>(fx: Fx<R, E, readonly A[]>) => Fx<R2, E2, readonly B[]>

  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, readonly A[]>,
    f: (value: internal.RefSubject<never, A>) => Fx<R2, E2, B>,
    getKey: (a: A) => C,
  ): Fx<R | R2, E | E2, readonly B[]>
} = dual(
  3,

  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, readonly A[]>,
    f: (value: Fx<never, never, A>) => Fx<R2, E2, B>,
    getKey: (a: A) => C,
  ): Fx<R | R2, E | E2, readonly B[]> => internal.keyed(fx, f, getKey),
)

export const fromDequeue: <A>(queue: Queue.Dequeue<A>) => Fx<never, never, A> = (queue) =>
  internal.fromDequeue(queue)

export const fromQueue: <A>(queue: Queue.Queue<A>) => Fx<never, never, A> = fromDequeue

export const fromDequeueWithShutdown: <A>(queue: Queue.Dequeue<A>) => Fx<never, never, A> = (
  queue,
) => internal.fromDequeueWithShutdown(queue)

export const fromHub: <A>(hub: Hub.Hub<A>) => Fx<Scope.Scope, never, A> = (hub) =>
  internal.fromHub(hub)

export const toEnqueue: {
  <A>(enqueue: Queue.Enqueue<A>): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, void>
  <R, E, A>(fx: Fx<R, E, A>, enqueue: Queue.Enqueue<A>): Effect.Effect<R, E, void>
} = dual(2, (fx, enqueue) => internal.toEnqueue(fx, enqueue))

export const orElse: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, R2, E2, B>(fx: Fx<R, E, B>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, B>
} = dual(
  2,

  <R, E, R2, E2, B>(
    fx: Fx<R, E, B>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  ): Fx<R | R2, E2, B> => internal.orElse(fx, f),
)

export * from './RefArray.js'
export * from './RefSubject.js'
export * from './Computed.js'
export * from './Filtered.js'
export * from './RefTransform.js'
export * from './Subject.js'
