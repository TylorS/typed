import type { Default } from "@effect/platform/Http/App"
import { RouteNotFound } from "@effect/platform/Http/ServerError"
import * as ServerRequest from "@effect/platform/Http/ServerRequest"
import type { ServerResponse } from "@effect/platform/Http/ServerResponse"
import * as Navigation from "@typed/navigation"
import { removeTrailingSlash } from "@typed/path"
import * as Route from "@typed/route"
import { asRouteGuard, CurrentRoute, getRoute, makeCurrentRoute, type MatchInput } from "@typed/router"
import { groupBy, sortBy } from "effect/Array"
import type { Chunk } from "effect/Chunk"
import * as Effect from "effect/Effect"
import * as Effectable from "effect/Effectable"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import type * as Order from "effect/Order"
import * as Record from "effect/Record"
import type { CurrentParams, RouteHandler } from "../RouteHandler.js"
import { currentParamsLayer, getCurrentParamsOption, getUrlFromServerRequest } from "../RouteHandler.js"
import type { Mount, Router } from "../Router.js"

export const RouterTypeId = Symbol.for("@typed/http/Router")
export type RouterTypeId = typeof RouterTypeId

export class RouterImpl<E, R, E2, R2> extends Effectable.StructuralClass<
  ServerResponse,
  E | E2 | RouteNotFound,
  CurrentRoute | Exclude<R | R2, CurrentParams<any> | Navigation.Navigation> | ServerRequest.ServerRequest
> implements Router<E | E2, R | R2> {
  readonly [RouterTypeId]: RouterTypeId = RouterTypeId

  private _httpApp!: Effect.Effect<
    ServerResponse,
    E | E2 | RouteNotFound,
    | Exclude<R | R2, CurrentParams<any> | Navigation.Navigation>
    | CurrentRoute
    | ServerRequest.ServerRequest
  >

  constructor(
    readonly routes: Chunk<RouteHandler<MatchInput.Any, E, R>>,
    readonly mounts: Chunk<Mount<E, R>>
  ) {
    super()
  }

  commit() {
    return this._httpApp ||= toHttpApp<E | E2, R | R2>(this)
  }
}

const routePartsOrder: Order.Order<RouteHandler<any, any, any>> = (a, b) =>
  Route.Order(getRoute(a.route), getRoute(b.route))

const allMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]
const getParentRoute = Effect.serviceOption(CurrentRoute)

export const setupRouteContext = Effect.gen(function*() {
  const request = yield* ServerRequest.ServerRequest
  const existingParams = yield* getCurrentParamsOption
  const parentRoute = yield* getParentRoute
  const url = getUrlFromServerRequest(request)
  const path = Navigation.getCurrentPathFromUrl(url)

  return { request, url, path, existingParams, parentRoute } as const
})

function toHttpApp<E, R>(
  router: Router<E, R>
): Effect.Effect<
  ServerResponse,
  E | RouteNotFound,
  | Exclude<R, CurrentParams<any> | Navigation.Navigation>
  | CurrentRoute
  | ServerRequest.ServerRequest
> {
  const routesByMethod = Record.map(
    groupBy(router.routes, (route) => route.method),
    sortBy(routePartsOrder)
  )
  const hasMounts = router.mounts.length > 0

  // Translate "all" routes to all methods for quick lookup
  if ("*" in routesByMethod) {
    allMethods.forEach((method) => {
      routesByMethod[method].push(...routesByMethod["*"])
      // Re-sort the routes
      routesByMethod[method] = pipe(routesByMethod[method], sortBy(routePartsOrder))
    })
  }

  const runMounts = ({ existingParams, parentRoute, path, url }: Effect.Effect.Success<typeof setupRouteContext>) =>
    Effect.gen(function*() {
      for (const mount of router.mounts) {
        const prefixRoute = getRoute(mount.prefix)
        yield* Effect.logDebug(`Checking mount: ${prefixRoute.path}`)

        const match = prefixRoute.match(path)
        if (Option.isNone(match)) continue

        const request = yield* ServerRequest.ServerRequest
        const prefix = prefixRoute.interpolate(match.value)

        const response: Option.Option<ServerResponse> = yield* runRouteMatcher<E, R>(
          mount.prefix,
          mount.app,
          path,
          url,
          existingParams
        ).pipe(
          Effect.provideService(
            ServerRequest.ServerRequest,
            mount.options?.includePrefix === true
              ? request
              : replaceRequestUrl(request, prefix)
          ),
          Effect.provideService(CurrentRoute, makeCurrentRoute(prefixRoute, parentRoute))
        )

        if (Option.isSome(response)) {
          yield* Effect.logDebug(`Mount matched: ${prefixRoute.path}`)
          return response
        }
      }

      return Option.none()
    })

  if (hasMounts) {
    return Effect.gen(function*(_) {
      const data = yield* setupRouteContext

      yield* Effect.logDebug(`Checking routes for method: ${data.request.method} at URL: ${data.url.href}`)

      // Check mounts first
      const response = yield* runMounts(data)
      if (Option.isSome(response)) {
        return response.value
      }

      const { existingParams, path, request, url } = data
      const routes = routesByMethod[request.method]
      if (routes !== undefined) {
        for (const { handler, route } of routes) {
          const routePath = getRoute(route).path
          yield* Effect.logDebug(`Checking route: ${routePath}`)
          const response = yield* runRouteMatcher(
            route,
            handler,
            path,
            url,
            existingParams
          )

          if (Option.isSome(response)) {
            yield* Effect.logDebug(`Route matched: ${routePath}`)
            return response.value
          }
        }
      }

      // No route found
      return yield* new RouteNotFound({ request: data.request })
    })
  } else {
    return Effect.gen(function*(_) {
      const { existingParams, path, request, url } = yield* setupRouteContext
      const routes = routesByMethod[request.method]

      yield* _(Effect.logDebug(`Checking routes for method: ${request.method} at URL: ${url.href}`))

      if (routes !== undefined) {
        for (const { handler, route } of routes) {
          const routePath = getRoute(route).path
          yield* Effect.logDebug(`Checking route: ${routePath}`)
          const response = yield* runRouteMatcher(
            route,
            handler,
            path,
            url,
            existingParams
          )

          if (Option.isSome(response)) {
            yield* Effect.logDebug(`Route matched: ${routePath}`)

            return response.value
          }
        }
      }

      // No route found
      return yield* new RouteNotFound({ request })
    })
  }
}

export function runRouteMatcher<E, R>(
  input: MatchInput.Any,
  handler: Default<E, R>,
  path: string,
  url: URL,
  existingParams: Option.Option<CurrentParams<any>>
): Effect.Effect<
  Option.Option<ServerResponse>,
  E,
  Exclude<R, CurrentParams<any> | Navigation.Navigation> | CurrentRoute | ServerRequest.ServerRequest
> {
  const { guard, route } = asRouteGuard(input)
  const routeParams = route.match(path)

  // Verify the route itself will be matched first
  if (Option.isNone(routeParams)) {
    return Effect.succeedNone
  }

  // Check if the route's params are valid, decode, etc
  return Effect.flatMap(guard(path), (params) => {
    // If the route's params are invalid, return None
    // And the next route will be checked
    if (Option.isNone(params)) {
      return Effect.succeedNone
    }

    const layer = Layer.mergeAll(
      Navigation.initialMemory({ url }),
      currentParamsLayer<typeof route>({
        params: Option.match(existingParams, {
          onNone: () => params.value,
          onSome: (existing) => ({ ...existing, ...params.value })
        }),
        queryParams: url.searchParams
      })
    )

    return Effect.asSome(Effect.provide(handler, layer))
  })
}

function replaceRequestUrl(request: ServerRequest.ServerRequest, prefix: string): ServerRequest.ServerRequest {
  const newUrl = removeTrailingSlash(request.url.replace(prefix, "")) || "/"
  return new Proxy(request, {
    get(target, prop) {
      if (prop === "url") return newUrl
      return target[prop as keyof typeof target]
    }
  })
}
