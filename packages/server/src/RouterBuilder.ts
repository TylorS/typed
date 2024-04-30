/**
 * @since 1.0.0
 */

import type { PathInput } from "@effect/platform/Http/Router"
import { ServerRequest } from "@effect/platform/Http/ServerRequest"
import type { Schema } from "@effect/schema"
import * as Route from "@typed/route"
import { Effect, type Pipeable } from "effect"
import type { Api, Route as EffectHttpRoute, RouterBuilder as EffectHttpRouterBuilder } from "effect-http"
import { ApiEndpoint, ApiRequest, ApiSchema, ServerError } from "effect-http"
import { dual } from "effect/Function"
import { pipeArguments } from "effect/Pipeable"
import * as ServerRequestParser from "./internal/serverRequestParser.js"
import * as ServerResponseEncoder from "./internal/serverResponseEncoder.js"
import * as RouteHandler from "./RouteHandler.js"
import * as Router from "./Router.js"

/**
 * @since 1.0.0
 */
export interface Options extends EffectHttpRouterBuilder.Options {}

/**
 * @category models
 * @since 1.0.0
 */
export interface RouterBuilder<E, R, RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any> extends Pipeable.Pipeable {
  readonly remainingEndpoints: ReadonlyArray<RemainingEndpoints>
  readonly api: Api.Api.Any
  readonly router: Router.Router<E, R>
  readonly options: Options
}

/**
 * @since 1.0.0
 */
export namespace RouterBuilder {
  /**
   * @since 1.0.0
   */
  export type Error<T> = T extends RouterBuilder<infer E, any, any> ? E : never

  /**
   * @since 1.0.0
   */
  export type Context<T> = T extends RouterBuilder<any, infer R, any> ? R : never

  /**
   * @since 1.0.0
   */
  export type RemainingEndpoints<T> = T extends RouterBuilder<any, any, infer RemainingEndpoints> ? RemainingEndpoints
    : never
}

const DEFAULT_OPTIONS: Options = {
  parseOptions: { errors: "first", onExcessProperty: "ignore" },
  enableDocs: true,
  docsPath: "/docs"
}

/**
 * Create a new unimplemeted `RouterBuilder` from an `Api`.
 *
 * @category handling
 * @since 1.0.0
 */
export const make: <A extends Api.Api.Any>(
  api: A,
  options?: Partial<Options>
) => RouterBuilder<never, never, Api.Api.Endpoints<A>> = (api, options) => ({
  remainingEndpoints: api.groups.flatMap((group) => group.endpoints) as any,
  api,
  router: Router.empty,
  options: {
    ...DEFAULT_OPTIONS,
    ...options
  },
  pipe() {
    return pipeArguments(this, arguments)
  }
})

/**
 * Handle an endpoint using a handler function.
 *
 * @category constructors
 * @since 1.0.0
 */
export const handle: {
  <
    E,
    R,
    RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any,
    Id extends ApiEndpoint.ApiEndpoint.Id<RemainingEndpoints>,
    E2,
    R2
  >(
    id: Id,
    handler: EffectHttpRoute.HandlerFunction<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>, R2, E2>
  ): (builder: RouterBuilder<E, R, RemainingEndpoints>) => RouterBuilder<
    | E
    | RouteHandler.RouteHandler.Error<
      HandlerFromEndpoint<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>, E2, R2>
    >,
    | R
    | RouteHandler.RouteHandler.Context<
      HandlerFromEndpoint<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>, E2, R2>
    >,
    ApiEndpoint.ApiEndpoint.ExcludeById<RemainingEndpoints, Id>
  >

  <
    E,
    R,
    RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any,
    Id extends ApiEndpoint.ApiEndpoint.Id<RemainingEndpoints>,
    E2,
    R2
  >(
    builder: RouterBuilder<E, R, RemainingEndpoints>,
    id: Id,
    handler: EffectHttpRoute.HandlerFunction<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>, R2, E2>
  ): RouterBuilder<
    | E
    | RouteHandler.RouteHandler.Error<
      HandlerFromEndpoint<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>, E2, R2>
    >,
    | R
    | RouteHandler.RouteHandler.Context<
      HandlerFromEndpoint<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>, E2, R2>
    >,
    ApiEndpoint.ApiEndpoint.ExcludeById<RemainingEndpoints, Id>
  >
} = dual(3, function handle<
  E,
  R,
  RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any,
  Id extends ApiEndpoint.ApiEndpoint.Id<RemainingEndpoints>,
  E2,
  R2
>(
  builder: RouterBuilder<E, R, RemainingEndpoints>,
  id: Id,
  handler: EffectHttpRoute.HandlerFunction<
    ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>,
    R2,
    E2
  >
): RouterBuilder<
  [
    | E
    | RouteHandler.RouteHandler.Error<
      HandlerFromEndpoint<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>, E2, R2>
    >
  ] extends [infer _] ? _ : never,
  [
    | R
    | RouteHandler.RouteHandler.Context<
      HandlerFromEndpoint<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>, E2, R2>
    >
  ] extends [infer _] ? _ : never,
  ApiEndpoint.ApiEndpoint.ExcludeById<RemainingEndpoints, Id>
> {
  const remainingEndpoints = builder.remainingEndpoints.slice(0)
  const index = builder.remainingEndpoints.findIndex((endpoint) => ApiEndpoint.getId(endpoint) === id)
  const endpoint = builder.remainingEndpoints[index]
  remainingEndpoints.splice(index, 1)

  const router = builder.router.pipe(
    Router.addHandler(fromEndpoint(endpoint, handler, builder.options))
  )

  return {
    ...builder,
    remainingEndpoints: remainingEndpoints as any,
    router
  } as any
})

type HandlerFromEndpoint<Endpoint extends ApiEndpoint.ApiEndpoint.Any, E, R> = RouteHandler.RouteHandler<
  Route.Route<
    PathInput,
    Extract<ApiRequest.ApiRequest.Path<ApiEndpoint.ApiEndpoint.Request<Endpoint>>, Schema.Schema.All>
  >,
  E,
  R
>

const fromEndpoint: <Endpoint extends ApiEndpoint.ApiEndpoint.Any, R, E>(
  endpoint: Endpoint,
  fn: EffectHttpRoute.HandlerFunction<Endpoint, R, E>,
  options?: Partial<Options>
) => HandlerFromEndpoint<Endpoint, E, R> = <Endpoint extends ApiEndpoint.ApiEndpoint.Any, R, E>(
  endpoint: Endpoint,
  fn: EffectHttpRoute.HandlerFunction<Endpoint, R, E>,
  options?: Partial<Options>
) => {
  const responseEncoder = ServerResponseEncoder.create(endpoint)
  const requestParser = ServerRequestParser.create(endpoint, options?.parseOptions)
  const apiRequest = ApiEndpoint.getRequest(endpoint)
  const pathSchema = ApiRequest.getPathSchema(apiRequest)
  const route = (ApiSchema.isIgnored(pathSchema)
    ? Route.parse(ApiEndpoint.getPath(endpoint))
    : Route.withSchema(Route.parse(ApiEndpoint.getPath(endpoint)), pathSchema)) as any as Route.Route<
      PathInput,
      Extract<ApiRequest.ApiRequest.Path<ApiEndpoint.ApiEndpoint.Request<Endpoint>>, Schema.Schema.All>
    >
  const handler = Effect.gen(function*() {
    const request = yield* ServerRequest
    const { params, queryParams } = yield* RouteHandler.getCurrentParams(route)
    const response = yield* requestParser.parseRequest(request, {
      params,
      searchParams: Object.fromEntries(queryParams.entries())
    }).pipe(
      Effect.flatMap((input: any) => {
        const { security, ...restInput } = input
        return fn(restInput, security)
      })
    )
    return yield* responseEncoder.encodeResponse(request, response)
  })

  return RouteHandler.make(ApiEndpoint.getMethod(endpoint))(
    route,
    handler.pipe(
      Effect.catchAll((error) => {
        if (ServerError.isServerError(error)) {
          return ServerError.toServerResponse(error)
        }

        return Effect.fail(error as Exclude<Effect.Effect.Error<typeof handler>, ServerError.ServerError>)
      })
    )
  )
}

/**
 * @since 1.0.0
 */
export function getRouter<E, R, RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any>(
  builder: RouterBuilder<E, R, RemainingEndpoints>
): Router.Router<
  // Flatten the error type to remove duplicates of computed RouteDecodeError<Route<PathInput, never>>
  E extends Route.RouteDecodeError<Route.Route<PathInput>>
    ? Exclude<E, Route.RouteDecodeError<Route.Route<PathInput>>> | Route.RouteDecodeError<Route.Route<PathInput>>
    : E,
  R
> {
  return builder.router as any
}
