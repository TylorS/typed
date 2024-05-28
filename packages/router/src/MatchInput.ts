/**
 * @since 1.0.0
 */

import type * as Schema from "@effect/schema/Schema"
import type { Guard } from "@typed/guard"
import type * as _Path from "@typed/path"
import * as Route from "@typed/route"
import type * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import type * as Option from "effect/Option"
import * as RouteGuard from "./RouteGuard.js"

/**
 * @since 1.0.0
 */
export type MatchInput<
  P extends string,
  S extends Schema.Schema.All,
  A = never,
  E = never,
  R = never
> = Route.Route<P, S> | RouteGuard.RouteGuard<Route.Route<P, S>, A, E, R>

/**
 * @since 1.0.0
 */
export namespace MatchInput {
  /**
   * @since 1.0.0
   */
  export type Any = MatchInput<any, any, any, any, any> | MatchInput<any, never, any, any, any>

  /**
   * @since 1.0.0
   */
  export type Route<T> = T extends Route.Route<infer P, infer S> ? Route.Route<P, S>
    : T extends RouteGuard.RouteGuard<Route.Route<infer P, infer S>, infer _A, infer _E, infer _R> ? Route.Route<P, S>
    : never

  /**
   * @since 1.0.0
   */
  export type Path<T> = _Path.PathJoin<[Route.Route.Path<Route<T>>]>

  /**
   * @since 1.0.0
   */
  export type ParamsOf<T> = Route.Route.Params<Route<T>>

  /**
   * @since 1.0.0
   */
  export type HasParams<T> = Route<T> extends Route.Route<infer P, infer _> ? _Path.HasParams<P> : false

  /**
   * @since 1.0.0
   */
  export type HasPathParams<T> = Route<T> extends Route.Route<infer P, infer _>
    ? P extends `${infer P2}\\?${infer _}` ? _Path.HasParams<P2> : _Path.HasParams<P>
    : false

  /**
   * @since 1.0.0
   */
  export type HasQueryParams<T> = Route<T> extends Route.Route<infer P, infer _>
    ? P extends `${infer _}\\?${infer P2}` ? _Path.HasParams<`\\?${P2}`> : false
    : false

  /**
   * @since 1.0.0
   */
  export type Success<T> = T extends Route.Route<infer _P, infer _S> ? Route.Route.Type<T>
    : T extends RouteGuard.RouteGuard<Route.Route<infer _P, infer _S>, infer A, infer _E, infer _R> ? A
    : never

  /**
   * @since 1.0.0
   */
  export type Error<T> = T extends Route.Route<infer _P, infer _S> ? Route.RouteDecodeError<T>
    : T extends RouteGuard.RouteGuard<Route.Route<infer _P, infer _S>, infer _A, infer E, infer _R> ? E
    : never

  /**
   * @since 1.0.0
   */
  export type Context<T> = T extends Route.Route<infer _P, infer _S> ? Route.Route.Context<T>
    : T extends RouteGuard.RouteGuard<Route.Route<infer _P, infer _S>, infer _A, infer _E, infer R> ? R
    : never

  /**
   * @since 1.0.0
   */
  export type Schema<T> = Route.Route.Schema<MatchInput.Route<T>>

  /**
   * @since 1.0.0
   */
  export type PathSchema<T> = Route.Route.PathSchema<MatchInput.Route<T>>

  /**
   * @since 1.0.0
   */
  export type QuerySchema<T> = Route.Route.QuerySchema<MatchInput.Route<T>>
}

/**
 * @since 1.0.0
 */
export function asRouteGuard<I extends MatchInput.Any>(
  input: I
): RouteGuard.RouteGuard<MatchInput.Route<I>, MatchInput.Success<I>, MatchInput.Error<I>, MatchInput.Context<I>> {
  return Route.isRoute(input) ? RouteGuard.fromRoute(input) as any : input
}

/**
 * @since 1.0.0
 */
export const map: {
  <I extends MatchInput.Any, A>(
    f: (a: MatchInput.Success<I>) => A
  ): (input: I) => RouteGuard.RouteGuard<MatchInput.Route<I>, A, MatchInput.Error<I>, MatchInput.Context<I>>

  <I extends MatchInput.Any, A>(
    input: I,
    f: (a: MatchInput.Success<I>) => A
  ): RouteGuard.RouteGuard<MatchInput.Route<I>, A, MatchInput.Error<I>, MatchInput.Context<I>>
} = dual(2, function map<I extends MatchInput.Any, A>(
  input: I,
  f: (a: MatchInput.Success<I>) => A
): RouteGuard.RouteGuard<MatchInput.Route<I>, A, MatchInput.Error<I>, MatchInput.Context<I>> {
  return RouteGuard.map<
    RouteGuard.RouteGuard<MatchInput.Route<I>, MatchInput.Success<I>, MatchInput.Error<I>, MatchInput.Context<I>>,
    A
  >(asRouteGuard<I>(input), f)
})

/**
 * @since 1.0.0
 */
export const mapEffect: {
  <I extends MatchInput.Any, A, E2, R2>(
    f: (a: MatchInput.Success<I>) => Effect.Effect<A, E2, R2>
  ): (input: I) => RouteGuard.RouteGuard<MatchInput.Route<I>, A, E2 | MatchInput.Error<I>, R2 | MatchInput.Context<I>>

  <I extends MatchInput.Any, A, E2, R2>(
    input: I,
    f: (a: MatchInput.Success<I>) => Effect.Effect<A, E2, R2>
  ): RouteGuard.RouteGuard<MatchInput.Route<I>, A, E2 | MatchInput.Error<I>, R2 | MatchInput.Context<I>>
} = dual(2, function mapEffect<I extends MatchInput.Any, A, E2, R2>(
  input: I,
  f: (a: MatchInput.Success<I>) => Effect.Effect<A, E2, R2>
): RouteGuard.RouteGuard<MatchInput.Route<I>, A, MatchInput.Error<I> | E2, MatchInput.Context<I> | R2> {
  return RouteGuard.mapEffect<
    RouteGuard.RouteGuard<MatchInput.Route<I>, MatchInput.Success<I>, MatchInput.Error<I>, MatchInput.Context<I>>,
    A,
    E2,
    R2
  >(asRouteGuard<I>(input), f)
})

/**
 * @since 1.0.0
 */
export const filter: {
  <I extends MatchInput.Any>(
    f: (a: MatchInput.Success<I>) => boolean
  ): (
    input: I
  ) => RouteGuard.RouteGuard<MatchInput.Route<I>, MatchInput.Success<I>, MatchInput.Error<I>, MatchInput.Context<I>>

  <I extends MatchInput.Any>(
    input: I,
    f: (a: MatchInput.Success<I>) => boolean
  ): RouteGuard.RouteGuard<MatchInput.Route<I>, MatchInput.Success<I>, MatchInput.Error<I>, MatchInput.Context<I>>
} = dual(2, function filter<I extends MatchInput.Any>(
  input: I,
  f: (a: MatchInput.Success<I>) => boolean
): RouteGuard.RouteGuard<MatchInput.Route<I>, MatchInput.Success<I>, MatchInput.Error<I>, MatchInput.Context<I>> {
  return RouteGuard.filter<
    RouteGuard.RouteGuard<MatchInput.Route<I>, MatchInput.Success<I>, MatchInput.Error<I>, MatchInput.Context<I>>
  >(asRouteGuard<I>(input), f)
})

/**
 * @since 1.0.0
 */
export const filterMap: {
  <I extends MatchInput.Any, A>(
    f: (a: MatchInput.Success<I>) => Option.Option<A>
  ): (input: I) => RouteGuard.RouteGuard<MatchInput.Route<I>, A, MatchInput.Error<I>, MatchInput.Context<I>>

  <I extends MatchInput.Any, A>(
    input: I,
    f: (a: MatchInput.Success<I>) => Option.Option<A>
  ): RouteGuard.RouteGuard<MatchInput.Route<I>, A, MatchInput.Error<I>, MatchInput.Context<I>>
} = dual(2, function filterMap<I extends MatchInput.Any, A>(
  input: I,
  f: (a: MatchInput.Success<I>) => Option.Option<A>
): RouteGuard.RouteGuard<MatchInput.Route<I>, A, MatchInput.Error<I>, MatchInput.Context<I>> {
  return RouteGuard.filterMap<
    RouteGuard.RouteGuard<MatchInput.Route<I>, MatchInput.Success<I>, MatchInput.Error<I>, MatchInput.Context<I>>,
    A
  >(asRouteGuard<I>(input), f)
})

/**
 * @since 1.0.0
 */
export const flatMap: {
  <I extends MatchInput.Any, A, E2, R2>(
    guard: Guard<MatchInput.Success<I>, A, E2, R2>
  ): (input: I) => RouteGuard.RouteGuard<MatchInput.Route<I>, A, E2 | MatchInput.Error<I>, R2 | MatchInput.Context<I>>

  <I extends MatchInput.Any, A, E2, R2>(
    input: I,
    guard: Guard<MatchInput.Success<I>, A, E2, R2>
  ): RouteGuard.RouteGuard<MatchInput.Route<I>, A, E2 | MatchInput.Error<I>, R2 | MatchInput.Context<I>>
} = dual(2, function flatMap<I extends MatchInput.Any, A, E2, R2>(
  input: I,
  guard: Guard<MatchInput.Success<I>, A, E2, R2>
): RouteGuard.RouteGuard<MatchInput.Route<I>, A, MatchInput.Error<I> | E2, MatchInput.Context<I> | R2> {
  return RouteGuard.flatMap<
    RouteGuard.RouteGuard<MatchInput.Route<I>, MatchInput.Success<I>, MatchInput.Error<I>, MatchInput.Context<I>>,
    A,
    E2,
    R2
  >(asRouteGuard<I>(input), guard)
})

/**
 * @since 1.0.0
 */
export function concat<L extends MatchInput.Any, R extends MatchInput.Any>(
  left: L,
  right: R
): RouteGuard.RouteGuard<
  Route.Route.Concat<MatchInput.Route<L>, MatchInput.Route<R>>,
  MatchInput.Success<L> & MatchInput.Success<R>,
  MatchInput.Error<L> | MatchInput.Error<R>,
  MatchInput.Context<L> | MatchInput.Context<R>
> {
  return RouteGuard.concat<
    RouteGuard.RouteGuard<MatchInput.Route<L>, MatchInput.Success<L>, MatchInput.Error<L>, MatchInput.Context<L>>,
    RouteGuard.RouteGuard<MatchInput.Route<R>, MatchInput.Success<R>, MatchInput.Error<R>, MatchInput.Context<R>>
  >(asRouteGuard<L>(left), asRouteGuard<R>(right))
}

/**
 * @since 1.0.0
 */
export function getRoute<I extends MatchInput.Any>(input: I): MatchInput.Route<I> {
  return asRouteGuard<I>(input).route
}

/**
 * @since 1.0.0
 */
export function getSchema<I extends MatchInput.Any>(input: I): MatchInput.Schema<I> {
  return asRouteGuard<I>(input).route.schema
}

/**
 * @since 1.0.0
 */
export function getPathSchema<I extends MatchInput.Any>(input: I): MatchInput.PathSchema<I> {
  return asRouteGuard<I>(input).route.pathSchema as MatchInput.PathSchema<I>
}

/**
 * @since 1.0.0
 */
export function getQuerySchema<I extends MatchInput.Any>(input: I): MatchInput.QuerySchema<I> {
  return asRouteGuard<I>(input).route.querySchema as MatchInput.QuerySchema<I>
}

/**
 * @since 1.0.0
 */
export function getPath<I extends MatchInput.Any>(input: I): MatchInput.Path<I> {
  return asRouteGuard<I>(input).route.path as MatchInput.Path<I>
}
