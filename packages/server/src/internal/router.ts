import type { Default } from "@effect/platform/Http/App"
import { RouteNotFound } from "@effect/platform/Http/ServerError"
import { ServerRequest } from "@effect/platform/Http/ServerRequest"
import type { ServerResponse } from "@effect/platform/Http/ServerResponse"
import * as Navigation from "@typed/navigation"
import { asRouteGuard, CurrentRoute, type MatchInput } from "@typed/router"
import { Effect, Effectable, Layer, Option } from "effect"
import type { Chunk } from "effect/Chunk"
import { groupBy } from "effect/ReadonlyArray"
import type { CurrentParams, RouteHandler } from "../RouteHandler.js"
import { currentParamsLayer, getCurrentParamsOption, getUrlFromServerRequest } from "../RouteHandler.js"
import type { Mount, Router } from "../Router.js"

export const RouterTypeId = Symbol.for("@typed/server/Router")
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

function toHttpApp<E, R>(
  router: Router<E, R>
): Effect.Effect<
  ServerResponse,
  E | RouteNotFound,
  | Exclude<R, CurrentRoute | CurrentParams<any> | Navigation.Navigation>
  | ServerRequest
> {
  const routesByMethod = groupBy(router.routes, (route) => route.method)

  return Effect.flatMap(ServerRequest, (request) => {
    const url = getUrlFromServerRequest(request)
    const path = Navigation.getCurrentPathFromUrl(url)
    const navigation = Navigation.initialMemory({ url })

    return Effect.gen(function*(_) {
      const existingParams = yield* _(getCurrentParamsOption)
      const parentRoute = yield* _(Effect.serviceOption(CurrentRoute))

      // Check mounts first
      for (const mount of router.mounts) {
        const response = yield* _(
          runRouteMatcher<E, R>(
            mount.prefix,
            mount.app,
            path,
            navigation,
            existingParams,
            url.searchParams,
            parentRoute
          )
        )

        if (Option.isSome(response)) {
          return response.value
        }
      }

      // Check routes
      for (const { handler, route } of routesByMethod[request.method] || []) {
        const response = yield* _(
          runRouteMatcher(
            route,
            handler,
            path,
            navigation,
            existingParams,
            url.searchParams,
            parentRoute
          )
        )

        if (Option.isSome(response)) {
          return response.value
        }
      }

      // No route found
      return yield* _(new RouteNotFound({ request }))
    })
  })
}

function runRouteMatcher<E, R>(
  input: MatchInput.Any,
  handler: Default<R, E>,
  path: string,
  navigation: Layer.Layer<Navigation.Navigation>,
  existingParams: Option.Option<CurrentParams<any>>,
  queryParams: URLSearchParams,
  parent: Option.Option<CurrentRoute>
): Effect.Effect<
  Option.Option<ServerResponse>,
  E | RouteNotFound,
  Exclude<R, CurrentRoute | CurrentParams<any> | Navigation.Navigation> | ServerRequest
> {
  const { guard, route } = asRouteGuard(input)
  const routeParams = route.match(path)

  // Verify the route itself will be matched first
  if (Option.isNone(routeParams)) {
    return Effect.succeedNone
  }

  const currentRouteLayer = CurrentRoute.layer({ route, parent })

  // Check if the route's params are valid, decode, etc
  return Effect.flatMap(guard(path), (params) => {
    // If the route's params are invalid, return None
    // And the next route will be checked
    if (Option.isNone(params)) {
      return Effect.succeedNone
    }

    const layer = Layer.mergeAll(
      navigation,
      currentRouteLayer,
      currentParamsLayer<typeof route>({
        params: Option.match(existingParams, {
          onNone: () => params.value,
          onSome: (existing) => ({ ...existing, ...params.value })
        }),
        queryParams
      })
    )

    return Effect.asSome(Effect.provide(handler, layer))
  })
}
