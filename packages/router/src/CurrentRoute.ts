/**
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import * as Document from "@typed/dom/Document"
import type * as Fx from "@typed/fx"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Navigation from "@typed/navigation"
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
  Navigation.Navigation | CurrentRoute
> = RefSubject
  .filteredFromTag(
    Navigation.Navigation,
    (nav) =>
      RefSubject.filterMapEffect(
        nav.currentEntry,
        (e) => CurrentRoute.with(({ route }) => route.match(Navigation.getCurrentPathFromUrl(e.url)))
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
): RefSubject.Filtered<string, never, Navigation.Navigation | CurrentRoute>
export function makeHref<const R extends Route.Route.Any>(
  route: R,
  params: Route.Route.Params<R>
): RefSubject.Filtered<string, never, Navigation.Navigation | CurrentRoute>

export function makeHref<const R extends Route.Route.Any>(
  route: R,
  ...[params]: Route.Route.ParamsList<R>
): RefSubject.Filtered<string, never, Navigation.Navigation | CurrentRoute> {
  return RefSubject.filterMapEffect(
    Navigation.CurrentPath,
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
  const href: string = fullRoute.interpolate(fullParams as any)
  const [currentPathname, currentQuery] = splitByQuery(currentPath)
  const [hrefPathname, hrefQuery] = splitByQuery(href)

  return (fullRoute.routeOptions.end ? currentPathname === hrefPathname : currentPathname.startsWith(hrefPathname)) &&
    compareQueries(currentQuery, hrefQuery)
}

function compareQueries(currentQuery: string, hrefQuery: string) {
  // if hrefQuery is empty, it means that the href is a pathname only
  if (!hrefQuery) return true
  // if currentQuery is empty, there is no match at this point
  if (!currentQuery) return false
  // if the queries are equal, there is a match
  if (currentQuery === hrefQuery) return true

  const currentQueryParams = new URLSearchParams(currentQuery)
  const hrefQueryParams = new URLSearchParams(hrefQuery)

  for (const key of hrefQueryParams.keys()) {
    const a = currentQueryParams.getAll(key).sort()
    const b = hrefQueryParams.getAll(key).sort()

    if (a.length !== b.length || !b.every((bx, i) => a[i] === bx)) return false
  }

  return true
}

function splitByQuery(path: string) {
  const ptrSyntaxIndex = path.indexOf("\\?")
  if (ptrSyntaxIndex > -1) {
    const pathname = path.slice(0, ptrSyntaxIndex)
    const query = path.slice(ptrSyntaxIndex + 1).trim()
    return [pathname, query] as const
  }

  const queryIndex = path.indexOf("?")
  if (queryIndex > -1) {
    const pathname = path.slice(0, queryIndex)
    const query = path.slice(queryIndex + 1).trim()
    return [pathname, query] as const
  }

  return [path, ""] as const
}

/**
 * @since 1.0.0
 */
export function isActive<R extends Route.Route.Any>(
  route: R,
  ...[params]: Route.Route.ParamsList<R>
): RefSubject.Computed<boolean, never, Navigation.Navigation | CurrentRoute>
export function isActive<R extends Route.Route.Any>(
  route: R,
  params: Route.Route.Params<R>
): RefSubject.Computed<boolean, never, Navigation.Navigation | CurrentRoute>
export function isActive<R extends Route.Route.Any>(
  route: R,
  ...[params]: Route.Route.ParamsList<R>
): RefSubject.Computed<boolean, never, Navigation.Navigation | CurrentRoute> {
  return RefSubject.mapEffect(
    Navigation.CurrentPath,
    (currentPath) =>
      CurrentRoute.with((currentRoute): boolean => isActive_(currentPath, currentRoute.route, route, params))
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
  Navigation.Navigation | CurrentRoute | Route.Route.Context<R>
> {
  return RefSubject.filteredFromTag(
    Navigation.Navigation,
    (nav) =>
      RefSubject.filterMapEffect(
        nav.currentEntry,
        (e) =>
          Effect.flatMap(CurrentRoute, ({ route: parent }) =>
            Effect.optionFromOptional(Route.decode(parent.concat(route) as R, Navigation.getCurrentPathFromUrl(e.url))))
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

const getSearchParams = (destination: Navigation.Destination) => destination.url.searchParams

/**
 * @since 1.0.0
 */
export const CurrentSearchParams: RefSubject.Computed<URLSearchParams, never, Navigation.Navigation> = RefSubject
  .map(Navigation.CurrentEntry, getSearchParams)

/**
 * @since 1.0.0
 */
export const CurrentState = RefSubject.computedFromTag(
  Navigation.Navigation,
  (n) => RefSubject.map(n.currentEntry, (e) => e.state)
)

/**
 * @since 1.0.0
 */
export type NavigateOptions<R extends Route.Route.Any> =
  & Navigation.NavigateOptions
  & ([keyof Route.Route.Params<R>] extends [never] ? { readonly params?: Route.Route.Params<R> | undefined }
    : { readonly params: Route.Route.Params<R> })
  & {
    readonly relative?: boolean
  }

/**
 * @since 1.0.0
 */
export const navigate = <R extends Route.Route.Any>(
  route: R,
  options: NavigateOptions<R> = {} as NavigateOptions<R>
): Effect.Effect<
  Option.Option<Navigation.Destination>,
  Navigation.NavigationError,
  Navigation.Navigation | CurrentRoute
> =>
  Effect.optionFromOptional(Effect.gen(function*(_) {
    const params = options.params ?? {} as Route.Route.Params<R>
    const path = options.relative === false
      ? route.interpolate(params)
      : yield* _(makeHref<R>(route, params))
    return yield* _(Navigation.navigate(path))
  }))
