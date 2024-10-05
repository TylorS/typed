import type { HttpServerResponse } from "@effect/platform"
import { HttpServerError, HttpServerRequest, HttpServerRespondable } from "@effect/platform"

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
import type { CurrentParams, Handler, HttpRouteHandler } from "../HttpRouteHandler.js"
import { currentParamsLayer, getCurrentParamsOption, getUrlFromServerRequest } from "../HttpRouteHandler.js"
import type { HttpRouter, Mount } from "../HttpRouter.js"

export const RouterTypeId = Symbol.for("@typed/http/Router")
export type RouterTypeId = typeof RouterTypeId

export class RouterImpl<E, R, E2, R2> extends Effectable.StructuralClass<
  HttpServerResponse.HttpServerResponse,
  E | E2 | HttpServerError.RouteNotFound,
  CurrentRoute | Exclude<R | R2, CurrentParams<any> | Navigation.Navigation> | HttpServerRequest.HttpServerRequest
> implements HttpRouter<E | E2, R | R2> {
  readonly [RouterTypeId]: RouterTypeId = RouterTypeId

  private _httpApp!: Effect.Effect<
    HttpServerResponse.HttpServerResponse,
    E | E2 | HttpServerError.RouteNotFound,
    | Exclude<R | R2, CurrentParams<any> | Navigation.Navigation>
    | CurrentRoute
    | HttpServerRequest.HttpServerRequest
  >

  constructor(
    readonly routes: Chunk<HttpRouteHandler<MatchInput.Any, E, R>>,
    readonly mounts: Chunk<Mount<E2, R2>>
  ) {
    super()
  }

  commit() {
    return this._httpApp ||= toHttpApp<E | E2, R | R2>(this)
  }
}

const routePartsOrder: Order.Order<HttpRouteHandler<any, any, any>> = (a, b) =>
  Route.Order(getRoute(a.route), getRoute(b.route))

const allMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]
const getParentRoute = Effect.serviceOption(CurrentRoute)

export const setupRouteContext = Effect.gen(function*() {
  const request = yield* HttpServerRequest.HttpServerRequest
  const existingParams = yield* getCurrentParamsOption
  const parentRoute = yield* getParentRoute
  const url = getUrlFromServerRequest(request)
  const path = Navigation.getCurrentPathFromUrl(url)

  return { request, url, path, existingParams, parentRoute } as const
})

function toHttpApp<E, R>(
  router: HttpRouter<E, R>
): Effect.Effect<
  HttpServerResponse.HttpServerResponse,
  E | HttpServerError.RouteNotFound,
  | Exclude<R, CurrentParams<any> | Navigation.Navigation>
  | CurrentRoute
  | HttpServerRequest.HttpServerRequest
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

        const request = yield* HttpServerRequest.HttpServerRequest
        const prefix = prefixRoute.interpolate(match.value)

        const response: Option.Option<HttpServerResponse.HttpServerResponse> = yield* runRouteMatcher<E, R>(
          mount.prefix,
          mount.app,
          path,
          url,
          existingParams
        ).pipe(
          Effect.provideService(
            HttpServerRequest.HttpServerRequest,
            mount.options?.includePrefix === true
              ? request
              : replaceRequestUrl(request, prefix)
          ),
          // Mounts should include the prefix route as part of the context
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
      return yield* new HttpServerError.RouteNotFound({ request: data.request })
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
      return yield* new HttpServerError.RouteNotFound({ request })
    })
  }
}

export function runRouteMatcher<E, R>(
  input: MatchInput.Any,
  handler: Handler<MatchInput.Any, E, R>,
  path: string,
  url: URL,
  existingParams: Option.Option<CurrentParams<any>>
): Effect.Effect<
  Option.Option<HttpServerResponse.HttpServerResponse>,
  E,
  Exclude<R, CurrentParams<any> | Navigation.Navigation> | CurrentRoute | HttpServerRequest.HttpServerRequest
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

    return Effect.asSome(Effect.provide(handler.pipe(Effect.flatMap(HttpServerRespondable.toResponse)), layer))
  })
}

function replaceRequestUrl(
  request: HttpServerRequest.HttpServerRequest,
  prefix: string
): HttpServerRequest.HttpServerRequest {
  const newUrl = removeTrailingSlash(request.url.replace(prefix, "")) || "/"
  return new Proxy(request, {
    get(target, prop) {
      if (prop === "url") return newUrl
      return target[prop as keyof typeof target]
    }
  })
}
