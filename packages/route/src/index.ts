/**
 * @since 1.0.0
 */

import type { Schema } from "@effect/schema"
import { ParseResult } from "@effect/schema"
import * as Guard from "@typed/guard"
import * as typedPath from "@typed/path"
import type { Cause, Context, Layer, Runtime, Types } from "effect"
import { Effect, Option, Pipeable, Predicate } from "effect"
import { dual } from "effect/Function"
import { unify } from "effect/Unify"
import * as ptr from "path-to-regexp"

/**
 * @since 1.0.0
 */
export const RouteTypeId = Symbol.for("@typed/route/Route")

/**
 * @since 1.0.0
 */
export type RouteTypeId = typeof RouteTypeId

/**
 * @since 1.0.0
 */
export interface Route<in out P extends string> extends Pipeable.Pipeable, Guard.Guard<string, typedPath.ParamsOf<P>> {
  readonly [RouteTypeId]: RouteTypeId

  readonly path: P

  readonly params: FromPathParams

  readonly match: (path: string) => Option.Option<typedPath.ParamsOf<P>>

  readonly make: {
    <const Params extends typedPath.ParamsList<P> = typedPath.ParamsList<P>>(
      ...params: Params
    ): typedPath.Interpolate<P, Extract<Params[0], typedPath.ParamsOf<P>>>

    <const Params extends typedPath.ParamsOf<P> = typedPath.ParamsOf<P>>(
      params: Params
    ): typedPath.Interpolate<P, Params>
  }

  readonly concat: <P2 extends string>(
    route: Route<P2>,
    params?: FromPathParams
  ) => Route<typedPath.PathJoin<[P, P2]>>

  readonly guard: <A, E, R>(guard: Guard.Guard<typedPath.ParamsOf<P>, A, E, R>) => RouteGuard<P, A, E, R>
}

/**
 * @since 1.0.0
 */
export namespace Route {
  /**
   * @since 1.0.0
   */
  export type Path<T> = [T] extends [Route<infer P>] ? P :
    [T] extends [RouteGuard<infer P, any, any, any>] ? P :
    never

  /**
   * @since 1.0.0
   */
  export type ParamsOf<T> = [T] extends [Route<infer P>] ? typedPath.ParamsOf<P> :
    [T] extends [RouteGuard<infer P, infer _A, infer _E, infer _R>] ? typedPath.ParamsOf<P> :
    never

  /**
   * @since 1.0.0
   */
  export type GuardOf<T> = [T] extends [RouteGuard<infer _P extends `/${string}`, infer A, infer E, infer R>] ?
    Guard.Guard<string, A, E, R> :
    [T] extends [Route<infer P>] ? Guard.Guard<string, typedPath.ParamsOf<P>, never, never> :
    never

  /**
   * @since 1.0.0
   */
  export type Output<T> = Guard.Guard.Output<GuardOf<T>>

  /**
   * @since 1.0.0
   */
  export type Error<T> = Guard.Guard.Error<GuardOf<T>>

  /**
   * @since 1.0.0
   */
  export type Context<T> = Guard.Guard.Context<GuardOf<T>>
}

/**
 * @since 1.0.0
 */
export type Path<T> = Route.Path<T>

/**
 * @since 1.0.0
 */
export type ParamsOf<T> = Route.ParamsOf<T>

/**
 * @since 1.0.0
 */
export type GuardOf<T> = Route.GuardOf<T>

/**
 * @since 1.0.0
 */
export type Output<T> = Route.Output<T>

/**
 * @since 1.0.0
 */
export type Error<T> = Route.Error<T>

/**
 * @since 1.0.0
 */
export type Context<T> = Route.Context<T>

/**
 * @since 1.0.0
 */
export type ParamsList<T> = [ParamsOf<T>] extends [infer R] ? [keyof R] extends [never] ? readonly [{}?] : readonly [R]
  : []

/**
 * @since 1.0.0
 */
export function fromPath<const P extends string>(path: P, params: FromPathParams = {}): Route<P> {
  const match_ = ptr.match(path, { end: false, ...params.match })
  const match = (path: string) => {
    const match = match_(path)

    return match === false
      ? Option.none()
      : Option.some({ ...match.params } as unknown as typedPath.ParamsOf<P>)
  }

  const guard = (path: string) => Effect.succeed(match(path))

  const route: Route<P> = Object.assign(
    guard,
    {
      [RouteTypeId]: RouteTypeId,
      match,
      path,
      params,
      make: ptr.compile(path, params.make) as Route<P>["make"],
      concat: <P2 extends string>(route: Route<P2>, overrides?: FromPathParams) =>
        fromPath<typedPath.PathJoin<[P, P2]>>(
          typedPath.pathJoin(path, route.path),
          overrides ?? mergeFromPathParams(params, route.params)
        ),
      guard: <A, E, R>(g: Guard.Guard<typedPath.ParamsOf<P>, A, E, R>) => RouteGuard(route, Guard.compose(guard, g)),
      pipe(this: Route<P>) {
        return Pipeable.pipeArguments(this, arguments)
      }
    } as const
  ) as Route<P>

  return route
}

function mergeFromPathParams(options1: FromPathParams | undefined, options2: FromPathParams | undefined) {
  if (options1 === undefined) {
    return options2
  } else if (options2 === undefined) {
    return options1
  } else {
    return {
      make: { ...options1.make, ...options2.make },
      match: { ...options1.match, ...options2.match }
    }
  }
}

/**
 * Options for creating and matching a route with path-to-regexp
 * @since 1.0.0
 */
/**
 * @since 1.0.0
 */
export interface FromPathParams {
  readonly make?: ptr.ParseOptions & ptr.TokensToFunctionOptions
  readonly match?: ptr.ParseOptions & ptr.TokensToRegexpOptions & ptr.RegexpToFunctionOptions
}

/**
 * @since 1.0.0
 */
export interface RouteGuard<
  P extends string,
  A,
  E = never,
  R = never
> extends Guard.Guard<string, A, E, R> {
  readonly route: Route<P>
  readonly path: P
  readonly concat: {
    <P2 extends string, A2 = typedPath.ParamsOf<P2>, E2 = never, R2 = never>(
      route: RouteInput<P2, A2, E2, R2>
    ): RouteGuard<typedPath.PathJoin<[P, P2]>, A & A2, E | E2, R | R2>
  }
}

/**
 * @since 1.0.0
 */
export function RouteGuard<P extends string, A, E = never, R = never>(
  route: Route<P>,
  guard: Guard.Guard<string, A, E, R>
): RouteGuard<P, A, E, R> {
  return Object.assign(guard, {
    route,
    path: route.path,
    concat: <P2 extends string, A2 = typedPath.ParamsOf<P2>, E2 = never, R2 = never>(
      other: RouteInput<P2, A2, E2, R2>
    ) => {
      const otherGuard = asRouteGuard(other)

      return RouteGuard(
        route.concat(otherGuard.route),
        (i: string): Effect.Effect<Option.Option<A & A2>, E | E2, R | R2> =>
          guard(i).pipe(
            Effect.flatten,
            Effect.bindTo("a"),
            // Since the guard above matched, we can safely assume that the match will succeed
            // to pass only the relevant part of the path to the next guard
            Effect.let("aPath", () => route.make((route.match(i) as Option.Some<typedPath.ParamsOf<P>>).value)),
            Effect.bind("b", ({ aPath }) => Effect.flatten(otherGuard(i.replace(aPath, "")))),
            Effect.map(({ a, b }) => ({ ...a, ...b })),
            Effect.optionFromOptional
          )
      )
    }
  })
}

/**
 * @since 1.0.0
 */
export type RouteInput<P extends string, A = typedPath.ParamsOf<P>, E = never, R = never> =
  | Route<P>
  | RouteGuard<P, A, E, R>

/**
 * @since 1.0.0
 */
export function isRoute<P extends string = any>(u: unknown): u is Route<P> {
  return Predicate.hasProperty(u, RouteTypeId)
}

/**
 * @since 1.0.0
 */
export function isRouteGuard(u: unknown): u is RouteGuard<any, any, any, any> {
  return Predicate.isFunction(u) && Predicate.hasProperty(u, "route") && isRoute(u.route)
}

/**
 * @since 1.0.0
 */
export const guard: {
  <I extends RouteInput<any, any, any, any>, B, E2, R2>(
    guard: Guard.Guard<Route.Output<I>, B, E2, R2>
  ): (route: I) => RouteGuard<Route.Path<I>, B, Route.Error<I> | E2, Route.Context<I> | R2>

  <P extends string, A, E, R, B, E2, R2>(
    route: RouteInput<P, A, E, R>,
    guard: Guard.Guard<A, B, E2, R2>
  ): RouteGuard<P, B, E | E2, R | R2>
} = dual(2, function guard<P extends string, A, E, R, B, E2, R2>(
  route: RouteInput<P, A, E, R>,
  guard: Guard.Guard<A, B, E2, R2>
): RouteGuard<P, B, E | E2, R | R2> {
  return isRoute<P>(route)
    ? RouteGuard(route, Guard.compose(route, guard as Guard.Guard<typedPath.ParamsOf<P>, B, E2, R2>))
    : RouteGuard(route.route, Guard.compose(route, guard))
})

/**
 * @since 1.0.0
 */
export const tap: {
  <I extends RouteInput<any, any, any, any>, B, E2, R2>(
    f: (a: Route.Output<I>) => Effect.Effect<B, E2, R2>
  ): (input: I) => RouteGuard<Route.Path<I>, Route.Output<I>, Route.Error<I> | E2, Route.Context<I> | R2>

  <P extends string, A, E, R, B, E2, R2>(
    input: RouteInput<P, A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>
  ): RouteGuard<P, A, E | E2, R | R2>
} = dual(
  2,
  function tap<P extends string, A, E, R, B, E2, R2>(
    input: RouteInput<P, A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>
  ): RouteGuard<P, A, E | E2, R | R2> {
    const route = asRouteGuard(input)
    return RouteGuard(route.route, Guard.tap(route, f))
  }
)

/**
 * @since 1.0.0
 */
export const map: {
  <I extends RouteInput<any, any, any, any>, B>(
    f: (a: Route.Output<I>) => B
  ): (input: I) => RouteGuard<Route.Path<I>, B, Route.Error<I>, Route.Context<I>>

  <P extends string, A, E, R, B>(
    input: RouteInput<P, A, E, R>,
    f: (a: A) => B
  ): RouteGuard<P, B, E, R>
} = dual(
  2,
  function mapEffect<P extends string, A, E, R, B>(
    input: RouteInput<P, A, E, R>,
    f: (a: A) => B
  ): RouteGuard<P, B, E, R> {
    const route = asRouteGuard(input)
    return RouteGuard(route.route, Guard.map(route, f))
  }
)

/**
 * @since 1.0.0
 */
export const mapEffect: {
  <I extends RouteInput<any, any, any, any>, B, E2, R2>(
    f: (a: Route.Output<I>) => Effect.Effect<B, E2, R2>
  ): (input: I) => RouteGuard<Route.Path<I>, B, Route.Error<I> | E2, Route.Context<I> | R2>

  <P extends string, A, E, R, B, E2, R2>(
    input: RouteInput<P, A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>
  ): RouteGuard<P, B, E | E2, R | R2>
} = dual(
  2,
  function mapEffect<P extends string, A, E, R, B, E2, R2>(
    input: RouteInput<P, A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>
  ): RouteGuard<P, B, E | E2, R | R2> {
    const route = asRouteGuard(input)
    return RouteGuard(route.route, Guard.mapEffect(route, f))
  }
)

/**
 * @since 1.0.0
 */
export const catchAllCause: {
  <E, O2, E2, R2>(
    f: (e: Cause.Cause<E>) => Effect.Effect<O2, E2, R2>
  ): <P extends string, O, R>(input: RouteInput<P, O, E, R>) => RouteGuard<P, O | O2, E2, R | R2>
  <P extends string, O, E, R, O2, E2, R2>(
    input: RouteInput<P, O, E, R>,
    f: (e: Cause.Cause<E>) => Effect.Effect<O2, E2, R2>
  ): RouteGuard<P, O | O2, E2, R | R2>
} = dual(2, function catchAllCause<P extends string, O, E, R, O2, E2, R2>(
  input: RouteInput<P, O, E, R>,
  f: (e: Cause.Cause<E>) => Effect.Effect<O2, E2, R2>
): RouteGuard<P, O | O2, E2, R | R2> {
  const g = asRouteGuard(input)
  return RouteGuard(g.route, Guard.catchAllCause(g, f))
})

/**
 * @since 1.0.0
 */
export const catchAll: {
  <E, O2, E2, R2>(
    f: (e: E) => Effect.Effect<O2, E2, R2>
  ): <P extends string, O, R>(input: RouteInput<P, O, E, R>) => RouteGuard<P, O | O2, E2, R | R2>
  <P extends string, O, E, R, O2, E2, R2>(
    input: RouteInput<P, O, E, R>,
    f: (e: E) => Effect.Effect<O2, E2, R2>
  ): RouteGuard<P, O | O2, E2, R | R2>
} = dual(2, function catchAll<P extends string, O, E, R, O2, E2, R2>(
  input: RouteInput<P, O, E, R>,
  f: (e: E) => Effect.Effect<O2, E2, R2>
): RouteGuard<P, O | O2, E2, R | R2> {
  const g = asRouteGuard(input)
  return RouteGuard(g.route, Guard.catchAll(g, f))
})

/**
 * @since 1.0.0
 */
export const catchTag: {
  <E, K extends E extends { _tag: string } ? E["_tag"] : never, O2, E2, R2>(
    tag: K,
    f: (e: Extract<E, { _tag: K }>) => Effect.Effect<O2, E2, R2>
  ): <I extends string, O, R>(
    guard: RouteInput<I, O, E, R>
  ) => RouteGuard<I, O | O2, E2 | Exclude<E, { _tag: K }>, R | R2>

  <I extends string, O, E, R, K extends E extends { _tag: string } ? E["_tag"] : never, O2, E2, R2>(
    guard: RouteInput<I, O, E, R>,
    tag: K,
    f: (e: Extract<E, { _tag: K }>) => Effect.Effect<O2, E2, R2>
  ): RouteGuard<I, O | O2, E2 | Exclude<E, { _tag: K }>, R | R2>
} = dual(
  3,
  function catchTag<I extends string, O, E, R, K extends E extends { _tag: string } ? E["_tag"] : never, O2, E2, R2>(
    guard: RouteInput<I, O, E, R>,
    tag: K,
    f: (e: Extract<E, { _tag: K }>) => Effect.Effect<O2, E2, R2>
  ): RouteGuard<I, O | O2, Exclude<E, { _tag: K }> | E2, R | R2> {
    const g = asRouteGuard(guard)
    return RouteGuard(g.route, Guard.catchTag(g, tag, f))
  }
)

/**
 * @since 1.0.0
 */
export const provide: {
  <R2>(
    provided: Context.Context<R2>
  ): <P extends string, O, E, R>(input: RouteInput<P, O, E, R>) => RouteGuard<P, O, E, Exclude<R, R2>>
  <R2>(
    provided: Runtime.Runtime<R2>
  ): <P extends string, O, E, R>(input: RouteInput<P, O, E, R>) => RouteGuard<P, O, E, Exclude<R, R2>>
  <R2, E2, R3>(
    provided: Layer.Layer<R2, E2, R3>
  ): <P extends string, O, E, R>(input: RouteInput<P, O, E, R>) => RouteGuard<P, O, E | E2, Exclude<R, R2> | R3>
  <P extends string, O, E, R, R2>(
    input: RouteInput<P, O, E, R>,
    provided: Context.Context<R2>
  ): RouteGuard<P, O, E, Exclude<R, R2>>
  <P extends string, O, E, R, R2>(
    input: RouteInput<P, O, E, R>,
    provided: Runtime.Runtime<R2>
  ): RouteGuard<P, O, E, Exclude<R, R2>>
  <P extends string, O, E, R, R2, E2, R3>(
    input: RouteInput<P, O, E, R>,
    provided: Layer.Layer<R2, E2, R3>
  ): RouteGuard<P, O, E | E2, Exclude<R, R2> | R3>
} = dual(2, function provide<P extends string, O, E, R, R2>(
  input: RouteInput<P, O, E, R>,
  provided: Context.Context<R2>
): RouteGuard<P, O, E, Exclude<R, R2>> {
  const g = asRouteGuard(input)
  return RouteGuard(g.route, Guard.provide(g, provided))
})

/**
 * @since 1.0.0
 */
export const provideService: {
  <Id, S>(
    tag: Context.Tag<Id, S>,
    service: S
  ): <P extends string, O, E, R>(input: RouteInput<P, O, E, R>) => RouteGuard<P, O, E, Exclude<R, Id>>
  <P extends string, O, E, R, Id, S>(
    input: RouteInput<P, O, E, R>,
    tag: Context.Tag<Id, S>,
    service: S
  ): RouteGuard<P, O, E, Exclude<R, Id>>
} = dual(3, function provideService<P extends string, O, E, R, Id, S>(
  input: RouteInput<P, O, E, R>,
  tag: Context.Tag<Id, S>,
  service: S
): RouteGuard<P, O, E, Exclude<R, Id>> {
  const g = asRouteGuard(input)
  return RouteGuard(g.route, Guard.provideService(g, tag, service))
})

/**
 * @since 1.0.0
 */
export const provideServiceEffect: {
  <Id, S, E2, R2>(
    tag: Context.Tag<Id, S>,
    service: Effect.Effect<S, E2, R2>
  ): <P extends string, O, E, R>(input: RouteInput<P, O, E, R>) => RouteGuard<P, O, E | E2, Exclude<R, Id> | R2>
  <P extends string, O, E, R, Id, S, E2, R2>(
    input: RouteInput<P, O, E, R>,
    tag: Context.Tag<Id, S>,
    service: Effect.Effect<S, E2, R2>
  ): RouteGuard<P, O, E | E2, Exclude<R, Id> | R2>
} = dual(3, function provideServiceEffect<P extends string, O, E, R, Id, S, E2, R2>(
  input: RouteInput<P, O, E, R>,
  tag: Context.Tag<Id, S>,
  service: Effect.Effect<S, E2, R2>
): RouteGuard<P, O, E | E2, Exclude<R, Id> | R2> {
  const g = asRouteGuard(input)
  return RouteGuard(g.route, Guard.provideServiceEffect(g, tag, service))
})

/**
 * @since 1.0.0
 */
export interface RouteDecodeError {
  readonly _tag: "RouteDecodeError"
  readonly route: Route<string>
  readonly parseError: ParseResult.ParseError
}

/**
 * @since 1.0.0
 */
export function RouteDecodeError<P extends string>(
  route: Route<P>,
  parseError: ParseResult.ParseError
): RouteDecodeError {
  return { _tag: "RouteDecodeError", route: route as any, parseError }
}

/**
 * @since 1.0.0
 */
export interface RouteDecoder<P extends string, O, A = O, E = never, R = never, R2 = never>
  extends RouteGuard<P, O, E | RouteDecodeError, R | R2>
{
  readonly schema: Schema.Schema<O, A, R2>
}

/**
 * @since 1.0.0
 */
export const decode: {
  <I extends RouteInput<any, any, any, any>, A, R2>(
    schema: Schema.Schema<A, Types.NoInfer<Route.Output<I>>, R2>
  ): (
    input: I
  ) => RouteDecoder<Route.Path<I>, A, Route.Output<I>, Route.Error<I>, Route.Context<I>, R2>

  <P extends string, A, R2>(
    input: Route<P>,
    schema: Schema.Schema<A, Types.Simplify<typedPath.ParamsOf<P>>, R2>
  ): RouteDecoder<P, A, Types.Simplify<typedPath.ParamsOf<P>>, RouteDecodeError, never, R2>

  <P extends string, O = typedPath.ParamsOf<P>, E = never, R = never, A = never, R2 = never>(
    input: RouteInput<P, O, E, R>,
    schema: Schema.Schema<A, Types.NoInfer<O>, R2>
  ): RouteDecoder<P, A, O, E, R, R2>
} = dual(2, function decode<P extends string, O, E, R, A, R2>(
  input: RouteInput<P, O, E, R>,
  schema: Schema.Schema<A, O, R2>
): RouteDecoder<P, A, O, E, R, R2> {
  const g = asRouteGuard(input)
  return Object.assign(
    RouteGuard(
      g.route,
      Guard.catchAll(
        Guard.decode(g, schema),
        unify((e) =>
          e instanceof ParseResult.ParseError
            ? Effect.fail(RouteDecodeError(g.route, e))
            : Effect.fail(e as Exclude<E, ParseResult.ParseError>)
        )
      )
    ),
    { schema }
  )
})

/**
 * @since 1.0.0
 */
const let_: {
  <K extends PropertyKey, B>(
    key: K,
    value: B
  ): <P extends string, O, E = never, R = never>(
    input: RouteInput<P, O, E, R>
  ) => RouteGuard<P, O & { [k in K]: B }, E, R>

  <P extends string, O, E, R, K extends PropertyKey, B>(
    input: RouteInput<P, O, E, R>,
    key: K,
    value: B
  ): RouteGuard<P, O & { [k in K]: B }, E, R>
} = dual(3, function let_<P extends string, O, E, R, K extends PropertyKey, B>(
  input: RouteInput<P, O, E, R>,
  key: K,
  value: B
): RouteGuard<P, O & { [k in K]: B }, E, R> {
  return map(input, (a) => ({ ...a, [key]: value } as O & { [k in K]: B }))
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
  ): <P extends string, O, E = never, R = never>(
    input: RouteInput<P, O, E, R>
  ) => RouteGuard<P, O & { readonly _tag: B }, E, R>

  <P extends string, O, E, R, B>(
    input: RouteInput<P, O, E, R>,
    value: B
  ): RouteGuard<P, O & { readonly _tag: B }, E, R>
} = dual(2, function attachProperty<P extends string, O, E, R, B>(
  input: RouteInput<P, O, E, R>,
  value: B
): RouteGuard<P, O & { readonly _tag: B }, E, R> {
  return let_(input, "_tag", value)
})

/**
 * @since 1.0.0
 */
export const bind: {
  <P extends string, O, E, R, K extends PropertyKey, B, E2, R2>(
    key: K,
    f: Guard.GuardInput<O, B, E2, R2>
  ): (input: RouteInput<P, O, E, R>) => RouteGuard<P, O & { [k in K]: B }, E | E2, R | R2>

  <P extends string, O, E, R, K extends PropertyKey, B, E2, R2>(
    input: RouteInput<P, O, E, R>,
    key: K,
    f: Guard.GuardInput<O, B, E2, R2>
  ): RouteGuard<P, O & { [k in K]: B }, E | E2, R | R2>
} = dual(3, function bind<P extends string, O, E, R, K extends PropertyKey, B, E2, R2>(
  input: RouteInput<P, O, E, R>,
  key: K,
  f: Guard.GuardInput<O, B, E2, R2>
): RouteGuard<P, O & { [k in K]: B }, E | E2, R | R2> {
  const g = asRouteGuard(input)
  return RouteGuard(g.route, Guard.bind(g, key, f))
})

export function asRouteGuard<P extends string, A = typedPath.ParamsOf<P>, E = never, R = never>(
  route: RouteInput<P, A, E, R>
): RouteGuard<P, A, E, R> {
  return (isRoute<P>(route) ? RouteGuard(route, (i) => route(i)) : route) as RouteGuard<P, A, E, R>
}
