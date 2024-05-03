/**
 * @since 1.0.0
 */

import type { Default } from "@effect/platform/Http/App"
import * as Headers from "@effect/platform/Http/Headers"
import type { Method } from "@effect/platform/Http/Method"
import * as PlatformRouter from "@effect/platform/Http/Router"
import { ServerRequest } from "@effect/platform/Http/ServerRequest"
import type { ServerResponse } from "@effect/platform/Http/ServerResponse"
import { Tagged } from "@typed/context"
import * as Navigation from "@typed/navigation"
import * as Router from "@typed/router"
import type { Cause } from "effect"
import { Data, Effect, Layer, Option } from "effect"
import { dual } from "effect/Function"

/**
 * @since 1.0.0
 */
export interface RouteHandler<Route extends Router.MatchInput.Any, E, R> {
  readonly method: Method | "*"
  readonly route: Route
  readonly handler: Handler<Route, E, R>
}

/**
 * @since 1.0.0
 */
export namespace RouteHandler {
  /**
   * @since 1.0.0
   */
  export type Any = RouteHandler<Router.MatchInput.Any, any, any>

  /**
   * @since 1.0.0
   */
  export type Error<T> = T extends RouteHandler<infer I, infer E, any>
    ? E | Router.MatchInput.Error<I> | RouteNotMatched
    : never

  /**
   * @since 1.0.0
   */
  export type Context<T> = T extends RouteHandler<infer I, any, infer R> ? Exclude<
      Exclude<R, CurrentParams<I>> | Router.MatchInput.Context<I>,
      Router.CurrentRoute | Navigation.Navigation
    >
    : never
}

/**
 * @since 1.0.0
 */
export interface CurrentParams<I extends Router.MatchInput.Any> {
  readonly params: Router.MatchInput.Success<I>
  readonly queryParams: URLSearchParams
}

const CurrentParams = Tagged<CurrentParams<Router.MatchInput.Any>, CurrentParams<Router.MatchInput.Any>>(
  "@typed/http/CurrentParams"
)

/**
 * @since 1.0.0
 */
export type Handler<Route extends Router.MatchInput.Any, E, R> = Effect.Effect<
  ServerResponse,
  E,
  R | Router.CurrentRoute | CurrentParams<Route> | Navigation.Navigation | ServerRequest
>

/**
 * @since 1.0.0
 */
export function getCurrentParams<I extends Router.MatchInput.Any>(
  _route: I
): Effect.Effect<CurrentParams<I>, never, CurrentParams<I>> {
  return CurrentParams.with((params) => params as any as CurrentParams<I>) as any
}

/**
 * @since 1.0.0
 */
export const getCurrentParamsOption = Effect.serviceOption(CurrentParams)

/**
 * @since 1.0.0
 */
export function currentParamsLayer<I extends Router.MatchInput.Any>(
  params: CurrentParams<I>
): Layer.Layer<CurrentParams<I>> {
  return CurrentParams.layer(params)
}

/**
 * @since 1.0.0
 */
export const make = (method: Method | "*") =>
<I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
): RouteHandler<I, E, R> => ({
  method,
  route,
  handler
})

/**
 * @since 1.0.0
 */
export const get: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => RouteHandler<I, E, R> = make("GET")
/**
 * @since 1.0.0
 */
export const post: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => RouteHandler<I, E, R> = make("POST")
/**
 * @since 1.0.0
 */
export const put: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => RouteHandler<I, E, R> = make("PUT")

const delete_: <I extends Router.MatchInput.Any, E, R>(route: I, handler: Handler<I, E, R>) => RouteHandler<I, E, R> =
  make("DELETE")

export {
  /**
   * @since 1.0.0
   */
  delete_ as delete
}

/**
 * @since 1.0.0
 */
export const patch: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => RouteHandler<I, E, R> = make("PATCH")

/**
 * @since 1.0.0
 */
export const options: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => RouteHandler<I, E, R> = make("OPTIONS")

/**
 * @since 1.0.0
 */
export const head: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => RouteHandler<I, E, R> = make("HEAD")

/**
 * @since 1.0.0
 */
export const all: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => RouteHandler<I, E, R> = make("*")

/**
 * @since 1.0.0
 */
export function getUrlFromServerRequest(request: ServerRequest): URL {
  const { headers } = request
  const host = Headers.get(headers, "x-forwarded-host").pipe(
    Option.orElse(() => Headers.get(headers, "host")),
    Option.getOrElse(() => "localhost")
  )
  const protocol = Headers.get(headers, "x-forwarded-proto").pipe(
    Option.orElse(() => Headers.get(headers, "protocol")),
    Option.getOrElse(() => "http")
  )

  return new URL(request.url, `${protocol}://${host}`)
}

/**
 * @since 1.0.0
 */
export class RouteNotMatched extends Data.TaggedError("RouteNotMatched")<{
  readonly request: ServerRequest
  readonly route: Router.MatchInput.Any
}> {}

/**
 * @since 1.0.0
 */
export function toPlatformRoute<I extends RouteHandler.Any>(
  handler: I
): <E, R>(
  self: PlatformRouter.Router<E, R>
) => PlatformRouter.Router<E | RouteHandler.Error<I>, R | RouteHandler.Context<I>> {
  return PlatformRouter.route(handler.method)(Router.getPath(handler.route), toHttpApp(handler))
}

/**
 * @since 1.0.0
 */
export function toHttpApp<I extends RouteHandler.Any>(
  { handler, route: input }: I,
  parent?: Router.CurrentRoute
): Default<
  RouteHandler.Error<I>,
  RouteHandler.Context<I>
> {
  const { guard, route } = Router.asRouteGuard<I["route"]>(input)
  const currentRouteLayer = Router.CurrentRoute.layer({ route, parent: Option.fromNullable(parent) })
  return Effect.flatMap(ServerRequest, (request) => {
    const url = getUrlFromServerRequest(request)
    const path = Navigation.getCurrentPathFromUrl(url)
    const layer = Layer.mergeAll(Navigation.initialMemory({ url }), currentRouteLayer)

    return guard(path).pipe(
      Effect.flatMap((params) => {
        if (Option.isNone(params)) {
          return new RouteNotMatched({ request, route: input })
        }
        return Effect.serviceOption(CurrentParams).pipe(Effect.flatMap((existingParams) =>
          Effect.provide(
            handler,
            currentParamsLayer<I["route"]>({
              params: Option.match(existingParams, {
                onNone: () => params.value,
                onSome: (existing) => ({ ...existing, ...params.value })
              }),
              queryParams: url.searchParams
            })
          )
        ))
      }),
      Effect.provide(layer)
    )
  })
}

/**
 * @since 1.0.0
 */
export const catchAllCause: {
  <E2, E3, R3>(
    onCause: (cause: Cause.Cause<E2>) => Effect.Effect<ServerResponse, E3, R3>
  ): <R extends Router.MatchInput.Any, R2>(handler: RouteHandler<R, E2, R2>) => RouteHandler<R, E3, R2 | R3>

  <R extends Router.MatchInput.Any, E2, R2, E3, R3>(
    handler: RouteHandler<R, E2, R2>,
    onCause: (cause: Cause.Cause<E2>) => Effect.Effect<ServerResponse, E3, R3>
  ): RouteHandler<R, E3, R2 | R3>
} = dual(2, function catchAllCause<R extends Router.MatchInput.Any, E2, R2, E3, R3>(
  handler: RouteHandler<R, E2, R2>,
  onCause: (cause: Cause.Cause<E2>) => Effect.Effect<ServerResponse, E3, R3>
): RouteHandler<R, E3, R2 | R3> {
  return make(handler.method)(handler.route, Effect.catchAllCause(handler.handler, onCause))
})

/**
 * @since 1.0.0
 */
export const catchAll: {
  <E2, E3, R3>(
    onError: (error: E2) => Effect.Effect<ServerResponse, E3, R3>
  ): <R extends Router.MatchInput.Any, R2>(handler: RouteHandler<R, E2, R2>) => RouteHandler<R, E3, R2 | R3>

  <R extends Router.MatchInput.Any, E2, R2, E3, R3>(
    handler: RouteHandler<R, E2, R2>,
    onError: (error: E2) => Effect.Effect<ServerResponse, E3, R3>
  ): RouteHandler<R, E3, R2 | R3>
} = dual(2, function catchAll<R extends Router.MatchInput.Any, E2, R2, E3, R3>(
  handler: RouteHandler<R, E2, R2>,
  onError: (error: E2) => Effect.Effect<ServerResponse, E3, R3>
): RouteHandler<R, E3, R2 | R3> {
  return make(handler.method)(handler.route, Effect.catchAll(handler.handler, onError))
})

/**
 * @since 1.0.0
 */
export const catchTag: {
  <
    E2,
    const Tag extends E2 extends { readonly _tag: string } ? E2["_tag"] : never,
    E3,
    R3
  >(
    tag: Tag,
    onError: (error: Extract<E2, { readonly _tag: Tag }>) => Effect.Effect<ServerResponse, E3, R3>
  ): <R extends Router.MatchInput.Any, R2>(
    handler: RouteHandler<R, E2, R2>
  ) => RouteHandler<R, E3 | Exclude<E2, { readonly _tag: Tag }>, R2 | R3>

  <
    R extends Router.MatchInput.Any,
    E2,
    R2,
    const Tag extends E2 extends { readonly _tag: string } ? E2["_tag"] : never,
    E3,
    R3
  >(
    handler: RouteHandler<R, E2, R2>,
    tag: Tag,
    onError: (error: Extract<E2, { readonly _tag: Tag }>) => Effect.Effect<ServerResponse, E3, R3>
  ): RouteHandler<R, E3 | Exclude<E2, { readonly _tag: Tag }>, R2 | R3>
} = dual(3, function catchTag<
  R extends Router.MatchInput.Any,
  E2,
  R2,
  const Tag extends (E2 extends { _tag: string } ? E2["_tag"] : never),
  E3,
  R3
>(
  handler: RouteHandler<R, E2, R2>,
  tag: Tag,
  onError: (error: Extract<E2, { readonly _tag: Tag }>) => Effect.Effect<ServerResponse, E3, R3>
): RouteHandler<R, Exclude<E2, { readonly _tag: Tag }> | E3, R2 | R3> {
  return make(handler.method)(handler.route, Effect.catchTag(handler.handler, tag, onError))
})
