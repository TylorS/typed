import * as Context from "@typed/context"
import type { Filtered } from "@typed/fx/Filtered"
import type { Navigation } from "@typed/navigation"
import { CurrentPath } from "@typed/navigation"
import { Effect, Option, pipe } from "effect"
import { dual } from "effect/Function"

import type * as Computed from "@typed/fx/Computed"
import type { ParamsOf } from "@typed/path"
import * as Route from "@typed/route"

export interface CurrentRoute<P extends string = string> {
  readonly route: Route.Route<P>
  readonly parent: Option.Option<CurrentRoute>
}

export const CurrentRoute: Context.Tagged<CurrentRoute> = Context.Tagged<CurrentRoute>("@typed/router/CurrentRoute")

export function make<P extends string>(
  route: Route.Route<P>,
  parent: Option.Option<CurrentRoute> = Option.none()
): CurrentRoute<P> {
  return {
    route,
    parent
  }
}

export const CurrentParams: Filtered<Navigation | CurrentRoute, never, Readonly<Record<string, string>>> = CurrentPath
  .filterMapEffect((path) => CurrentRoute.with(({ route }) => route.match(path)))

export const withCurrentRoute: {
  <P extends string>(
    route: Route.Route<P>
  ): <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<Exclude<R, CurrentRoute<string>>, E, A>

  <R, E, A, P extends string>(
    effect: Effect.Effect<R, E, A>,
    route: Route.Route<P>
  ): Effect.Effect<Exclude<R, CurrentRoute<string>>, E, A>
} = dual(2, <R, E, A, P extends string>(
  effect: Effect.Effect<R, E, A>,
  route: Route.Route<P>
): Effect.Effect<Exclude<R, CurrentRoute>, E, A> =>
  Effect.contextWithEffect((ctx) => {
    const parent = Context.getOption(ctx, CurrentRoute)

    if (Option.isNone(parent)) return pipe(effect, CurrentRoute.provide(make(route) as CurrentRoute))

    return pipe(
      effect,
      CurrentRoute.provide(make(parent.value.route.concat(route), parent) as CurrentRoute)
    )
  }))

export function makeHref<const P extends string>(
  pathOrRoute: Route.Route<P> | P,
  ...[params]: [keyof ParamsOf<P>] extends [never] ? [{}?] : [ParamsOf<P>]
): Filtered<Navigation | CurrentRoute, never, string> {
  const route = typeof pathOrRoute === "string" ? Route.fromPath(pathOrRoute) : pathOrRoute

  return CurrentPath.filterMapEffect((currentPath) =>
    Effect.gen(function*(_) {
      const currentRoute = yield* _(CurrentRoute)
      const currentMatch = currentRoute.route.match(currentPath)

      if (Option.isNone(currentMatch)) return Option.none()

      const fullRoute = currentRoute.route.concat(route)
      const fullParams = { ...currentMatch.value, ...params }

      return Option.some(fullRoute.make(fullParams as any))
    })
  )
}

export function isActive<const P extends string>(
  pathOrRoute: Route.Route<P> | P,
  ...[params]: [keyof ParamsOf<P>] extends [never] ? [{}?] : [ParamsOf<P>]
): Computed.Computed<Navigation | CurrentRoute, never, boolean> {
  const route = typeof pathOrRoute === "string" ? Route.fromPath(pathOrRoute) : pathOrRoute

  return CurrentPath.mapEffect((currentPath) =>
    Effect.gen(function*(_) {
      const currentRoute = yield* _(CurrentRoute)
      const currentMatch = currentRoute.route.match(currentPath)

      if (Option.isNone(currentMatch)) return false

      const fullRoute = currentRoute.route.concat(route)
      const fullParams = { ...currentMatch.value, ...params }
      const fullPath = fullRoute.make(fullParams as any)

      return fullPath === currentPath || currentPath.startsWith(fullPath)
    })
  )
}
