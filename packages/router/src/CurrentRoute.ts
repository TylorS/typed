/**
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import * as Document from "@typed/dom/Document"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Destination } from "@typed/navigation"
import { CurrentEntry, CurrentPath, getCurrentPathFromUrl, Navigation } from "@typed/navigation"
import type { Layer } from "effect"
import * as Option from "effect/Option"

import * as Effect from "effect/Effect"
import { dual, pipe } from "effect/Function"

import * as Route from "@typed/route"

/**
 * @since 1.0.0
 */
export interface CurrentRoute {
  readonly route: Route.Route.Any
  readonly parent: Option.Option<CurrentRoute>
}

/**
 * @since 1.0.0
 */
export const CurrentRoute: Context.Tagged<CurrentRoute> = Context.Tagged<CurrentRoute>("@typed/router/CurrentRoute")

/**
 * @since 1.0.0
 */
export function make<R extends Route.Route.Any>(
  route: R,
  parent: Option.Option<CurrentRoute> = Option.none()
): CurrentRoute {
  return {
    route,
    parent
  }
}

/**
 * @since 1.0.0
 */
export function layer<R extends Route.Route.Any>(
  route: R,
  parent: Option.Option<CurrentRoute> = Option.none()
): Layer.Layer<CurrentRoute> {
  return CurrentRoute.layer(make(route, parent))
}

/**
 * @since 1.0.0
 */
export const CurrentParams: RefSubject.Filtered<
  Readonly<Record<string, string | ReadonlyArray<string>>>,
  never,
  Navigation | CurrentRoute
> = RefSubject
  .filteredFromTag(
    Navigation,
    (nav) =>
      RefSubject.filterMapEffect(
        nav.currentEntry,
        (e) => CurrentRoute.with(({ route }) => route.match(getCurrentPathFromUrl(e.url)))
      )
  )

/**
 * @since 1.0.0
 */
export const withCurrentRoute: {
  <P extends string>(
    route: Route.Route<P>
  ): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, Exclude<R, CurrentRoute>>

  <A, E, R, P extends string>(
    effect: Effect.Effect<A, E, R>,
    route: Route.Route<P>
  ): Effect.Effect<A, E, Exclude<R, CurrentRoute>>
} = dual(2, <A, E, R, P extends string>(
  effect: Effect.Effect<A, E, R>,
  route: Route.Route<P>
): Effect.Effect<A, E, Exclude<R, CurrentRoute>> =>
  Effect.contextWithEffect((ctx) => {
    const parent = Context.getOption(ctx, CurrentRoute)

    if (Option.isNone(parent)) return pipe(effect, CurrentRoute.provide(make(route) as any as CurrentRoute))

    return pipe(
      effect,
      CurrentRoute.provide(make(parent.value.route.concat(route), parent) as CurrentRoute)
    )
  }))

const makeHref_ = (
  currentPath: string,
  currentRoute: Route.Route.Any,
  route: Route.Route.Any,
  params: Route.Route.Params<typeof route>
): Option.Option<string> => {
  const currentMatch = currentRoute.match(currentPath)
  if (Option.isNone(currentMatch)) return Option.none()

  const fullRoute = currentRoute.concat(route)
  const fullParams = { ...currentMatch.value, ...params }

  return Option.some(fullRoute.interpolate(fullParams as any))
}

/**
 * @since 1.0.0
 */
export function makeHref<const R extends Route.Route.Any>(
  route: R,
  params: Route.Route.Params<R>
): RefSubject.Filtered<string, never, Navigation | CurrentRoute> {
  return RefSubject.filterMapEffect(
    CurrentPath,
    (currentPath) =>
      Effect.map(
        CurrentRoute,
        (currentRoute): Option.Option<string> => makeHref_(currentPath, currentRoute.route, route, params)
      )
  )
}

const isActive_ = (
  currentPath: string,
  currentRoute: Route.Route.Any,
  route: Route.Route.Any,
  params: Route.Route.Params<typeof route>
): boolean => {
  const currentMatch = currentRoute.match(currentPath)

  if (Option.isNone(currentMatch)) return false

  const fullRoute = currentRoute.concat(route)

  if (fullRoute.path === "/") return currentPath === "/"

  const fullParams = { ...currentMatch.value, ...params }
  const fullPath = fullRoute.interpolate(fullParams as any)

  return fullPath === currentPath || currentPath.startsWith(fullPath)
}
/**
 * @since 1.0.0
 */
export function isActive<R extends Route.Route.Any>(
  route: R,
  params: Route.Route.Params<R>
): RefSubject.Computed<boolean, never, Navigation | CurrentRoute> {
  return RefSubject.mapEffect(
    CurrentPath,
    (currentPath) =>
      Effect.map(
        CurrentRoute,
        (currentRoute): boolean => isActive_(currentPath, currentRoute.route, route, params)
      )
  )
}

/**
 * @since 1.0.0
 */
export const browser: Layer.Layer<CurrentRoute, never, Document.Document> = CurrentRoute.layer(
  Effect.gen(function*(_) {
    const document = yield* _(Document.Document)
    const base = document.querySelector("base")
    const baseHref = base ? getBasePathname(base.href) : "/"

    return {
      route: Route.lit(baseHref),
      parent: Option.none()
    }
  })
)

function getBasePathname(base: string): string {
  try {
    const url = new URL(base)
    return url.pathname
  } catch {
    return base
  }
}

/**
 * @since 1.0.0
 */
export const server = (base: string = "/"): Layer.Layer<CurrentRoute> =>
  CurrentRoute.layer({ route: Route.lit(base), parent: Option.none() })

const getSearchParams = (destination: Destination): Readonly<Record<string, string>> =>
  Object.fromEntries(destination.url.searchParams)

/**
 * @since 1.0.0
 */
export const CurrentSearchParams: RefSubject.Computed<Readonly<Record<string, string>>, never, Navigation> = RefSubject
  .map(CurrentEntry, getSearchParams)

/**
 * @since 1.0.0
 */
export const CurrentState = RefSubject.computedFromTag(
  Navigation,
  (n) => RefSubject.map(n.currentEntry, (e) => e.state)
)
