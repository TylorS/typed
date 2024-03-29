/**
 * @since 1.0.0
 */

import type * as Schema from "@effect/schema/Schema"
import type { Guard } from "@typed/guard"
import * as Route from "@typed/route"
import type { Effect, Option } from "effect"
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
export function map<I extends MatchInput.Any, A>(
  input: I,
  f: (a: MatchInput.Success<I>) => A
): RouteGuard.RouteGuard<MatchInput.Route<I>, A, MatchInput.Error<I>, MatchInput.Context<I>> {
  return RouteGuard.map(asRouteGuard<I>(input), f) as any
}

/**
 * @since 1.0.0
 */
export function mapEffect<I extends MatchInput.Any, A, E2, R2>(
  input: I,
  f: (a: MatchInput.Success<I>) => Effect.Effect<A, E2, R2>
): RouteGuard.RouteGuard<MatchInput.Route<I>, A, MatchInput.Error<I> | E2, MatchInput.Context<I> | R2> {
  return RouteGuard.mapEffect(asRouteGuard<I>(input), f) as any
}

/**
 * @since 1.0.0
 */
export function filter<I extends MatchInput.Any>(
  input: I,
  f: (a: MatchInput.Success<I>) => boolean
): RouteGuard.RouteGuard<MatchInput.Route<I>, MatchInput.Success<I>, MatchInput.Error<I>, MatchInput.Context<I>> {
  return RouteGuard.filter(asRouteGuard<I>(input), f) as any
}

/**
 * @since 1.0.0
 */
export function filterMap<I extends MatchInput.Any, A>(
  input: I,
  f: (a: MatchInput.Success<I>) => Option.Option<A>
): RouteGuard.RouteGuard<MatchInput.Route<I>, A, MatchInput.Error<I>, MatchInput.Context<I>> {
  return RouteGuard.filterMap(asRouteGuard<I>(input), f) as any
}

/**
 * @since 1.0.0
 */
export function flatMap<I extends MatchInput.Any, A, E2, R2>(
  input: I,
  guard: Guard<MatchInput.Success<I>, A, E2, R2>
): RouteGuard.RouteGuard<MatchInput.Route<I>, A, MatchInput.Error<I> | E2, MatchInput.Context<I> | R2> {
  // @ts-expect-error
  return RouteGuard.flatMap(asRouteGuard<I>(input), guard) as any
}
