/**
 * @since 1.0.0
 */

import { type Fx, middleware } from "@typed/fx/Fx"
import type { RefSubject } from "@typed/fx/RefSubject"
import type { Guard } from "@typed/guard"
import type * as Route from "@typed/route"
import { flow } from "effect"
import { type CurrentRoute, withCurrentRoute } from "./CurrentRoute.js"
import type { MatchInput } from "./MatchInput.js"
import { asRouteGuard } from "./MatchInput.js"
import * as RouteGuard from "./RouteGuard.js"

/**
 * @since 1.0.0
 */
export interface RouteMatch<R extends Route.Route.Any, B, E2, R2, C, E3, R3>
  extends RouteGuard.RouteGuard<R, B, E2, R2>
{
  readonly match: (ref: RefSubject<B>) => Fx<C, E3, R3>
}

/**
 * @since 1.0.0
 */
export namespace RouteMatch {
  /**
   * @since 1.0.0
   */
  export type Any = RouteMatch<Route.Route.Any, any, any, any, any, any, any>

  /**
   * @since 1.0.0
   */
  export type Context<T> = T extends
    RouteMatch<infer _R, infer _B, infer _E2, infer _R2, infer _C, infer _E3, infer _R3> ? _R2 | _R3
    : never

  /**
   * @since 1.0.0
   */
  export type Error<T> = T extends RouteMatch<infer _R, infer _B, infer E2, infer _R2, infer _C, infer E3, infer _R3> ?
    E2 | E3
    : never

  /**
   * @since 1.0.0
   */
  export type Success<T> = T extends
    RouteMatch<infer _R, infer _B, infer _E2, infer _R2, infer C, infer _E3, infer _R3> ? C
    : never
}

/**
 * @since 1.0.0
 */
export function make<R extends Route.Route.Any, B, E2, R2, C, E3, R3>(
  route: R,
  guard: Guard<string, B, E2, R2>,
  match: (ref: RefSubject<B>) => Fx<C, E3, R3>
): RouteMatch<R, B, E2, R2, C, E3, Exclude<R3, CurrentRoute>> {
  return { route, guard, match: flow(match, middleware(withCurrentRoute(route))) }
}

/**
 * @since 1.0.0
 */
export function fromRoute<R extends Route.Route.Any, C, E3, R3>(
  route: R,
  match: (ref: RefSubject<Route.Route.Type<R>>) => Fx<C, E3, R3>
): RouteMatch<
  R,
  Route.Route.Type<R>,
  Route.RouteDecodeError<R>,
  Route.Route.Context<R>,
  C,
  E3,
  Exclude<R3, CurrentRoute>
> {
  const { guard } = RouteGuard.fromRoute(route)

  return make(route, guard, match)
}

/**
 * @since 1.0.0
 */
export function fromInput<I extends MatchInput.Any, A, E, R>(
  input: I,
  match: (ref: RefSubject<MatchInput.Success<I>>) => Fx<A, E, R>
): RouteMatch<
  MatchInput.Route<I>,
  MatchInput.Success<I>,
  MatchInput.Error<I>,
  MatchInput.Context<I>,
  A,
  E,
  Exclude<R, CurrentRoute>
> {
  const { guard, route } = asRouteGuard(input)

  return make(route, guard, match)
}
