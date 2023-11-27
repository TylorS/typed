import * as Context from "@typed/context"
import * as Document from "@typed/dom/Document"
import type { Filtered } from "@typed/fx/Filtered"
import type { Destination, Navigation } from "@typed/navigation"
import { CurrentEntry, CurrentPath } from "@typed/navigation"
import type { Layer } from "effect"
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
  ): <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<Exclude<R, CurrentRoute>, E, A>

  <R, E, A, P extends string>(
    effect: Effect.Effect<R, E, A>,
    route: Route.Route<P>
  ): Effect.Effect<Exclude<R, CurrentRoute>, E, A>
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

const makeHref_ = <P extends string, P2 extends string>(
  currentPath: string,
  currentRoute: Route.Route<P>,
  route: Route.Route<P2>,
  ...[params]: [keyof ParamsOf<P2>] extends [never] ? [{}?] : [ParamsOf<P2>]
) => {
  const currentMatch = currentRoute.match(currentPath)
  if (Option.isNone(currentMatch)) return Option.none()

  const fullRoute = currentRoute.concat(route)
  const fullParams = { ...currentMatch.value, ...params }

  return Option.some(fullRoute.make(fullParams as any))
}

export function makeHref<const P extends string>(
  pathOrRoute: Route.Route<P> | P,
  ...params: [keyof ParamsOf<P>] extends [never] ? [{}?] : [ParamsOf<P>]
): Filtered<Navigation | CurrentRoute, never, string> {
  const route = typeof pathOrRoute === "string" ? Route.fromPath(pathOrRoute) : pathOrRoute

  return CurrentPath.filterMapEffect((currentPath) =>
    Effect.map(CurrentRoute, (currentRoute) => makeHref_(currentPath, currentRoute.route, route, ...params))
  )
}

const isActive_ = <P extends string, P2 extends string>(
  currentPath: string,
  currentRoute: Route.Route<P>,
  route: Route.Route<P2>,
  ...params: [keyof ParamsOf<P2>] extends [never] ? [{}?] : [ParamsOf<P2>]
) => {
  const currentMatch = currentRoute.match(currentPath)

  if (Option.isNone(currentMatch)) return false

  const fullRoute = currentRoute.concat(route)
  const fullParams = { ...currentMatch.value, ...params }
  const fullPath = fullRoute.make(fullParams as any)

  return fullPath === currentPath || currentPath.startsWith(fullPath)
}
export function isActive<const P extends string>(
  pathOrRoute: Route.Route<P> | P,
  ...params: [keyof ParamsOf<P>] extends [never] ? [{}?] : [ParamsOf<P>]
): Computed.Computed<Navigation | CurrentRoute, never, boolean> {
  const route = typeof pathOrRoute === "string" ? Route.fromPath(pathOrRoute) : pathOrRoute

  return CurrentPath.mapEffect((currentPath) =>
    Effect.map(CurrentRoute, (currentRoute) => isActive_(currentPath, currentRoute.route, route, ...params))
  )
}

export const browser: Layer.Layer<Document.Document, never, CurrentRoute> = CurrentRoute.layer(
  Effect.gen(function*(_) {
    const document = yield* _(Document.Document)
    const base = document.querySelector("base")
    const baseHref = base ? base.href : "/"

    return {
      route: Route.fromPath(baseHref),
      parent: Option.none()
    }
  })
)

export const server = (base: string = "/"): Layer.Layer<never, never, CurrentRoute> =>
  CurrentRoute.layer({ route: Route.fromPath(base), parent: Option.none() })

const getSearchParams = (destination: Destination): Readonly<Record<string, string>> =>
  Object.fromEntries(destination.url.searchParams)

export const CurrentSearchParams: Computed.Computed<Navigation, never, Readonly<Record<string, string>>> = CurrentEntry
  .map(getSearchParams)

export const CurrentState = CurrentEntry.map((d) => d.state)
