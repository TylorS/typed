/**
 * @since 1.0.0
 */

import * as Guard from "@typed/guard"
import * as Route from "@typed/route"
import * as Effect from "effect/Effect"
import { dual, flow } from "effect/Function"
import * as Option from "effect/Option"

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
    Route.RouteDecodeError<R["route"]>,
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
export const map: {
  <R extends RouteGuard.Any, C>(
    f: (b: NoInfer<RouteGuard.Success<R>>) => C
  ): (self: R) => RouteGuard<RouteGuard.Route<R>, C, RouteGuard.Error<R>, RouteGuard.Context<R>>

  <R extends RouteGuard.Any, C>(
    self: R,
    f: (b: NoInfer<RouteGuard.Success<R>>) => C
  ): RouteGuard<RouteGuard.Route<R>, C, RouteGuard.Error<R>, RouteGuard.Context<R>>
} = dual(2, function map<R extends RouteGuard.Any, C>(
  self: R,
  f: (b: NoInfer<RouteGuard.Success<R>>) => C
): RouteGuard<RouteGuard.Route<R>, C, RouteGuard.Error<R>, RouteGuard.Context<R>> {
  return make(self.route, Guard.map(self.guard, f)) as any
})

/**
 * @since 1.0.0
 */
export const mapEffect: {
  <R extends RouteGuard.Any, C, E3, R3>(
    f: (b: NoInfer<RouteGuard.Success<R>>) => Effect.Effect<C, E3, R3>
  ): (self: R) => RouteGuard<RouteGuard.Route<R>, C, E3 | RouteGuard.Error<R>, R3 | RouteGuard.Context<R>>

  <R extends RouteGuard.Any, C, E3, R3>(
    self: R,
    f: (b: NoInfer<RouteGuard.Success<R>>) => Effect.Effect<C, E3, R3>
  ): RouteGuard<RouteGuard.Route<R>, C, E3 | RouteGuard.Error<R>, R3 | RouteGuard.Context<R>>
} = dual(2, function mapEffect<R extends RouteGuard.Any, C, E3, R3>(
  self: R,
  f: (b: NoInfer<RouteGuard.Success<R>>) => Effect.Effect<C, E3, R3>
): RouteGuard<RouteGuard.Route<R>, C, RouteGuard.Error<R> | E3, RouteGuard.Context<R> | R3> {
  return make(self.route, Guard.mapEffect(self.guard, f)) as any
})

/**
 * @since 1.0.0
 */
export const filter: {
  <R extends RouteGuard.Any>(f: (b: NoInfer<RouteGuard.Success<R>>) => boolean): (self: R) => R
  <R extends RouteGuard.Any>(self: R, f: (b: NoInfer<RouteGuard.Success<R>>) => boolean): R
} = dual(2, function filter<R extends RouteGuard.Any>(
  self: R,
  f: (b: NoInfer<RouteGuard.Success<R>>) => boolean
): R {
  return make(self.route, Guard.filter(self.guard, f)) as any
})

/**
 * @since 1.0.0
 */
export const filterMap: {
  <R extends RouteGuard.Any, C>(
    f: (b: NoInfer<RouteGuard.Success<R>>) => Option.Option<C>
  ): (self: R) => RouteGuard<RouteGuard.Route<R>, C, RouteGuard.Error<R>, RouteGuard.Context<R>>

  <R extends RouteGuard.Any, C>(
    self: R,
    f: (b: NoInfer<RouteGuard.Success<R>>) => Option.Option<C>
  ): RouteGuard<RouteGuard.Route<R>, C, RouteGuard.Error<R>, RouteGuard.Context<R>>
} = dual(2, function filterMap<R extends RouteGuard.Any, C>(
  self: R,
  f: (b: NoInfer<RouteGuard.Success<R>>) => Option.Option<C>
): RouteGuard<RouteGuard.Route<R>, C, RouteGuard.Error<R>, RouteGuard.Context<R>> {
  return make(self.route, Guard.filterMap(self.guard, f)) as any
})

/**
 * @since 1.0.0
 */
export const flatMap: {
  <R extends RouteGuard.Any, C, E3, R3>(
    guard: Guard.Guard<RouteGuard.Success<R>, C, E3, R3>
  ): (self: R) => RouteGuard<RouteGuard.Route<R>, C, E3 | RouteGuard.Error<R>, R3 | RouteGuard.Context<R>>

  <R extends RouteGuard.Any, C, E3, R3>(
    self: R,
    guard: Guard.Guard<RouteGuard.Success<R>, C, E3, R3>
  ): RouteGuard<RouteGuard.Route<R>, C, E3 | RouteGuard.Error<R>, R3 | RouteGuard.Context<R>>
} = dual(2, function flatMap<R extends RouteGuard.Any, C, E3, R3>(
  self: R,
  guard: Guard.Guard<RouteGuard.Success<R>, C, E3, R3>
): RouteGuard<RouteGuard.Route<R>, C, RouteGuard.Error<R> | E3, RouteGuard.Context<R> | R3> {
  return make(self.route, Guard.compose(self.guard, guard)) as any
})

/**
 * @since 1.0.0
 */
export const concat: {
  <R extends RouteGuard.Any>(
    other: R
  ): <L extends RouteGuard.Any>(self: L) => RouteGuard<
    Route.Route.Concat<RouteGuard.Route<L>, RouteGuard.Route<R>>,
    RouteGuard.Success<L> & RouteGuard.Success<R>,
    RouteGuard.Error<L> | RouteGuard.Error<R>,
    RouteGuard.Context<L> | RouteGuard.Context<R>
  >

  <L extends RouteGuard.Any, R extends RouteGuard.Any>(
    self: L,
    other: R
  ): RouteGuard<
    Route.Route.Concat<RouteGuard.Route<L>, RouteGuard.Route<R>>,
    RouteGuard.Success<L> & RouteGuard.Success<R>,
    RouteGuard.Error<L> | RouteGuard.Error<R>,
    RouteGuard.Context<L> | RouteGuard.Context<R>
  >
} = dual(2, function concat<L extends RouteGuard.Any, R extends RouteGuard.Any>(
  self: L,
  other: R
): RouteGuard<
  Route.Route.Concat<RouteGuard.Route<L>, RouteGuard.Route<R>>,
  RouteGuard.Success<L> & RouteGuard.Success<R>,
  RouteGuard.Error<L> | RouteGuard.Error<R>,
  RouteGuard.Context<L> | RouteGuard.Context<R>
> {
  return make<
    Route.Route.Concat<RouteGuard.Route<L>, RouteGuard.Route<R>>,
    RouteGuard.Success<L> & RouteGuard.Success<R>,
    RouteGuard.Error<L> | RouteGuard.Error<R>,
    RouteGuard.Context<L> | RouteGuard.Context<R>
  >(
    Route.concat(self.route, other.route) as any,
    (input) =>
      Effect.gen(function*() {
        const aParams = self.route.match(input)
        if (Option.isNone(aParams)) return Option.none()
        const aGuardParams = yield* self.guard(input)
        if (Option.isNone(aGuardParams)) return Option.none()
        const aBasePath = self.route.interpolate(aParams)
        const bPath = input.replace(aBasePath, "")
        const bGuardParams = yield* other.guard(bPath)
        if (Option.isNone(bGuardParams)) return Option.none()
        return Option.some({ ...aGuardParams.value, ...bGuardParams.value } as any)
      })
  )
})
