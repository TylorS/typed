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
export type Guard<I, R, E, O> = (input: I) => Effect.Effect<R, E, Option.Option<O>>

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
  export type Context<T> = T extends Guard<infer _I, infer R, infer _E, infer _O> ? R : never
  /**
   * @since 1.18.0
   */
  export type Error<T> = T extends Guard<infer _I, infer _R, infer E, infer _O> ? E : never
  /**
   * @since 1.18.0
   */
  export type Output<T> = T extends Guard<infer _I, infer _R, infer _E, infer O> ? O : never
}

/**
 * @since 1.18.0
 */
export const compose: {
  <O, R2, E2, B>(output: Guard<O, R2, E2, B>): <I, R, E>(input: Guard<I, R, E, O>) => Guard<I, R | R2, E | E2, B>
  <I, R, E, O, R2, E2, B>(input: Guard<I, R, E, O>, output: Guard<O, R2, E2, B>): Guard<I, R | R2, E | E2, B>
} = dual(2, function flatMap<I, R, E, O, R2, E2, B>(
  input: Guard<I, R, E, O>,
  output: Guard<O, R2, E2, B>
): Guard<I, R | R2, E | E2, B> {
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
  <O, R2, E2, B>(
    f: (o: O) => Effect.Effect<R2, E2, B>
  ): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R | R2, E | E2, B>
  <I, R, E, O, R2, E2, B>(guard: Guard<I, R, E, O>, f: (o: O) => Effect.Effect<R2, E2, B>): Guard<I, R | R2, E | E2, B>
} = dual(2, function mapEffect<I, R, E, O, R2, E2, B>(
  guard: Guard<I, R, E, O>,
  f: (o: O) => Effect.Effect<R2, E2, B>
): Guard<I, R | R2, E | E2, B> {
  return compose(guard, (o) => Effect.asSome(f(o)))
})

/**
 * @since 1.18.0
 */
export const map: {
  <O, B>(f: (o: O) => B): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R, E, B>
  <I, R, E, O, B>(guard: Guard<I, R, E, O>, f: (o: O) => B): Guard<I, R, E, B>
} = dual(2, function map<I, R, E, O, B>(
  guard: Guard<I, R, E, O>,
  f: (o: O) => B
): Guard<I, R, E, B> {
  return mapEffect(guard, (o) => Effect.sync(() => f(o)))
})

/**
 * @since 1.18.0
 */
export const tap: {
  <O, R2, E2, B>(
    f: (o: O) => Effect.Effect<R2, E2, B>
  ): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R | R2, E | E2, O>
  <I, R, E, O, R2, E2, B>(guard: Guard<I, R, E, O>, f: (o: O) => Effect.Effect<R2, E2, B>): Guard<I, R | R2, E | E2, O>
} = dual(2, function tap<I, R, E, O, R2, E2, B>(
  guard: Guard<I, R, E, O>,
  f: (o: O) => Effect.Effect<R2, E2, B>
): Guard<I, R | R2, E | E2, O> {
  return compose(guard, (o) => Effect.as(f(o), Option.some(o)))
})

/**
 * @since 1.18.0
 */
export const filterMap: {
  <O, B>(f: (o: O) => Option.Option<B>): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R, E, B>
  <I, R, E, O, B>(guard: Guard<I, R, E, O>, f: (o: O) => Option.Option<B>): Guard<I, R, E, B>
} = dual(
  2,
  <I, R, E, O, B>(guard: Guard<I, R, E, O>, f: (o: O) => Option.Option<B>): Guard<I, R, E, B> => (i) =>
    Effect.map(guard(i), Option.filterMap(f))
)

/**
 * @since 1.18.0
 */
export const filter: {
  <O, O2 extends O>(predicate: (o: O) => o is O2): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R, E, O2>
  <O>(predicate: (o: O) => boolean): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R, E, O>
  <I, R, E, O, O2 extends O>(guard: Guard<I, R, E, O>, predicate: (o: O) => o is O2): Guard<I, R, E, O2>
  <I, R, E, O>(guard: Guard<I, R, E, O>, predicate: (o: O) => boolean): Guard<I, R, E, O>
} = dual(
  2,
  <I, R, E, O>(guard: Guard<I, R, E, O>, predicate: (o: O) => boolean): Guard<I, R, E, O> => (i) =>
    Effect.map(guard(i), Option.filter(predicate))
)

/**
 * @since 1.18.0
 */
export function any<const GS extends Readonly<Record<string, Guard<any, any, any, any>>>>(
  guards: GS
): Guard<AnyInput<GS>, Guard.Context<GS[keyof GS]>, Guard.Context<GS[keyof GS]>, AnyOutput<GS>> {
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

export function liftPredicate<A, B extends A>(predicate: Predicate.Refinement<A, B>): Guard<A, never, never, B>
export function liftPredicate<A>(predicate: Predicate.Predicate<A>): Guard<A, never, never, A>
export function liftPredicate<A>(predicate: Predicate.Predicate<A>): Guard<A, never, never, A> {
  return (a) => Effect.sync(() => (predicate(a) ? Option.some(a) : Option.none()))
}
