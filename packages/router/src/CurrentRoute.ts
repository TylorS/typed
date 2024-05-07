/**
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import * as Document from "@typed/dom/Document"
import type * as Fx from "@typed/fx"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Destination } from "@typed/navigation"
import { CurrentEntry, CurrentPath, getCurrentPathFromUrl, Navigation } from "@typed/navigation"
import * as Route from "@typed/route"
import * as Effect from "effect/Effect"
import { dual, pipe } from "effect/Function"
import type * as Layer from "effect/Layer"
import * as Option from "effect/Option"

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
export function makeCurrentRoute<R extends Route.Route.Any>(
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
  return CurrentRoute.layer(makeCurrentRoute(route, parent))
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
  <R extends Route.Route.Any>(
    route: R
  ): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, Exclude<R, CurrentRoute>>

  <A, E, R, R_ extends Route.Route.Any>(
    effect: Effect.Effect<A, E, R>,
    route: R_
  ): Effect.Effect<A, E, Exclude<R, CurrentRoute>>
} = dual(2, <A, E, R, R_ extends Route.Route.Any>(
  effect: Effect.Effect<A, E, R>,
  route: R_
): Effect.Effect<A, E, Exclude<R, CurrentRoute>> =>
  Effect.contextWithEffect((ctx) => {
    const parent = Context.getOption(ctx, CurrentRoute)

    if (Option.isNone(parent)) return pipe(effect, CurrentRoute.provide(makeCurrentRoute(route)))

    return pipe(
      effect,
      CurrentRoute.provide(makeCurrentRoute(parent.value.route.concat(route), parent))
    )
  }))

const makeHref_ = (
  currentPath: string,
  currentRoute: Route.Route.Any,
  route: Route.Route.Any,
  params: {} = {}
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
  ...[params]: Route.Route.ParamsList<R>
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
  params: any = {}
): boolean => {
  const currentMatch = currentRoute.match(currentPath)
  if (Option.isNone(currentMatch)) return false

  const fullRoute = currentRoute.concat(route)
  const fullParams = { ...currentMatch.value, ...params }
  const fullPath: string = fullRoute.interpolate(fullParams as any)

  const active = fullPath === "/" ? currentPath === "/" : fullPath === currentPath || currentPath.startsWith(fullPath)

  console.log({
    currentPath,
    currentRoute: currentRoute.path,
    route: route.path,
    params,
    active
  })

  return active
}
/**
 * @since 1.0.0
 */
export function isActive<R extends Route.Route.Any>(
  route: R,
  ...[params]: Route.Route.ParamsList<R>
): RefSubject.Computed<boolean, never, Navigation | CurrentRoute>
export function isActive<R extends Route.Route.Any>(
  route: R,
  params: Route.Route.Params<R>
): RefSubject.Computed<boolean, never, Navigation | CurrentRoute>
export function isActive<R extends Route.Route.Any>(
  route: R,
  ...[params]: Route.Route.ParamsList<R>
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
export function decode<R extends Route.Route.Any>(
  route: R
): Fx.RefSubject.Filtered<
  Route.Route.Type<R>,
  Route.RouteDecodeError<R>,
  Navigation | CurrentRoute | Route.Route.Context<R>
> {
  return RefSubject.filteredFromTag(
    Navigation,
    (nav) =>
      RefSubject.filterMapEffect(
        nav.currentEntry,
        (e) =>
          Effect.flatMap(CurrentRoute, ({ route: parent }) =>
            Effect.optionFromOptional(Route.decode(parent.concat(route) as R, getCurrentPathFromUrl(e.url))))
      )
  )
}

/**
 * @since 1.0.0
 */
export const browser: Layer.Layer<CurrentRoute, never, Document.Document> = CurrentRoute.layer(
  Effect.gen(function*() {
    const document = yield* Document.Document
    const base = document.querySelector("base")
    const baseHref = base ? getBasePathname(base.href) : "/"

    return {
      route: Route.parse(baseHref),
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
  CurrentRoute.layer({ route: Route.parse(base), parent: Option.none() })

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
