/* eslint-disable @typescript-eslint/no-empty-object-type */
/**
 * @since 1.0.0
 */

import type { HttpApp, HttpMethod, HttpServerResponse } from "@effect/platform"
import { Headers, HttpRouter, HttpServerRequest, HttpServerRespondable } from "@effect/platform"

import { Tagged } from "@typed/context"
import * as Navigation from "@typed/navigation"
import * as Router from "@typed/router"
import type { Runtime } from "effect"
import { Context, Record } from "effect"
import type * as Cause from "effect/Cause"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"

/**
 * @since 1.0.0
 */
export interface HttpRouteHandler<Route extends Router.MatchInput.Any, E, R> {
  readonly method: HttpMethod.HttpMethod | "*"
  readonly route: Route
  readonly handler: Handler<Route, E, R>
}

/**
 * @since 1.0.0
 */
export namespace HttpRouteHandler {
  /**
   * @since 1.0.0
   */
  export type Any = HttpRouteHandler<Router.MatchInput.Any, any, any>

  /**
   * @since 1.0.0
   */
  export type Error<T> = T extends HttpRouteHandler<infer I, infer E, any>
    ? E | Router.MatchInput.Error<I> | RouteNotMatched
    : never

  /**
   * @since 1.0.0
   */
  export type Context<T> = T extends HttpRouteHandler<infer I, any, infer R> ? Exclude<
      Exclude<R, CurrentParams<I>> | Router.MatchInput.Context<I>,
      Navigation.Navigation
    >
    : never
}

/**
 * @since 1.0.0
 */
export interface CurrentParams<I extends Router.MatchInput.Any = Router.MatchInput.Any> {
  readonly params: Router.MatchInput.Success<I>
  readonly queryParams: URLSearchParams
}

/**
 * @internal
 */
export const CurrentParams = Tagged<CurrentParams<Router.MatchInput.Any>, CurrentParams<Router.MatchInput.Any>>(
  "@/http/CurrentParams"
)

/**
 * @since 1.0.0
 */
export type Handler<Route extends Router.MatchInput.Any, E, R> = HttpRouter.Route.Handler<
  E,
  R | Router.CurrentRoute | CurrentParams<Route> | Navigation.Navigation | HttpServerRequest.HttpServerRequest
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
export const make = (method: HttpMethod.HttpMethod | "*") =>
<I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
): HttpRouteHandler<I, E, R> => ({
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
) => HttpRouteHandler<I, E, R> = make("GET")
/**
 * @since 1.0.0
 */
export const post: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => HttpRouteHandler<I, E, R> = make("POST")
/**
 * @since 1.0.0
 */
export const put: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => HttpRouteHandler<I, E, R> = make("PUT")

const delete_: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => HttpRouteHandler<I, E, R> = make("DELETE")

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
) => HttpRouteHandler<I, E, R> = make("PATCH")

/**
 * @since 1.0.0
 */
export const options: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => HttpRouteHandler<I, E, R> = make("OPTIONS")

/**
 * @since 1.0.0
 */
export const head: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => HttpRouteHandler<I, E, R> = make("HEAD")

/**
 * @since 1.0.0
 */
export const all: <I extends Router.MatchInput.Any, E, R>(
  route: I,
  handler: Handler<I, E, R>
) => HttpRouteHandler<I, E, R> = make("*")

/**
 * @since 1.0.0
 */
export function getUrlFromServerRequest(request: HttpServerRequest.HttpServerRequest): URL {
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
  readonly request: HttpServerRequest.HttpServerRequest
  readonly route: Router.MatchInput.Any
}> {}

/**
 * @since 1.0.0
 */
export function toPlatformRoute<I extends HttpRouteHandler.Any>(
  handler: I
): <E, R>(
  self: HttpRouter.HttpRouter<E, R>
) => HttpRouter.HttpRouter<E | HttpRouteHandler.Error<I>, R | HttpRouteHandler.Context<I>> {
  return HttpRouter.route(handler.method)(
    Router.getPath<I["route"]>(handler.route) as HttpRouter.PathInput,
    toHttpApp(handler)
  )
}

/**
 * @since 1.0.0
 */
export function toHttpApp<I extends HttpRouteHandler.Any>(
  { handler, route: input }: I,
  parent?: Router.CurrentRoute
): HttpApp.Default<
  HttpRouteHandler.Error<I>,
  HttpRouteHandler.Context<I>
> {
  const { guard, route } = Router.asRouteGuard<I["route"]>(input)
  const currentRouteLayer = Router.CurrentRoute.layer({ route, parent: Option.fromNullable(parent) })

  return Effect.flatMap(HttpServerRequest.HttpServerRequest, (request) => {
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
      Effect.flatMap(HttpServerRespondable.toResponse),
      Effect.provide(layer)
    )
  })
}

/**
 * @since 1.0.0
 */
export const catchAllCause: {
  <E2, E3, R3>(
    onCause: (cause: Cause.Cause<E2>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E3, R3>
  ): <R extends Router.MatchInput.Any, R2>(handler: HttpRouteHandler<R, E2, R2>) => HttpRouteHandler<R, E3, R2 | R3>

  <R extends Router.MatchInput.Any, E2, R2, E3, R3>(
    handler: HttpRouteHandler<R, E2, R2>,
    onCause: (cause: Cause.Cause<E2>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E3, R3>
  ): HttpRouteHandler<R, E3, R2 | R3>
} = dual(2, function catchAllCause<R extends Router.MatchInput.Any, E2, R2, E3, R3>(
  handler: HttpRouteHandler<R, E2, R2>,
  onCause: (cause: Cause.Cause<E2>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E3, R3>
): HttpRouteHandler<R, E3, R2 | R3> {
  return make(handler.method)(handler.route, Effect.catchAllCause(handler.handler, onCause))
})

/**
 * @since 1.0.0
 */
export const catchAll: {
  <E2, E3, R3>(
    onError: (error: E2) => Effect.Effect<HttpServerResponse.HttpServerResponse, E3, R3>
  ): <R extends Router.MatchInput.Any, R2>(handler: HttpRouteHandler<R, E2, R2>) => HttpRouteHandler<R, E3, R2 | R3>

  <R extends Router.MatchInput.Any, E2, R2, E3, R3>(
    handler: HttpRouteHandler<R, E2, R2>,
    onError: (error: E2) => Effect.Effect<HttpServerResponse.HttpServerResponse, E3, R3>
  ): HttpRouteHandler<R, E3, R2 | R3>
} = dual(2, function catchAll<R extends Router.MatchInput.Any, E2, R2, E3, R3>(
  handler: HttpRouteHandler<R, E2, R2>,
  onError: (error: E2) => Effect.Effect<HttpServerResponse.HttpServerResponse, E3, R3>
): HttpRouteHandler<R, E3, R2 | R3> {
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
    onError: (
      error: Extract<E2, { readonly _tag: Tag }>
    ) => Effect.Effect<HttpServerResponse.HttpServerResponse, E3, R3>
  ): <R extends Router.MatchInput.Any, R2>(
    handler: HttpRouteHandler<R, E2, R2>
  ) => HttpRouteHandler<R, E3 | Exclude<E2, { readonly _tag: Tag }>, R2 | R3>

  <
    R extends Router.MatchInput.Any,
    E2,
    R2,
    const Tag extends E2 extends { readonly _tag: string } ? E2["_tag"] : never,
    E3,
    R3
  >(
    handler: HttpRouteHandler<R, E2, R2>,
    tag: Tag,
    onError: (
      error: Extract<E2, { readonly _tag: Tag }>
    ) => Effect.Effect<HttpServerResponse.HttpServerResponse, E3, R3>
  ): HttpRouteHandler<R, E3 | Exclude<E2, { readonly _tag: Tag }>, R2 | R3>
} = dual(3, function catchTag<
  R extends Router.MatchInput.Any,
  E2,
  R2,
  const Tag extends (E2 extends { _tag: string } ? E2["_tag"] : never),
  E3,
  R3
>(
  handler: HttpRouteHandler<R, E2, R2>,
  tag: Tag,
  onError: (error: Extract<E2, { readonly _tag: Tag }>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E3, R3>
): HttpRouteHandler<R, Exclude<E2, { readonly _tag: Tag }> | E3, R2 | R3> {
  return make(handler.method)(handler.route, Effect.catchTag(handler.handler, tag, onError))
})

export const catchTags: {
  <
    R extends Router.MatchInput.Any,
    E,
    Cases extends E extends { _tag: string }
      ? { [K in E["_tag"]]+?: ((error: Extract<E, { _tag: K }>) => Handler<R, any, any>) | undefined }
      : Record<never, never>
  >(cases: Cases): <R2>(handler: HttpRouteHandler<R, E, R2>) => HttpRouteHandler<
    R,
    E | Effect.Effect.Error<Extract<Cases[keyof Cases], Handler<R, any, any>>>,
    R2 | Effect.Effect.Context<Extract<Cases[keyof Cases], Handler<R, any, any>>>
  >

  <
    R extends Router.MatchInput.Any,
    E,
    R2,
    Cases extends E extends { _tag: string }
      ? { [K in E["_tag"]]+?: ((error: Extract<E, { _tag: K }>) => Handler<R, any, any>) | undefined }
      : Record<never, never>
  >(handler: HttpRouteHandler<R, E, R2>, cases: Cases): HttpRouteHandler<
    R,
    E | Effect.Effect.Error<Extract<Cases[keyof Cases], Handler<R, any, any>>>,
    R2 | Effect.Effect.Context<Extract<Cases[keyof Cases], Handler<R, any, any>>>
  >
} = dual(2, <
  R extends Router.MatchInput.Any,
  E,
  R2,
  Cases extends E extends { _tag: string }
    ? { [K in E["_tag"]]+?: ((error: Extract<E, { _tag: K }>) => Handler<R, any, any>) | undefined } :
    Record<never, never>
>(
  handler: HttpRouteHandler<R, E, R2>,
  cases: Cases
): HttpRouteHandler<
  R,
  E | Effect.Effect.Error<Extract<Cases[keyof Cases], Handler<R, any, any>>>,
  R2 | Effect.Effect.Context<Extract<Cases[keyof Cases], Handler<R, any, any>>>
> => {
  return make(handler.method)(
    handler.route,
    Effect.catchTags(
      handler.handler,
      Record.map(
        cases as {},
        (f: (error: Extract<E, { _tag: any }>) => Handler<R, any, any>) => (error: any) =>
          Effect.flatMap(f(error), HttpServerRespondable.toResponse)
      ) as any
    ) as any
  )
})

export const provide: {
  <R3, E3, R4>(
    layer: Layer.Layer<R3, E3, R4>
  ): <R extends Router.MatchInput.Any, E2, R2>(handler: HttpRouteHandler<R, E2, R2>) => HttpRouteHandler<
    R,
    E2 | E3,
    | R4
    | Exclude<HttpRouter.RouteContext, R3>
    | Exclude<HttpServerRequest.ParsedSearchParams, R3>
    | Exclude<Router.CurrentRoute, R3>
    | Exclude<Navigation.Navigation, R3>
    | Exclude<HttpServerRequest.HttpServerRequest, R3>
    | Exclude<R2, R3>
  >

  <R3>(
    context: Context.Context<R3> | Runtime.Runtime<R3>
  ): <R extends Router.MatchInput.Any, E2, R2>(handler: HttpRouteHandler<R, E2, R2>) => HttpRouteHandler<
    R,
    E2,
    | Exclude<HttpRouter.RouteContext, R3>
    | Exclude<HttpServerRequest.ParsedSearchParams, R3>
    | Exclude<Router.CurrentRoute, R3>
    | Exclude<Navigation.Navigation, R3>
    | Exclude<HttpServerRequest.HttpServerRequest, R3>
    | Exclude<R2, R3>
  >

  <R extends Router.MatchInput.Any, E2, R2, R3, E3 = never, R4 = never>(
    handler: HttpRouteHandler<R, E2, R2>,
    layer: Layer.Layer<R3, E3, R4> | Runtime.Runtime<R3> | Context.Context<R3>
  ): HttpRouteHandler<
    R,
    E2 | E3,
    | R4
    | Exclude<HttpRouter.RouteContext, R3>
    | Exclude<HttpServerRequest.ParsedSearchParams, R3>
    | Exclude<Router.CurrentRoute, R3>
    | Exclude<Navigation.Navigation, R3>
    | Exclude<HttpServerRequest.HttpServerRequest, R3>
    | Exclude<R2, R3>
  >
} = dual(2, <R extends Router.MatchInput.Any, E2, R2, R3, E3, R4>(
  handler: HttpRouteHandler<R, E2, R2>,
  layer: Layer.Layer<R3, E3, R4>
): HttpRouteHandler<
  R,
  E2 | E3,
  | R4
  | Exclude<HttpRouter.RouteContext, R3>
  | Exclude<HttpServerRequest.ParsedSearchParams, R3>
  | Exclude<Router.CurrentRoute, R3>
  | Exclude<Navigation.Navigation, R3>
  | Exclude<HttpServerRequest.HttpServerRequest, R3>
  | Exclude<R2, R3>
> => {
  return make(handler.method)(handler.route, Effect.provide(handler.handler, layer))
})

export const provideService = <R extends Router.MatchInput.Any, E2, R2, I, S>(
  handler: HttpRouteHandler<R, E2, R2>,
  tag: Context.Tag<I, S>,
  service: S
): HttpRouteHandler<
  R,
  E2,
  | Exclude<HttpRouter.RouteContext, I>
  | Exclude<HttpServerRequest.ParsedSearchParams, I>
  | Exclude<Router.CurrentRoute, I>
  | Exclude<Navigation.Navigation, I>
  | Exclude<HttpServerRequest.HttpServerRequest, I>
  | Exclude<R2, I>
> => {
  return provide(handler, Context.make(tag, service))
}
