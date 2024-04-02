import type { PathInput } from "@effect/platform/Http/Router"
import { ServerRequest } from "@effect/platform/Http/ServerRequest"
import type { Schema } from "@effect/schema"
import * as Route from "@typed/route"
import { Effect, type Pipeable } from "effect"
import type { Api, Route as EffectHttpRoute, RouterBuilder as EffectHttpRouterBuilder } from "effect-http"
import { ApiEndpoint, ApiRequest, ApiSchema, ServerError } from "effect-http"
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
export function handle<
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
) {
  const remainingEndpoints = builder.remainingEndpoints.slice(0)
  const index = builder.remainingEndpoints.findIndex((endpoint) => ApiEndpoint.getId(endpoint) === id)
  const endpoint = builder.remainingEndpoints[index]
  remainingEndpoints.splice(index, 1)

  const router = builder.router.pipe(
    Router.addHandler(fromEndpoint(endpoint, handler, builder.options))
  )

  return {
    ...builder,
    remainingEndpoints,
    router
  }
}

const fromEndpoint: <Endpoint extends ApiEndpoint.ApiEndpoint.Any, R, E>(
  endpoint: Endpoint,
  fn: EffectHttpRoute.HandlerFunction<Endpoint, R, E>,
  options?: Partial<Options>
) => RouteHandler.RouteHandler<
  Route.Route<
    PathInput,
    Extract<ApiRequest.ApiRequest.Path<ApiEndpoint.ApiEndpoint.Request<Endpoint>>, Schema.Schema.All>
  >,
  E,
  R
> = <Endpoint extends ApiEndpoint.ApiEndpoint.Any, R, E>(
  endpoint: Endpoint,
  fn: EffectHttpRoute.HandlerFunction<Endpoint, R, E>,
  options?: Partial<Options>
) => {
  const responseEncoder = ServerResponseEncoder.create(endpoint)
  const requestParser = ServerRequestParser.create(endpoint, options?.parseOptions)
  const apiRequest = ApiEndpoint.getRequest(endpoint)
  const pathSchema = ApiRequest.getPathSchema(apiRequest)
  const route = (ApiSchema.isIgnored(pathSchema)
    ? Route.literal(ApiEndpoint.getPath(endpoint))
    : Route.withSchema(Route.literal(ApiEndpoint.getPath(endpoint)), pathSchema)) as any as Route.Route<
      PathInput,
      Extract<ApiRequest.ApiRequest.Path<ApiEndpoint.ApiEndpoint.Request<Endpoint>>, Schema.Schema.All>
    >
  const handler = Effect.gen(function*(_) {
    const request = yield* _(ServerRequest)
    const { params, queryParams } = yield* _(RouteHandler.getCurrentParams(route))
    const response = yield* _(
      requestParser.parseRequest(request, {
        params,
        searchParams: Object.fromEntries(queryParams.entries())
      }),
      Effect.flatMap((input: any) => {
        const { security, ...restInput } = input
        return fn(restInput, security)
      })
    )
    return yield* _(responseEncoder.encodeResponse(request, response))
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
