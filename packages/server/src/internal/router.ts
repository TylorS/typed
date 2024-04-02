import type { Default } from "@effect/platform/Http/App"
import { RouteNotFound } from "@effect/platform/Http/ServerError"
import { ServerRequest } from "@effect/platform/Http/ServerRequest"
import type { ServerResponse } from "@effect/platform/Http/ServerResponse"
import * as Navigation from "@typed/navigation"
import { asRouteGuard, CurrentRoute, type MatchInput } from "@typed/router"
import { Effect, Effectable, Layer, Option, Order, pipe } from "effect"
import type { Chunk } from "effect/Chunk"
import { groupBy, sortBy } from "effect/ReadonlyArray"
import type { CurrentParams, RouteHandler } from "../RouteHandler.js"
import { currentParamsLayer, getCurrentParamsOption, getUrlFromServerRequest } from "../RouteHandler.js"
import type { Mount, Router } from "../Router.js"

export const RouterTypeId = Symbol.for("@typed/http/Router")
export type RouterTypeId = typeof RouterTypeId

export class RouterImpl<E, R, E2, R2> extends Effectable.StructuralClass<
  ServerResponse,
  E | E2 | RouteNotFound,
  Exclude<R | R2, CurrentRoute | CurrentParams<any> | Navigation.Navigation> | ServerRequest
> implements Router<E | E2, R | R2> {
  readonly [RouterTypeId]: RouterTypeId = RouterTypeId

  private _httpApp!: Effect.Effect<
    ServerResponse,
    E | E2 | RouteNotFound,
    | Exclude<R | R2, CurrentRoute | CurrentParams<any> | Navigation.Navigation>
    | ServerRequest
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

const routePartsOrder: Order.Order<RouteHandler<any, any, any>> = pipe(
  Order.number,
  Order.mapInput((route: RouteHandler<any, any, any>) => route.route.path.split("/").length)
)

const routesAlphaOrder = pipe(
  Order.string,
  Order.mapInput((route: RouteHandler<any, any, any>) => route.route.path)
)

const allMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]
const getParentRoute = Effect.serviceOption(CurrentRoute)

export const setupRouteContext = Effect.gen(function*(_) {
  const request = yield* _(ServerRequest)
  const existingParams = yield* _(getCurrentParamsOption)
  const parentRoute = yield* _(getParentRoute)
  const url = getUrlFromServerRequest(request)
  const path = Navigation.getCurrentPathFromUrl(url)

  return { request, url, path, existingParams, parentRoute } as const
})

function toHttpApp<E, R>(
  router: Router<E, R>
): Effect.Effect<
  ServerResponse,
  E | RouteNotFound,
  | Exclude<R, CurrentRoute | CurrentParams<any> | Navigation.Navigation>
  | ServerRequest
> {
  const routesByMethod = groupBy(router.routes.pipe(sortBy(routePartsOrder, routesAlphaOrder)), (route) => route.method)
  const hasMounts = router.mounts.length > 0

  // Translate "all" routes to all methods for quick lookup
  if ("*" in routesByMethod) {
    allMethods.forEach((method) => {
      routesByMethod[method].push(...routesByMethod["*"])
      // Re-sort the routes
      routesByMethod[method] = pipe(routesByMethod[method], sortBy(routePartsOrder, routesAlphaOrder))
    })
  }

  const runMounts = ({ existingParams, parentRoute, path, url }: Effect.Effect.Success<typeof setupRouteContext>) =>
    Effect.gen(function*(_) {
      for (const mount of router.mounts) {
        const response = yield* _(
          runRouteMatcher<E, R>(
            mount.prefix,
            mount.app,
            path,
            url,
            existingParams,
            parentRoute
          )
        )

        if (Option.isSome(response)) {
          return response
        }
      }

      return Option.none()
    })

  if (hasMounts) {
    return Effect.gen(function*(_) {
      const data = yield* _(setupRouteContext)

      // Check mounts first
      const response = yield* _(runMounts(data))
      if (Option.isSome(response)) {
        return response.value
      }

      const { existingParams, parentRoute, path, request, url } = data
      const routes = routesByMethod[request.method]
      if (routes !== undefined) {
        for (const { handler, route } of routes) {
          const response = yield* _(
            runRouteMatcher(
              route,
              handler,
              path,
              url,
              existingParams,
              parentRoute
            )
          )

          if (Option.isSome(response)) {
            return response.value
          }
        }
      }

      // No route found
      return yield* _(new RouteNotFound({ request: data.request }))
    })
  } else {
    return Effect.gen(function*(_) {
      const { existingParams, parentRoute, path, request, url } = yield* _(setupRouteContext)
      const routes = routesByMethod[request.method]
      if (routes !== undefined) {
        for (const { handler, route } of routes) {
          const response = yield* _(
            runRouteMatcher(
              route,
              handler,
              path,
              url,
              existingParams,
              parentRoute
            )
          )

          if (Option.isSome(response)) {
            return response.value
          }
        }
      }

      // No route found
      return yield* _(new RouteNotFound({ request }))
    })
  }
}

export function runRouteMatcher<E, R>(
  input: MatchInput.Any,
  handler: Default<R, E>,
  path: string,
  url: URL,
  existingParams: Option.Option<CurrentParams<any>>,
  parent: Option.Option<CurrentRoute>
): Effect.Effect<
  Option.Option<ServerResponse>,
  E,
  Exclude<R, CurrentRoute | CurrentParams<any> | Navigation.Navigation> | ServerRequest
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
      CurrentRoute.layer({ route, parent }),
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
