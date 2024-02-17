/**
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import * as Document from "@typed/dom/Document"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Destination, Navigation } from "@typed/navigation"
import { CurrentEntry, CurrentPath } from "@typed/navigation"
import type { Layer } from "effect"
import * as Option from "effect/Option"

import * as Effect from "effect/Effect"
import { dual, pipe } from "effect/Function"

import type { ParamsOf } from "@typed/path"
import * as Route from "@typed/route"

/**
 * @since 1.0.0
 */
export interface CurrentRoute<P extends string = string> {
  readonly route: Route.Route<P>
  readonly parent: Option.Option<CurrentRoute>
}

/**
 * @since 1.0.0
 */
export const CurrentRoute: Context.Tagged<CurrentRoute> = Context.Tagged<CurrentRoute>("@typed/router/CurrentRoute")

/**
 * @since 1.0.0
 */
export function make<const P extends string>(
  route: P | Route.Route<P>,
  parent: Option.Option<CurrentRoute> = Option.none()
): CurrentRoute<P> {
  return {
    route: getRoute(route),
    parent
  }
}

/**
 * @since 1.0.0
 */
export function layer<const P extends string>(
  route: P | Route.Route<P>,
  parent: Option.Option<CurrentRoute> = Option.none()
): Layer.Layer<CurrentRoute> {
  return CurrentRoute.layer(make(route as Route.Route<string>, parent))
}

function getRoute<P extends string>(route: P | Route.Route<P>): Route.Route<P> {
  return typeof route === "string" ? Route.fromPath(route) : route
}

/**
 * @since 1.0.0
 */
export const CurrentParams: RefSubject.Filtered<Navigation | CurrentRoute, never, Readonly<Record<string, string>>> =
  RefSubject
    .filterMapEffect(CurrentPath, (path) => CurrentRoute.with(({ route }) => route.match(path)))

/**
 * @since 1.0.0
 */
export const withCurrentRoute: {
  <P extends string>(
    route: Route.Route<P>
  ): <R, E, A>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, Exclude<R, CurrentRoute>>

  <R, E, A, P extends string>(
    effect: Effect.Effect<A, E, R>,
    route: Route.Route<P>
  ): Effect.Effect<A, E, Exclude<R, CurrentRoute>>
} = dual(2, <R, E, A, P extends string>(
  effect: Effect.Effect<A, E, R>,
  route: Route.Route<P>
): Effect.Effect<A, E, Exclude<R, CurrentRoute>> =>
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

/**
 * @since 1.0.0
 */
export function makeHref<const P extends string>(
  pathOrRoute: Route.Route<P> | P,
  ...params: [keyof ParamsOf<P>] extends [never] ? [{}?] : [ParamsOf<P>]
): RefSubject.Filtered<Navigation | CurrentRoute, never, string> {
  const route = typeof pathOrRoute === "string" ? Route.fromPath(pathOrRoute) : pathOrRoute

  return RefSubject.filterMapEffect(
    CurrentPath,
    (currentPath) =>
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
/**
 * @since 1.0.0
 */
export function isActive<const P extends string>(
  pathOrRoute: Route.Route<P> | P,
  ...params: [keyof ParamsOf<P>] extends [never] ? [{}?] : [ParamsOf<P>]
): RefSubject.Computed<Navigation | CurrentRoute, never, boolean> {
  const route = typeof pathOrRoute === "string" ? Route.fromPath(pathOrRoute) : pathOrRoute

  return RefSubject.mapEffect(
    CurrentPath,
    (currentPath) =>
      Effect.map(CurrentRoute, (currentRoute) => isActive_(currentPath, currentRoute.route, route, ...params))
  )
}

/**
 * @since 1.0.0
 */
export const browser: Layer.Layer<CurrentRoute, never, Document.Document> = CurrentRoute.layer(
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

/**
 * @since 1.0.0
 */
export const server = (base: string = "/"): Layer.Layer<CurrentRoute> =>
  CurrentRoute.layer({ route: Route.fromPath(base), parent: Option.none() })

const getSearchParams = (destination: Destination): Readonly<Record<string, string>> =>
  Object.fromEntries(destination.url.searchParams)

/**
 * @since 1.0.0
 */
export const CurrentSearchParams: RefSubject.Computed<Navigation, never, Readonly<Record<string, string>>> = RefSubject
  .map(CurrentEntry, getSearchParams)

/**
 * @since 1.0.0
 */
export const CurrentState = RefSubject.map(CurrentEntry, (d) => d.state)
