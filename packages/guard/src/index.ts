/**
 * @since 1.0.0
 */

import type { Cause, Context, Layer, Predicate, Runtime } from "effect"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as Option from "effect/Option"

/**
 * @since 1.0.0
 */
export type Guard<in I, out O, out E = never, out R = never> = (input: I) => Effect.Effect<Option.Option<O>, E, R>

/**
 * @since 1.0.0
 */
export namespace Guard {
  /**
   * @since 1.0.0
   */
  export type Input<T> = T extends Guard<infer I, infer _R, infer _E, infer _O> ? I :
    T extends AsGuard<infer I, infer _R, infer _E, infer _O> ? I
    : never

  /**
   * @since 1.0.0
   */
  export type Context<T> = T extends Guard<infer _I, infer _O, infer _E, infer R> ? R :
    T extends AsGuard<infer _I, infer _O, infer _E, infer R> ? R
    : never

  /**
   * @since 1.0.0
   */
  export type Error<T> = T extends Guard<infer _I, infer _O, infer E, infer _R> ? E
    : T extends AsGuard<infer _I, infer _O, infer E, infer _R> ? E
    : never

  /**
   * @since 1.0.0
   */
  export type Output<T> = T extends Guard<infer _I, infer O, infer _E, infer _R> ? O
    : T extends AsGuard<infer _I, infer O, infer _E, infer _R> ? O
    : never
}

/**
 * @since 1.0.0
 */
export interface AsGuard<in I, out O, out E = never, out R = never> {
  readonly asGuard: () => Guard<I, O, E, R>
}

/**
 * @since 1.0.0
 */
export type GuardInput<I, O, E = never, R = never> = Guard<I, O, E, R> | AsGuard<I, O, E, R>

/**
 * @since 1.0.0
 */
export const getGuard = <I, O, E = never, R = never>(guard: GuardInput<I, O, E, R>): Guard<I, O, E, R> =>
  "asGuard" in guard ? guard.asGuard() : guard

/**
 * @since 1.0.0
 */
export const compose: {
  <O, B, E2, R2>(
    output: GuardInput<O, B, E2, R2>
  ): <I, R, E>(input: GuardInput<I, O, E, R>) => Guard<I, B, E | E2, R | R2>
  <I, O, E, R, B, E2, R2>(input: GuardInput<I, O, E, R>, output: GuardInput<O, B, E2, R2>): Guard<I, B, E | E2, R | R2>
} = dual(2, function flatMap<I, O, E, R, B, E2, R2>(
  input: GuardInput<I, O, E, R>,
  output: GuardInput<O, B, E2, R2>
): Guard<I, B, E | E2, R | R2> {
  const g1 = getGuard(input)
  const g2 = getGuard(output)
  return (i) =>
    Effect.flatMap(
      g1(i),
      Option.match({
        onNone: () => Effect.succeedNone,
        onSome: g2
      })
    )
})

/**
 * @since 1.0.0
 */
export const mapEffect: {
  <O, B, E2, R2>(
    f: (o: O) => Effect.Effect<B, E2, R2>
  ): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, B, E | E2, R | R2>
  <I, O, E, R, B, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    f: (o: O) => Effect.Effect<B, E2, R2>
  ): Guard<I, B, E | E2, R | R2>
} = dual(2, function mapEffect<I, O, E, R, B, E2, R2>(
  guard: GuardInput<I, O, E, R>,
  f: (o: O) => Effect.Effect<B, E2, R2>
): Guard<I, B, E | E2, R | R2> {
  return compose(guard, (o) => Effect.asSome(f(o)))
})

/**
 * @since 1.0.0
 */
export const map: {
  <O, B>(f: (o: O) => B): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, B, E, R>
  <I, O, E, R, B>(guard: GuardInput<I, O, E, R>, f: (o: O) => B): Guard<I, B, E, R>
} = dual(2, function map<I, O, E, R, B>(
  guard: GuardInput<I, O, E, R>,
  f: (o: O) => B
): Guard<I, B, E, R> {
  return mapEffect(guard, (o) => Effect.sync(() => f(o)))
})

/**
 * @since 1.0.0
 */
export const tap: {
  <O, B, E2, R2>(
    f: (o: O) => Effect.Effect<B, E2, R2>
  ): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E | E2, R | R2>
  <I, O, E, R, B, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    f: (o: O) => Effect.Effect<B, E2, R2>
  ): Guard<I, O, E | E2, R | R2>
} = dual(2, function tap<I, O, E, R, B, E2, R2>(
  guard: GuardInput<I, O, E, R>,
  f: (o: O) => Effect.Effect<B, E2, R2>
): Guard<I, O, E | E2, R | R2> {
  return compose(guard, (o) => Effect.as(f(o), Option.some(o)))
})

/**
 * @since 1.0.0
 */
export const filterMap: {
  <O, B>(f: (o: O) => Option.Option<B>): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, B, E, R>
  <I, O, E, R, B>(guard: GuardInput<I, O, E, R>, f: (o: O) => Option.Option<B>): Guard<I, B, E, R>
} = dual(
  2,
  <I, O, E, R, B>(guard: GuardInput<I, O, E, R>, f: (o: O) => Option.Option<B>): Guard<I, B, E, R> => {
    const g = getGuard(guard)
    return (i) => Effect.map(g(i), Option.filterMap(f))
  }
)

/**
 * @since 1.0.0
 */
export const filter: {
  <O, O2 extends O>(predicate: (o: O) => o is O2): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, R>
  <O>(predicate: (o: O) => boolean): <I, R, E>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, R>
  <I, O, E, R, O2 extends O>(guard: GuardInput<I, O, E, R>, predicate: (o: O) => o is O2): Guard<I, O, E, R>
  <I, O, E, R>(guard: GuardInput<I, O, E, R>, predicate: (o: O) => boolean): Guard<I, O, E, R>
} = dual(
  2,
  <I, O, E, R>(guard: GuardInput<I, O, E, R>, predicate: (o: O) => boolean): Guard<I, O, E, R> => {
    const g = getGuard(guard)
    return (i) => Effect.map(g(i), Option.filter(predicate))
  }
)

/**
 * @since 1.0.0
 */
export function any<const GS extends Readonly<Record<string, GuardInput<any, any, any, any>>>>(
  guards: GS
): Guard<AnyInput<GS>, AnyOutput<GS>, Guard.Error<GS[keyof GS]>, Guard.Context<GS[keyof GS]>> {
  const entries = Object.entries(guards)
  return (i: AnyInput<GS>) =>
    Effect.gen(function*(_) {
      for (const [_tag, guard] of entries) {
        const match = yield* _(getGuard(guard)(i))
        if (Option.isSome(match)) {
          return Option.some({ _tag, value: match.value } as AnyOutput<GS>)
        }
      }
      return Option.none()
    })
}

/**
 * @since 1.0.0
 */
export type AnyInput<GS extends Readonly<Record<string, GuardInput<any, any, any, any>>>> = UnionToIntersection<
  Guard.Input<GS[keyof GS]>
>

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never

/**
 * @since 1.0.0
 */
export type AnyOutput<GS extends Readonly<Record<string, GuardInput<any, any, any, any>>>> = [
  {
    [K in keyof GS]: { readonly _tag: K; readonly value: Guard.Output<GS[K]> }
  }[keyof GS]
] extends [infer R] ? R : never

/**
 * @since 1.0.0
 */
export function liftPredicate<A, B extends A>(predicate: Predicate.Refinement<A, B>): Guard<A, B>
export function liftPredicate<A>(predicate: Predicate.Predicate<A>): Guard<A, A>
export function liftPredicate<A>(predicate: Predicate.Predicate<A>): Guard<A, A> {
  return (a) => Effect.sync(() => (predicate(a) ? Option.some(a) : Option.none()))
}

/**
 * @since 1.0.0
 */
export const catchAllCause: {
  <E, O2, E2, R2>(
    f: (e: Cause.Cause<E>) => Effect.Effect<O2, E2, R2>
  ): <I, O, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O | O2, E2, R | R2>
  <I, O, E, R, O2, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    f: (e: Cause.Cause<E>) => Effect.Effect<O2, E2, R2>
  ): Guard<I, O | O2, E2, R | R2>
} = dual(2, function catchAllCause<I, O, E, R, O2, E2, R2>(
  guard: GuardInput<I, O, E, R>,
  f: (e: Cause.Cause<E>) => Effect.Effect<O2, E2, R2>
): Guard<I, O | O2, E2, R | R2> {
  const g = getGuard(guard)
  return (i) => Effect.catchAllCause(g(i), (a) => Effect.asSome(f(a)))
})

/**
 * @since 1.0.0
 */
export const catchAll: {
  <E, O2, E2, R2>(
    f: (e: E) => Effect.Effect<O2, E2, R2>
  ): <I, O, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O | O2, E2, R | R2>
  <I, O, E, R, O2, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    f: (e: E) => Effect.Effect<O2, E2, R2>
  ): Guard<I, O | O2, E2, R | R2>
} = dual(2, function catchAll<I, O, E, R, O2, E2, R2>(
  guard: GuardInput<I, O, E, R>,
  f: (e: E) => Effect.Effect<O2, E2, R2>
): Guard<I, O | O2, E2, R | R2> {
  const g = getGuard(guard)
  return (i) => Effect.catchAll(g(i), (a) => Effect.asSome(f(a)))
})

/**
 * @since 1.0.0
 */
export const provide: {
  <R2>(
    provided: Context.Context<R2>
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, Exclude<R, R2>>
  <R2>(provided: Runtime.Runtime<R2>): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, Exclude<R, R2>>
  <R2, E2, R3>(
    provided: Layer.Layer<R2, E2, R3>
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E | E2, Exclude<R, R2> | R3>

  <I, O, E, R, R2>(guard: GuardInput<I, O, E, R>, provided: Context.Context<R2>): Guard<I, O, E, Exclude<R, R2>>
  <I, O, E, R, R2>(guard: GuardInput<I, O, E, R>, provided: Runtime.Runtime<R2>): Guard<I, O, E, Exclude<R, R2>>
  <I, O, E, R, R2, E2, R3>(
    guard: GuardInput<I, O, E, R>,
    provided: Layer.Layer<R2, E2, R3>
  ): Guard<I, O, E | E2, Exclude<R, R2> | R3>
} = dual(2, function provide<I, O, E, R, R2>(
  guard: GuardInput<I, O, E, R>,
  provided: Context.Context<R2>
): Guard<I, O, E, Exclude<R, R2>> {
  const g = getGuard(guard)
  return (i) => Effect.provide(g(i), provided)
})

/**
 * @since 1.0.0
 */
export const provideService: {
  <Id, S>(
    tag: Context.Tag<Id, S>,
    service: S
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E, Exclude<R, Id>>
  <I, O, E, R, Id, S>(
    guard: GuardInput<I, O, E, R>,
    tag: Context.Tag<Id, S>,
    service: S
  ): Guard<I, O, E, Exclude<R, Id>>
} = dual(3, function provideService<I, O, E, R, Id, S>(
  guard: GuardInput<I, O, E, R>,
  tag: Context.Tag<Id, S>,
  service: S
): Guard<I, O, E, Exclude<R, Id>> {
  const g = getGuard(guard)
  return (i) => Effect.provideService(g(i), tag, service)
})

/**
 * @since 1.0.0
 */
export const provideServiceEffect: {
  <Id, S, E2, R2>(
    tag: Context.Tag<Id, S>,
    service: Effect.Effect<S, E2, R2>
  ): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O, E | E2, Exclude<R, Id> | R2>
  <I, O, E, R, Id, S, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    tag: Context.Tag<Id, S>,
    service: Effect.Effect<S, E2, R2>
  ): Guard<I, O, E | E2, Exclude<R, Id> | R2>
} = dual(3, function provideServiceEffect<I, O, E, R, Id, S, E2, R2>(
  guard: GuardInput<I, O, E, R>,
  tag: Context.Tag<Id, S>,
  service: Effect.Effect<S, E2, R2>
): Guard<I, O, E | E2, Exclude<R, Id> | R2> {
  const g = getGuard(guard)
  return (i) => Effect.provideServiceEffect(g(i), tag, service)
})
