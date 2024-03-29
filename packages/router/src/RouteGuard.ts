/**
 * @since 1.0.0
 */

import * as Guard from "@typed/guard"
import * as Route from "@typed/route"
import type { Option, Types } from "effect"
import { Effect, flow } from "effect"

/**
 * @since 1.0.0
 */
export interface RouteGuard<R extends Route.Route.Any, B, E2, R2> {
  readonly route: R
  readonly guard: Guard.Guard<string, B, E2, R2>
}

/**
 * @since 1.0.0
 */
export namespace RouteGuard {
  /**
   * @since 1.0.0
   */
  export type Any = RouteGuard<Route.Route.Any, any, any, any>

  /**
   * @since 1.0.0
   */
  export type Route<T> = T extends RouteGuard<infer _R, infer _B, infer _E2, infer _R2> ? T["route"] : never

  /**
   * @since 1.0.0
   */
  export type Context<T> = T extends RouteGuard<infer _R, infer _B, infer _E2, infer R2> ? R2 : never

  /**
   * @since 1.0.0
   */
  export type Error<T> = T extends RouteGuard<infer _R, infer _B, infer E2, infer _R2> ? E2 : never

  /**
   * @since 1.0.0
   */
  export type Success<T> = T extends RouteGuard<infer _R, infer B, infer _E2, infer _R2> ? B : never

  /**
   * @since 1.0.0
   */
  export type UpdateSuccess<R extends RouteGuard.Any, B> = RouteGuard<
    Route<R>,
    B,
    Route.RouteDecodeError<Route<R>>,
    Route.Route.Context<Route<R>>
  >
}

/**
 * @since 1.0.0
 */
export function make<R extends Route.Route.Any, B, E2, R2>(
  route: R,
  guard: Guard.Guard<string, B, E2, R2>
): RouteGuard<R, B, E2, R2> {
  return { route, guard }
}

/**
 * @since 1.0.0
 */
export function fromRoute<R extends Route.Route.Any>(
  route: R
): RouteGuard<R, Route.Route.Type<R>, Route.RouteDecodeError<R>, Route.Route.Context<R>> {
  return make(route, flow(Route.decode_(route), Effect.optionFromOptional))
}

/**
 * @since 1.0.0
 */
export function map<R extends RouteGuard.Any, C>(
  self: R,
  f: (b: Types.NoInfer<RouteGuard.Success<R>>) => C
): RouteGuard<RouteGuard.Route<R>, C, RouteGuard.Error<R>, RouteGuard.Context<R>> {
  return make(self.route, Guard.map(self.guard, f)) as any
}

/**
 * @since 1.0.0
 */
export function mapEffect<R extends RouteGuard.Any, C, E3, R3>(
  self: R,
  f: (b: Types.NoInfer<RouteGuard.Success<R>>) => Effect.Effect<C, E3, R3>
): RouteGuard<RouteGuard.Route<R>, C, RouteGuard.Error<R> | E3, RouteGuard.Context<R> | R3> {
  return make(self.route, Guard.mapEffect(self.guard, f)) as any
}

/**
 * @since 1.0.0
 */
export function filter<R extends RouteGuard.Any>(
  self: R,
  f: (b: Types.NoInfer<RouteGuard.Success<R>>) => boolean
): R {
  return make(self.route, Guard.filter(self.guard, f)) as any
}

/**
 * @since 1.0.0
 */
export function filterMap<R extends RouteGuard.Any, C>(
  self: R,
  f: (b: Types.NoInfer<RouteGuard.Success<R>>) => Option.Option<C>
): RouteGuard<RouteGuard.Route<R>, C, RouteGuard.Error<R>, RouteGuard.Context<R>> {
  return make(self.route, Guard.filterMap(self.guard, f)) as any
}

/**
 * @since 1.0.0
 */
export function flatMap<R extends RouteGuard.Any, C, E3, R3>(
  self: R,
  guard: Guard.Guard<RouteGuard.Success<R>, C, E3, R3>
): RouteGuard<RouteGuard.Route<R>, C, RouteGuard.Error<R> | E3, RouteGuard.Context<R> | R3> {
  return make(self.route, Guard.compose(self.guard, guard)) as any
}
