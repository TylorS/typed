/**
 * @since 1.18.0
 */

import type { Predicate } from "effect"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as Option from "effect/Option"

/**
 * @since 1.18.0
 */
export type Guard<in I, out O, out E = never, out R = never> = (input: I) => Effect.Effect<Option.Option<O>, E, R>

/**
 * @since 1.18.0
 */
export namespace Guard {
  /**
   * @since 1.18.0
   */
  export type Input<T> = T extends Guard<infer I, infer _R, infer _E, infer _O> ? I : never
  /**
   * @since 1.18.0
   */
  export type Context<T> = T extends Guard<infer _I, infer _O, infer _E, infer R> ? R : never
  /**
   * @since 1.18.0
   */
  export type Error<T> = T extends Guard<infer _I, infer _O, infer E, infer _R> ? E : never
  /**
   * @since 1.18.0
   */
  export type Output<T> = T extends Guard<infer _I, infer O, infer _E, infer _R> ? O : never
}

/**
 * @since 1.18.0
 */
export const compose: {
  <O, B, E2, R2>(output: Guard<O, B, E2, R2>): <I, R, E>(input: Guard<I, O, E, R>) => Guard<I, B, E | E2, R | R2>
  <I, O, E, R, B, E2, R2>(input: Guard<I, O, E, R>, output: Guard<O, B, E2, R2>): Guard<I, B, E | E2, R | R2>
} = dual(2, function flatMap<I, O, E, R, B, E2, R2>(
  input: Guard<I, O, E, R>,
  output: Guard<O, B, E2, R2>
): Guard<I, B, E | E2, R | R2> {
  return (i) =>
    Effect.flatMap(
      input(i),
      Option.match({
        onNone: () => Effect.succeedNone,
        onSome: output
      })
    )
})

/**
 * @since 1.18.0
 */
export const mapEffect: {
  <O, B, E2, R2>(
    f: (o: O) => Effect.Effect<B, E2, R2>
  ): <I, R, E>(guard: Guard<I, O, E, R>) => Guard<I, B, E | E2, R | R2>
  <I, O, E, R, B, E2, R2>(guard: Guard<I, O, E, R>, f: (o: O) => Effect.Effect<B, E2, R2>): Guard<I, B, E | E2, R | R2>
} = dual(2, function mapEffect<I, O, E, R, B, E2, R2>(
  guard: Guard<I, O, E, R>,
  f: (o: O) => Effect.Effect<B, E2, R2>
): Guard<I, B, E | E2, R | R2> {
  return compose(guard, (o) => Effect.asSome(f(o)))
})

/**
 * @since 1.18.0
 */
export const map: {
  <O, B>(f: (o: O) => B): <I, R, E>(guard: Guard<I, O, E, R>) => Guard<I, B, E, R>
  <I, O, E, R, B>(guard: Guard<I, O, E, R>, f: (o: O) => B): Guard<I, B, E, R>
} = dual(2, function map<I, O, E, R, B>(
  guard: Guard<I, O, E, R>,
  f: (o: O) => B
): Guard<I, B, E, R> {
  return mapEffect(guard, (o) => Effect.sync(() => f(o)))
})

/**
 * @since 1.18.0
 */
export const tap: {
  <O, B, E2, R2>(
    f: (o: O) => Effect.Effect<B, E2, R2>
  ): <I, R, E>(guard: Guard<I, O, E, R>) => Guard<I, O, E | E2, R | R2>
  <I, O, E, R, B, E2, R2>(guard: Guard<I, O, E, R>, f: (o: O) => Effect.Effect<B, E2, R2>): Guard<I, O, E | E2, R | R2>
} = dual(2, function tap<I, O, E, R, B, E2, R2>(
  guard: Guard<I, O, E, R>,
  f: (o: O) => Effect.Effect<B, E2, R2>
): Guard<I, O, E | E2, R | R2> {
  return compose(guard, (o) => Effect.as(f(o), Option.some(o)))
})

/**
 * @since 1.18.0
 */
export const filterMap: {
  <O, B>(f: (o: O) => Option.Option<B>): <I, R, E>(guard: Guard<I, O, E, R>) => Guard<I, B, E, R>
  <I, O, E, R, B>(guard: Guard<I, O, E, R>, f: (o: O) => Option.Option<B>): Guard<I, B, E, R>
} = dual(
  2,
  <I, O, E, R, B>(guard: Guard<I, O, E, R>, f: (o: O) => Option.Option<B>): Guard<I, B, E, R> => (i) =>
    Effect.map(guard(i), Option.filterMap(f))
)

/**
 * @since 1.18.0
 */
export const filter: {
  <O, O2 extends O>(predicate: (o: O) => o is O2): <I, R, E>(guard: Guard<I, O, E, R>) => Guard<I, O, E, R>
  <O>(predicate: (o: O) => boolean): <I, R, E>(guard: Guard<I, O, E, R>) => Guard<I, O, E, R>
  <I, O, E, R, O2 extends O>(guard: Guard<I, O, E, R>, predicate: (o: O) => o is O2): Guard<I, O, E, R>
  <I, O, E, R>(guard: Guard<I, O, E, R>, predicate: (o: O) => boolean): Guard<I, O, E, R>
} = dual(
  2,
  <I, O, E, R>(guard: Guard<I, O, E, R>, predicate: (o: O) => boolean): Guard<I, O, E, R> => (i) =>
    Effect.map(guard(i), Option.filter(predicate))
)

/**
 * @since 1.18.0
 */
export function any<const GS extends Readonly<Record<string, Guard<any, any, any, any>>>>(
  guards: GS
): Guard<AnyInput<GS>, AnyOutput<GS>, Guard.Error<GS[keyof GS]>, Guard.Context<GS[keyof GS]>> {
  const entries = Object.entries(guards)
  return (i: AnyInput<GS>) =>
    Effect.gen(function*(_) {
      for (const [_tag, guard] of entries) {
        const match = yield* _(guard(i))
        if (Option.isSome(match)) {
          return Option.some({ _tag, value: match.value } as AnyOutput<GS>)
        }
      }
      return Option.none()
    })
}

/**
 * @since 1.18.0
 */
export type AnyInput<GS extends Readonly<Record<string, Guard<any, any, any, any>>>> = UnionToIntersection<
  Guard.Input<GS[keyof GS]>
>

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never

/**
 * @since 1.18.0
 */
export type AnyOutput<GS extends Readonly<Record<string, Guard<any, any, any, any>>>> = [
  {
    [K in keyof GS]: { readonly _tag: K; readonly value: Guard.Output<GS[K]> }
  }[keyof GS]
] extends [infer R] ? R : never

/**
 * @since 1.20.0
 */
export function liftPredicate<A, B extends A>(predicate: Predicate.Refinement<A, B>): Guard<A, B>
export function liftPredicate<A>(predicate: Predicate.Predicate<A>): Guard<A, A>
export function liftPredicate<A>(predicate: Predicate.Predicate<A>): Guard<A, A> {
  return (a) => Effect.sync(() => (predicate(a) ? Option.some(a) : Option.none()))
}
