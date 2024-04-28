/**
 * @since 1.0.0
 */

import type { ParseOptions } from "@effect/schema/AST"
import type * as ParseResult from "@effect/schema/ParseResult"
import * as Schema from "@effect/schema/Schema"
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
  export type Input<T> = [T] extends [Guard<infer I, infer _R, infer _E, infer _O>] ? I :
    [T] extends [AsGuard<infer I, infer _R, infer _E, infer _O>] ? I
    : never

  /**
   * @since 1.0.0
   */
  export type Context<T> = [T] extends [Guard<infer _I, infer _O, infer _E, infer R>] ? R :
    [T] extends [AsGuard<infer _I, infer _O, infer _E, infer R>] ? R
    : never

  /**
   * @since 1.0.0
   */
  export type Error<T> = [T] extends [Guard<infer _I, infer _O, infer E, infer _R>] ? E
    : [T] extends [AsGuard<infer _I, infer _O, infer E, infer _R>] ? E
    : never

  /**
   * @since 1.0.0
   */
  export type Output<T> = [T] extends [Guard<infer _I, infer O, infer _E, infer _R>] ? O
    : [T] extends [AsGuard<infer _I, infer O, infer _E, infer _R>] ? O
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
  const entries = Object.entries(guards).map(([k, v]) => [k, getGuard(v)] as const)
  return (i: AnyInput<GS>) =>
    Effect.gen(function*() {
      for (const [_tag, guard] of entries) {
        const match = yield* guard(i)
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
export const catchTag: {
  <E, K extends E extends { _tag: string } ? E["_tag"] : never, O2, E2, R2>(
    tag: K,
    f: (e: Extract<E, { _tag: K }>) => Effect.Effect<O2, E2, R2>
  ): <I, O, R>(guard: GuardInput<I, O, E, R>) => Guard<I, O | O2, E2 | Exclude<E, { _tag: K }>, R | R2>

  <I, O, E, R, K extends E extends { _tag: string } ? E["_tag"] : never, O2, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    tag: K,
    f: (e: Extract<E, { _tag: K }>) => Effect.Effect<O2, E2, R2>
  ): Guard<I, O | O2, E2 | Exclude<E, { _tag: K }>, R | R2>
} = dual(
  3,
  function catchTag<I, O, E, R, K extends E extends { _tag: string } ? E["_tag"] : never, O2, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    tag: K,
    f: (e: Extract<E, { _tag: K }>) => Effect.Effect<O2, E2, R2>
  ): Guard<I, O | O2, Exclude<E, { _tag: K }> | E2, R | R2> {
    const g = getGuard(guard)
    return (i): Effect.Effect<Option.Option<O | O2>, E2 | Exclude<E, { _tag: K }>, R | R2> =>
      Effect.catchTag(g(i), tag, (e) => Effect.asSome(f(e)))
  }
)

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

const parseOptions: ParseOptions = { errors: "all", onExcessProperty: "ignore" }

/**
 * @since 1.0.0
 */
export function fromSchemaDecode<A, I, R>(schema: Schema.Schema<A, I, R>): Guard<I, A, ParseResult.ParseError, R> {
  const decode_ = Schema.decode(schema)
  return (i: I) => Effect.asSome(decode_(i, parseOptions))
}

/**
 * @since 1.0.0
 */
export function fromSchemaEncode<A, I, R>(schema: Schema.Schema<A, I, R>): Guard<A, I, ParseResult.ParseError, R> {
  const encode_ = Schema.encode(schema)
  return (a: A) => Effect.asSome(encode_(a, parseOptions))
}

/**
 * @since 1.0.0
 */
export const decode: {
  <A, O, R2>(
    schema: Schema.Schema<A, O, R2>
  ): <I, E = never, R = never>(guard: GuardInput<I, O, E, R>) => Guard<I, A, ParseResult.ParseError | E, R | R2>

  <I, O, E, R, A, R2>(
    guard: GuardInput<I, O, E, R>,
    schema: Schema.Schema<A, O, R2>
  ): Guard<I, A, ParseResult.ParseError | E, R | R2>
} = dual(2, function decode<I, O, E, R, A, R2>(
  guard: GuardInput<I, O, E, R>,
  schema: Schema.Schema<A, O, R2>
): Guard<I, A, E | ParseResult.ParseError, R | R2> {
  return compose(guard, fromSchemaDecode(schema))
})

/**
 * @since 1.0.0
 */
export const encode: {
  <O, A, R2>(
    schema: Schema.Schema<O, A, R2>
  ): <I, E = never, R = never>(guard: GuardInput<I, O, E, R>) => Guard<I, A, ParseResult.ParseError | E, R | R2>

  <I, O, E, R, A, R2>(
    guard: GuardInput<I, O, E, R>,
    schema: Schema.Schema<O, A, R2>
  ): Guard<I, A, ParseResult.ParseError | E, R | R2>
} = dual(2, function encode<I, O, E, R, A, R2>(
  guard: GuardInput<I, O, E, R>,
  schema: Schema.Schema<O, A, R2>
): Guard<I, A, E | ParseResult.ParseError, R | R2> {
  return compose(guard, fromSchemaEncode(schema))
})

/**
 * @since 1.0.0
 */
const let_: {
  <K extends PropertyKey, B>(
    key: K,
    value: B
  ): <I, O, E = never, R = never>(guard: Guard<I, O, E, R>) => Guard<I, O & { [k in K]: B }, E, R>

  <I, O, E, R, K extends PropertyKey, B>(
    guard: Guard<I, O, E, R>,
    key: K,
    value: B
  ): Guard<I, O & { [k in K]: B }, E, R>
} = dual(3, function attachProperty<I, O, E, R, K extends PropertyKey, B>(
  guard: Guard<I, O, E, R>,
  key: K,
  value: B
): Guard<I, O & { [k in K]: B }, E, R> {
  return map(guard, (a) => ({ ...a, [key]: value } as O & { [k in K]: B }))
})

export {
  /**
   * @since 1.0.0
   */
  let_ as let
}

/**
 * @since 1.0.0
 */
export const addTag: {
  <B>(
    value: B
  ): <I, O, E = never, R = never>(guard: GuardInput<I, O, E, R>) => Guard<I, O & { readonly _tag: B }, E, R>

  <I, O, E, R, B>(
    guard: GuardInput<I, O, E, R>,
    value: B
  ): Guard<I, O & { readonly _tag: B }, E, R>
} = dual(2, function attachProperty<I, O, E, R, B>(
  guard: GuardInput<I, O, E, R>,
  value: B
): Guard<I, O & { readonly _tag: B }, E, R> {
  return map(guard, (a) => ({ ...a, _tag: value } as O & { readonly _tag: B }))
})

/**
 * @since 1.0.0
 */
export const bindTo: {
  <K extends PropertyKey>(key: K): <I, O, E, R>(guard: GuardInput<I, O, E, R>) => Guard<I, { [k in K]: O }, E, R>
  <I, O, E, R, K extends PropertyKey>(guard: GuardInput<I, O, E, R>, key: K): Guard<I, { [k in K]: O }, E, R>
} = dual(2, <I, O, E, R, K extends PropertyKey>(
  guard: GuardInput<I, O, E, R>,
  key: K
): Guard<I, { [k in K]: O }, E, R> => map(guard, (a) => ({ [key]: a } as { [k in K]: O })))

/**
 * @since 1.0.0
 */
export const bind: {
  <I, O, E, R, K extends PropertyKey, B, E2, R2>(
    key: K,
    f: GuardInput<O, B, E2, R2>
  ): (guard: GuardInput<I, O, E, R>) => Guard<I, O & { [k in K]: B }, E | E2, R | R2>

  <I, O, E, R, K extends PropertyKey, B, E2, R2>(
    guard: GuardInput<I, O, E, R>,
    key: K,
    f: GuardInput<O, B, E2, R2>
  ): Guard<I, O & { [k in K]: B }, E | E2, R | R2>
} = dual(3, function bind<I, O, E, R, K extends PropertyKey, B, E2, R2>(
  guard: GuardInput<I, O, E, R>,
  key: K,
  f: GuardInput<O, B, E2, R2>
): Guard<I, O & { [k in K]: B }, E | E2, R | R2> {
  const f_ = bindTo(f, key)

  return compose(guard, (o) => Effect.map(f_(o), Option.map((b) => ({ ...o, ...b }))))
})
