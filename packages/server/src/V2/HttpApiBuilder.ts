/**
 * @since 1.0.0
 */
import { HttpServerRespondable } from "@effect/platform"
import type { FileSystem } from "@effect/platform/FileSystem"
import * as PlatformHttpApiBuilder from "@effect/platform/HttpApiBuilder"
import type { PathInput } from "@effect/platform/HttpRouter"
import type { Path } from "@effect/platform/Path"
import * as AST from "@effect/schema/AST"
import * as ParseResult from "@effect/schema/ParseResult"
import * as Schema from "@effect/schema/Schema"
import * as Navigation from "@typed/navigation"
import * as Route from "@typed/route"
import { asRouteGuard, CurrentRoute } from "@typed/router"
import { Encoding, Redacted, Unify } from "effect"
import * as Chunk from "effect/Chunk"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { flow, identity } from "effect/Function"
import { globalValue } from "effect/GlobalValue"
import * as Layer from "effect/Layer"
import type { ManagedRuntime } from "effect/ManagedRuntime"
import * as Option from "effect/Option"
import type { Scope } from "effect/Scope"
import type { Mutable, NoInfer } from "effect/Types"
import type { Cookie } from "./Cookies.js"
import * as HttpApi from "./HttpApi.js"
import * as HttpApiEndpoint from "./HttpApiEndpoint.js"
import { HttpApiDecodeError } from "./HttpApiError.js"
import type * as HttpApiGroup from "./HttpApiGroup.js"
import * as HttpApiHandlers from "./HttpApiHandlers.js"
import * as HttpApiSchema from "./HttpApiSchema.js"
import * as HttpApiSecurity from "./HttpApiSecurity.js"
import * as HttpApp from "./HttpApp.js"
import * as HttpMethod from "./HttpMethod.js"
import * as HttpMiddleware from "./HttpMiddleware.js"
import * as HttpRouteHandler from "./HttpRouteHandler.js"
import * as HttpRouter from "./HttpRouter.js"
import * as HttpServer from "./HttpServer.js"
import * as HttpServerRequest from "./HttpServerRequest.js"
import * as HttpServerResponse from "./HttpServerResponse.js"
import * as OpenApi from "./OpenApi.js"

/**
 * The router that the API endpoints are attached to.
 *
 * @since 1.0.0
 * @category router
 */
export class HttpApiBuilderRouter
  extends HttpRouter.Tag("@typed/server/HttpApiBuilder/Router")<HttpApiBuilderRouter>()
{}

/**
 * Build an `HttpApp` from an `HttpApi` instance, and serve it using an
 * `HttpServer`.
 *
 * Optionally, you can provide a middleware function that will be applied to
 * the `HttpApp` before serving.
 *
 * @since 1.0.0
 * @category constructors
 */
export const serve: {
  (): Layer.Layer<never, never, HttpServer.HttpServer | HttpApi.HttpApi.Service | HttpRouter.HttpRouter.DefaultServices>
  <R>(
    middleware: (httpApp: HttpApp.Default) => HttpApp.Default<never, R>
  ): Layer.Layer<
    never,
    never,
    | HttpServer.HttpServer
    | HttpRouter.HttpRouter.DefaultServices
    | Exclude<R, Scope | HttpServerRequest.HttpServerRequest>
    | HttpApi.HttpApi.Service
  >
} = (middleware?: HttpMiddleware.HttpMiddleware.Applied<any, never, any>): Layer.Layer<
  never,
  never,
  any
> =>
  httpApp.pipe(
    Effect.map(HttpServer.serve(middleware!)),
    Layer.unwrapEffect,
    Layer.provide(HttpApiBuilderRouter.Live)
  )

/**
 * Construct an `HttpApp` from an `HttpApi` instance.
 *
 * @since 1.0.0
 * @category constructors
 */
export const httpApp: Effect.Effect<
  HttpApp.Default<never, HttpRouter.HttpRouter.DefaultServices>,
  never,
  HttpApiBuilderRouter | HttpApi.HttpApi.Service
> = Effect.gen(function*() {
  const api = yield* HttpApi.HttpApi
  const router = yield* HttpApiBuilderRouter.router
  const apiMiddleware = yield* Effect.serviceOption(Middleware)
  const errorSchema = makeErrorSchema(api as any)
  const encodeError = Schema.encodeUnknown(errorSchema)
  return router.pipe(
    apiMiddleware._tag === "Some" ? apiMiddleware.value : identity,
    Effect.catchAll((error) =>
      Effect.matchEffect(encodeError(error), {
        onFailure: () => Effect.die(error),
        onSuccess: Effect.succeed
      })
    )
  )
})

/**
 * Construct an http web handler from an `HttpApi` instance.
 *
 * @since 1.0.0
 * @category constructors
 * @example
 * import { HttpApi } from "@effect/platform"
 * import { Etag, HttpApiBuilder, HttpMiddleware, HttpPlatform } from "@effect/platform"
 * import { NodeContext } from "@effect/platform-node"
 * import { Layer, ManagedRuntime } from "effect"
 *
 * const ApiLive = HttpApiBuilder.api(HttpApi.empty)
 *
 * const runtime = ManagedRuntime.make(
 *   Layer.mergeAll(
 *     ApiLive,
 *     HttpApiBuilder.Router.Live,
 *     HttpPlatform.layer,
 *     Etag.layerWeak
 *   ).pipe(
 *     Layer.provideMerge(NodeContext.layer)
 *   )
 * )
 *
 * const handler = HttpApiBuilder.toWebHandler(runtime, HttpMiddleware.logger)
 */
export const toWebHandler = <R, ER>(
  runtime: ManagedRuntime<
    R | HttpApi.HttpApi.Service | HttpApiBuilderRouter | HttpRouter.HttpRouter.DefaultServices,
    ER
  >,
  middleware?: (
    httpApp: HttpApp.Default
  ) => HttpApp.Default<
    never,
    R | HttpApi.HttpApi.Service | HttpApiBuilderRouter | HttpRouter.HttpRouter.DefaultServices
  >
): (request: Request) => Promise<Response> => {
  const handlerPromise = httpApp.pipe(
    Effect.bindTo("httpApp"),
    Effect.bind("runtime", () => runtime.runtimeEffect),
    Effect.map(({ httpApp, runtime }) =>
      HttpApp.toWebHandlerRuntime(runtime)(middleware ? middleware(httpApp as any) : httpApp)
    ),
    runtime.runPromise
  )
  return (request) => handlerPromise.then((handler) => handler(request))
}

/**
 * Build a root level `Layer` from an `HttpApi` instance.
 *
 * The `Layer` will provide the `HttpApi` service, and will require the
 * implementation for all the `HttpApiGroup`'s contained in the `HttpApi`.
 *
 * The resulting `Layer` can be provided to the `HttpApiBuilder.serve` layer.
 *
 * @since 1.0.0
 * @category constructors
 */
export const api = <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR>(
  self: HttpApi.HttpApi<Groups, Error, ErrorR>
): Layer.Layer<HttpApi.HttpApi.Service, never, HttpApiGroup.HttpApiGroup.ToService<Groups> | ErrorR> =>
  Layer.succeed(HttpApi.HttpApi, self) as any

/**
 * Create a `Layer` that will implement all the endpoints in an `HttpApiGroup`.
 *
 * An unimplemented `Handlers` instance is passed to the `build` function, which
 * you can use to add handlers to the group.
 *
 * You can implement endpoints using the `HttpApiBuilder.handle` api.
 *
 * @since 1.0.0
 * @category handlers
 */
export const group = <
  Groups extends HttpApiGroup.HttpApiGroup.Any,
  ApiError,
  ApiErrorR,
  const Name extends Groups["identifier"],
  RH,
  EX = never,
  RX = never
>(
  api: HttpApi.HttpApi<Groups, ApiError, ApiErrorR>,
  groupName: Name,
  build: (
    handlers: HttpApiHandlers.HttpApiHandlers<never, never, HttpApiGroup.HttpApiGroup.EndpointsWithName<Groups, Name>>
  ) =>
    | HttpApiHandlers.HttpApiHandlers<NoInfer<ApiError> | HttpApiGroup.HttpApiGroup.ErrorWithName<Groups, Name>, RH>
    | Effect.Effect<
      HttpApiHandlers.HttpApiHandlers<NoInfer<ApiError> | HttpApiGroup.HttpApiGroup.ErrorWithName<Groups, Name>, RH>,
      EX,
      RX
    >
): Layer.Layer<
  HttpApiGroup.HttpApiGroup.Service<Name>,
  EX,
  RX | RH | HttpApiGroup.HttpApiGroup.ContextWithName<Groups, Name> | ApiErrorR
> =>
  HttpApiBuilderRouter.use((router) =>
    Effect.gen(function*() {
      const context = yield* Effect.context<any>()
      const group = Chunk.findFirst(api.groups, (group) => group.identifier === groupName)
      if (group._tag === "None") {
        throw new Error(`Group "${groupName}" not found in API`)
      }
      const result = build(HttpApiHandlers.makeHandlers({ group: group.value as any, handlers: Chunk.empty() }))
      const { handlers } = Effect.isEffect(result) ? (yield* result) : result
      const routes: Array<HttpRouteHandler.HttpRouteHandler<any, any, any>> = []
      for (const item of handlers) {
        if (item._tag === "Middleware") {
          for (const route of routes) {
            ;(route as Mutable<HttpRouteHandler.HttpRouteHandler<any, any, any>>).handler = item.middleware(
              route.handler as any
            )
          }
        } else {
          routes.push(apiHandlerToRouteHandler(
            item.endpoint,
            function(request) {
              return Effect.mapInputContext(
                item.handler(request),
                (input) => Context.merge(context, input)
              )
            },
            item.withFullResponse
          ))
        }
      }
      yield* router.concat(HttpRouter.fromIterable(routes))
    })
  ) as any

/**
 * Add the implementation for an `HttpApiEndpoint` to a `Handlers` group.
 *
 * @since 1.0.0
 * @category handlers
 */
export const handle: {
  <Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any, const Name extends Endpoints["name"], E, R>(
    name: Name,
    handler: HttpApiEndpoint.HttpApiEndpoint.HandlerWithName<Endpoints, Name, E, R>
  ): <EG, RG>(self: HttpApiHandlers.HttpApiHandlers<EG, RG, Endpoints>) => HttpApiHandlers.HttpApiHandlers<
    EG | Exclude<E, HttpApiEndpoint.HttpApiEndpoint.ErrorWithName<Endpoints, Name>> | HttpApiDecodeError,
    RG | HttpApiEndpoint.HttpApiEndpoint.ExcludeProvided<R>,
    HttpApiEndpoint.HttpApiEndpoint.ExcludeName<Endpoints, Name>
  >
  <Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any, const Name extends Endpoints["name"], E, R>(
    name: Name,
    handler: HttpApiEndpoint.HttpApiEndpoint.HandlerResponseWithName<Endpoints, Name, E, R>,
    options: {
      readonly withFullResponse: true
    }
  ): <EG, RG>(self: HttpApiHandlers.HttpApiHandlers<EG, RG, Endpoints>) => HttpApiHandlers.HttpApiHandlers<
    EG | Exclude<E, HttpApiEndpoint.HttpApiEndpoint.ErrorWithName<Endpoints, Name>> | HttpApiDecodeError,
    RG | HttpApiEndpoint.HttpApiEndpoint.ExcludeProvided<R>,
    HttpApiEndpoint.HttpApiEndpoint.ExcludeName<Endpoints, Name>
  >
} = <Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any, const Name extends Endpoints["name"], E, R>(
  name: Name,
  handler: HttpApiEndpoint.HttpApiEndpoint.HandlerWithName<Endpoints, Name, E, R>,
  options?: {
    readonly withFullResponse: true
  }
) =>
<EG, RG>(
  self: HttpApiHandlers.HttpApiHandlers<EG, RG, Endpoints>
): HttpApiHandlers.HttpApiHandlers<
  EG | Exclude<E, HttpApiEndpoint.HttpApiEndpoint.ErrorWithName<Endpoints, Name>> | HttpApiDecodeError,
  RG | HttpApiEndpoint.HttpApiEndpoint.ExcludeProvided<R>,
  HttpApiEndpoint.HttpApiEndpoint.ExcludeName<Endpoints, Name>
> => {
  const o = Chunk.findFirst(self.group.endpoints, (endpoint) => endpoint.name === name)
  if (o._tag === "None") {
    throw new Error(`Endpoint "${name}" not found in group "${self.group.identifier}"`)
  }
  const endpoint = o.value
  return HttpApiHandlers.makeHandlers({
    group: self.group,
    handlers: Chunk.append(self.handlers, HttpApiHandlers.makeHandler(endpoint, handler as any, options)) as any
  })
}

/**
 * Add `HttpMiddleware` to a `Handlers` group.
 *
 * Any errors are required to have a corresponding schema in the API.
 * You can add middleware errors to an `HttpApiGroup` using the `HttpApiGroup.addError`
 * api.
 *
 * @since 1.0.0
 * @category middleware
 */
export const middleware =
  <E, R, E1, R1>(middleware: HttpApiHandlers.HttpApiHandlers.Middleware<E, R, E1, R1>) =>
  <Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any>(
    self: HttpApiHandlers.HttpApiHandlers<E, R, Endpoints>
  ): HttpApiHandlers.HttpApiHandlers<E1, HttpApiEndpoint.HttpApiEndpoint.ExcludeProvided<R1>, Endpoints> =>
    HttpApiHandlers.makeHandlers<E1, HttpApiEndpoint.HttpApiEndpoint.ExcludeProvided<R1>, Endpoints>({
      group: self.group as any,
      handlers: Chunk.append(self.handlers, HttpApiHandlers.makeMiddleware(middleware)) as any
    })

/**
 * @since 1.0.0
 * @category middleware
 */
export class Middleware extends Context.Tag("@effect/platform/HttpApiBuilder/Middleware")<
  Middleware,
  HttpMiddleware.HttpMiddleware
>() {}

/**
 * @since 1.0.0
 * @category middleware
 */
export declare namespace ApiMiddleware {
  /**
   * @since 1.0.0
   * @category middleware
   */
  export type Fn<Error, R = HttpRouter.HttpRouter.Provided> = (
    httpApp: HttpApp.Default
  ) => HttpApp.Default<Error, R>
}

const middlewareAdd = (middleware: HttpMiddleware.HttpMiddleware): Effect.Effect<HttpMiddleware.HttpMiddleware> =>
  Effect.map(
    Effect.context<never>(),
    (context) => {
      const current = Context.getOption(context, Middleware)
      const withContext: HttpMiddleware.HttpMiddleware = (httpApp) =>
        Effect.mapInputContext(middleware(httpApp), (input) => Context.merge(context, input))
      return current._tag === "None" ? withContext : (httpApp) => withContext(current.value(httpApp))
    }
  )

const middlewareAddNoContext = (
  middleware: HttpMiddleware.HttpMiddleware
): Effect.Effect<HttpMiddleware.HttpMiddleware> =>
  Effect.map(
    Effect.serviceOption(Middleware),
    (current): HttpMiddleware.HttpMiddleware => {
      return current._tag === "None" ? middleware : (httpApp) => middleware(current.value(httpApp))
    }
  )

/**
 * Create an `HttpApi` level middleware `Layer`.
 *
 * @since 1.0.0
 * @category middleware
 */
export const middlewareLayer: {
  <EX = never, RX = never>(
    middleware: ApiMiddleware.Fn<never> | Effect.Effect<ApiMiddleware.Fn<never>, EX, RX>,
    options?: {
      readonly withContext?: false | undefined
    }
  ): Layer.Layer<never, EX, RX>
  <R, EX = never, RX = never>(
    middleware: ApiMiddleware.Fn<never, R> | Effect.Effect<ApiMiddleware.Fn<never, R>, EX, RX>,
    options: {
      readonly withContext: true
    }
  ): Layer.Layer<never, EX, HttpRouter.HttpRouter.ExcludeProvided<R> | RX>
  <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR, EX = never, RX = never>(
    api: HttpApi.HttpApi<Groups, Error, ErrorR>,
    middleware: ApiMiddleware.Fn<NoInfer<Error>> | Effect.Effect<ApiMiddleware.Fn<NoInfer<Error>>, EX, RX>,
    options?: {
      readonly withContext?: false | undefined
    }
  ): Layer.Layer<never, EX, RX>
  <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR, R, EX = never, RX = never>(
    api: HttpApi.HttpApi<Groups, Error, ErrorR>,
    middleware: ApiMiddleware.Fn<NoInfer<Error>, R> | Effect.Effect<ApiMiddleware.Fn<NoInfer<Error>, R>, EX, RX>,
    options: {
      readonly withContext: true
    }
  ): Layer.Layer<never, EX, HttpRouter.HttpRouter.ExcludeProvided<R> | RX>
} = (
  ...args: [
    middleware: ApiMiddleware.Fn<any, any> | Effect.Effect<ApiMiddleware.Fn<any, any>, any, any>,
    options?: {
      readonly withContext?: boolean | undefined
    } | undefined
  ] | [
    api: HttpApi.HttpApi.Any,
    middleware: ApiMiddleware.Fn<any, any> | Effect.Effect<ApiMiddleware.Fn<any, any>, any, any>,
    options?: {
      readonly withContext?: boolean | undefined
    } | undefined
  ]
): any => {
  const apiFirst = HttpApi.isHttpApi(args[0])
  const withContext = apiFirst ? args[2]?.withContext === true : (args as any)[1]?.withContext === true
  const add = withContext ? middlewareAdd : middlewareAddNoContext
  const middleware = apiFirst ? args[1] : args[0]
  return Effect.isEffect(middleware)
    ? Layer.effect(Middleware, Effect.flatMap(middleware as any, add))
    : Layer.effect(Middleware, add(middleware as any))
}

/**
 * Create an `HttpApi` level middleware `Layer`, that has a `Scope` provided to
 * the constructor.
 *
 * @since 1.0.0
 * @category middleware
 */
export const middlewareLayerScoped: {
  <EX, RX>(
    middleware: Effect.Effect<ApiMiddleware.Fn<never>, EX, RX>,
    options?: {
      readonly withContext?: false | undefined
    }
  ): Layer.Layer<never, EX, Exclude<RX, Scope>>
  <R, EX, RX>(
    middleware: Effect.Effect<ApiMiddleware.Fn<never, R>, EX, RX>,
    options: {
      readonly withContext: true
    }
  ): Layer.Layer<never, EX, HttpRouter.HttpRouter.ExcludeProvided<R> | Exclude<RX, Scope>>
  <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR, EX, RX>(
    api: HttpApi.HttpApi<Groups, Error, ErrorR>,
    middleware: Effect.Effect<ApiMiddleware.Fn<NoInfer<Error>>, EX, RX>,
    options?: {
      readonly withContext?: false | undefined
    }
  ): Layer.Layer<never, EX, Exclude<RX, Scope>>
  <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR, R, EX, RX>(
    api: HttpApi.HttpApi<Groups, Error, ErrorR>,
    middleware: Effect.Effect<ApiMiddleware.Fn<NoInfer<Error>, R>, EX, RX>,
    options: {
      readonly withContext: true
    }
  ): Layer.Layer<never, EX, HttpRouter.HttpRouter.ExcludeProvided<R> | Exclude<RX, Scope>>
} = (
  ...args: [
    middleware: ApiMiddleware.Fn<any, any> | Effect.Effect<ApiMiddleware.Fn<any, any>, any, any>,
    options?: {
      readonly withContext?: boolean | undefined
    } | undefined
  ] | [
    api: HttpApi.HttpApi.Any,
    middleware: ApiMiddleware.Fn<any, any> | Effect.Effect<ApiMiddleware.Fn<any, any>, any, any>,
    options?: {
      readonly withContext?: boolean | undefined
    } | undefined
  ]
): any => {
  const apiFirst = HttpApi.isHttpApi(args[0])
  const withContext = apiFirst ? args[2]?.withContext === true : (args as any)[1]?.withContext === true
  const add = withContext ? middlewareAdd : middlewareAddNoContext
  const middleware = apiFirst ? args[1] : args[0]
  return Layer.scoped(Middleware, Effect.flatMap(middleware as any, add))
}

/**
 * A CORS middleware layer that can be provided to the `HttpApiBuilder.serve` layer.
 *
 * @since 1.0.0
 * @category middleware
 */
export const middlewareCors = (
  options?: {
    readonly allowedOrigins?: ReadonlyArray<string> | undefined
    readonly allowedMethods?: ReadonlyArray<string> | undefined
    readonly allowedHeaders?: ReadonlyArray<string> | undefined
    readonly exposedHeaders?: ReadonlyArray<string> | undefined
    readonly maxAge?: number | undefined
    readonly credentials?: boolean | undefined
  } | undefined
): Layer.Layer<never> => middlewareLayer(HttpMiddleware.cors(options))

/**
 * A middleware that adds an openapi.json endpoint to the API.
 *
 * @since 1.0.0
 * @category middleware
 */
export const middlewareOpenApi = (
  options?: {
    readonly path?: PathInput | undefined
  } | undefined
): Layer.Layer<never, never, HttpApi.HttpApi.Service> =>
  HttpApiBuilderRouter.use((router) =>
    Effect.gen(function*() {
      const api = yield* HttpApi.HttpApi
      const spec = OpenApi.fromApi(api)
      const response = yield* HttpServerResponse.json(spec).pipe(
        Effect.orDie
      )
      yield* router.addHandler(HttpRouteHandler.get(Route.parse(options?.path ?? "/openapi.json"), response))
    })
  )

/**
 * @since 1.0.0
 * @category middleware
 */
export interface SecurityMiddleware<I, EM = never, RM = never> {
  <Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any, E, R>(
    self: HttpApiHandlers.HttpApiHandlers<E, R, Endpoints>
  ): HttpApiHandlers.HttpApiHandlers<
    E | EM,
    Exclude<R, I> | HttpApiEndpoint.HttpApiEndpoint.ExcludeProvided<RM>,
    Endpoints
  >
}

/**
 * @since 1.0.0
 * @category middleware
 */
export const securityDecode = <Security extends HttpApiSecurity.HttpApiSecurity>(
  self: Security
): Effect.Effect<
  HttpApiSecurity.HttpApiSecurity.Type<Security>,
  HttpApiSecurity.SecurityDecodeError,
  HttpServerRequest.HttpServerRequest | HttpServerRequest.ParsedSearchParams
> => {
  switch (self._tag) {
    case "Or": {
      return securityDecode(self.first).pipe(
        Effect.orElse(() => securityDecode(self.second))
      ) as any
    }
    case "Optional":
      return securityDecode(self.security).pipe(
        Effect.asSome,
        Effect.catchTag("SecurityDecodeError", () => Effect.succeedNone)
      ) as any
    default:
      return securityDecodeBase(self) as any
  }
}

const securityDecodeBase = <Security extends HttpApiSecurity.HttpApiSecurity.Base>(
  self: Security
): Effect.Effect<
  HttpApiSecurity.HttpApiSecurity.Type<Security>,
  HttpApiSecurity.SecurityDecodeError,
  HttpServerRequest.HttpServerRequest | HttpServerRequest.ParsedSearchParams
> => {
  switch (self._tag) {
    case "Authorization": {
      return HttpServerRequest.HttpServerRequest.pipe(
        Effect.flatMap((request) => {
          const authorization = request.headers.authorization ?? ""

          if (!authorization) {
            return new HttpApiSecurity.SecurityDecodeError({
              security: self,
              cause: "Authorization header is missing"
            })
          }

          if (!authorization.toLowerCase().startsWith(`${self.scheme.toLowerCase()} `)) {
            return new HttpApiSecurity.SecurityDecodeError({
              security: self,
              cause: `Authorization header using invalid scheme ${JSON.stringify(authorization.split(" ")[0])}`
            })
          }

          const token = authorization.replace(`${self.scheme} `, "")

          return Effect.succeed(Redacted.make(token) as HttpApiSecurity.HttpApiSecurity.Type<Security>)
        })
      )
    }
    case "ApiKey": {
      const schema = Schema.Struct({
        [self.key]: Schema.String.pipe(Schema.minLength(1))
      })

      return Unify.unify(
        self.in === "query"
          ? HttpServerRequest.schemaSearchParams(schema)
          : self.in === "cookie"
          ? HttpServerRequest.schemaCookies(schema)
          : HttpServerRequest.schemaHeaders(schema)
      ).pipe(
        Effect.map(
          ({ [self.key]: value }) => Redacted.make(value) as HttpApiSecurity.HttpApiSecurity.Type<Security>
        ),
        Effect.catchAll((cause) => {
          return new HttpApiSecurity.SecurityDecodeError({
            security: self,
            cause
          })
        })
      )
    }
    case "Basic": {
      return HttpServerRequest.HttpServerRequest.pipe(
        Effect.flatMap((request) => Encoding.decodeBase64String(request.headers.authorization ?? "")),
        Effect.matchEffect({
          onFailure: () =>
            new HttpApiSecurity.SecurityDecodeError({
              security: self,
              cause: "Authorization header is missing"
            }),
          onSuccess: (header) =>
            Effect.suspend(() => {
              const parts = header.split(":")
              if (parts.length !== 2) {
                return new HttpApiSecurity.SecurityDecodeError({
                  security: self,
                  cause: "Basic auhtorization header is missing"
                })
              }
              return Effect.succeed({
                username: parts[0],
                password: Redacted.make(parts[1])
              } as HttpApiSecurity.HttpApiSecurity.Type<Security>)
            })
        })
      )
    }
  }
}

/**
 * Set a cookie from an `HttpApiSecurity.HttpApiKey` instance.
 *
 * You can use this api before returning a response from an endpoint handler.
 *
 * ```ts
 * ApiBuilder.handle(
 *   "authenticate",
 *   (_) => ApiBuilder.securitySetCookie(security, "secret123")
 * )
 * ```
 *
 * @since 1.0.0
 * @category middleware
 */
export const securitySetCookie: (
  self: HttpApiSecurity.ApiKey,
  value: string | Redacted.Redacted,
  options?: Cookie["options"]
) => Effect.Effect<void> = PlatformHttpApiBuilder.securitySetCookie as any
/**
 * Make a middleware from an `HttpApiSecurity` instance, that can be used when
 * constructing a `Handlers` group.
 *
 * @since 1.0.0
 * @category middleware
 * @example
 * import { HttpApiBuilder, HttpApiSecurity } from "@effect/platform"
 * import { Schema } from "@effect/schema"
 * import { Context, Effect, Redacted } from "effect"
 *
 * class User extends Schema.Class<User>("User")({
 *   id: Schema.Number
 * }) {}
 *
 * class CurrentUser extends Context.Tag("CurrentUser")<CurrentUser, User>() {}
 *
 * class Accounts extends Context.Tag("Accounts")<Accounts, {
 *   readonly findUserByAccessToken: (accessToken: string) => Effect.Effect<User>
 * }>() {}
 *
 * const securityMiddleware = Effect.gen(function*() {
 *   const accounts = yield* Accounts
 *   return HttpApiBuilder.middlewareSecurity(
 *     HttpApiSecurity.bearer,
 *     CurrentUser,
 *     (token) => accounts.findUserByAccessToken(Redacted.value(token))
 *   )
 * })
 */
export const middlewareSecurity = <Security extends HttpApiSecurity.HttpApiSecurity, I, S, EM, RM>(
  self: Security,
  tag: Context.Tag<I, S>,
  f: (
    credentials: HttpApiSecurity.HttpApiSecurity.Type<Security>
  ) => Effect.Effect<S, EM, RM>
): SecurityMiddleware<I, EM, RM> =>
  middleware(Effect.provideServiceEffect(
    tag,
    Effect.flatMap(securityDecode(self), f)
  )) as SecurityMiddleware<I, EM, RM>

/**
 * Make a middleware from an `HttpApiSecurity` instance, that can be used when
 * constructing a `Handlers` group.
 *
 * This version does not supply any context to the HttpApiHandlers.
 *
 * @since 1.0.0
 * @category middleware
 */
export const middlewareSecurityVoid = <Security extends HttpApiSecurity.HttpApiSecurity, X, EM, RM>(
  self: Security,
  f: (
    credentials: HttpApiSecurity.HttpApiSecurity.Type<Security>
  ) => Effect.Effect<X, EM, RM>
): SecurityMiddleware<never, EM, RM> =>
  middleware((httpApp) =>
    securityDecode(self).pipe(
      Effect.flatMap(f),
      Effect.zipRight(httpApp)
    )
  ) as SecurityMiddleware<never, EM, RM>

// internal

const requestPayload = (
  request: HttpServerRequest.HttpServerRequest,
  urlParams: URLSearchParams,
  isMultipart: boolean
): Effect.Effect<
  unknown,
  never,
  | FileSystem
  | Path
  | Scope
> =>
  HttpMethod.hasBody(request.method)
    ? isMultipart
      ? Effect.orDie(request.multipart)
      : Effect.orDie(request.json)
    : Effect.succeed(urlParams)

const apiHandlerToRouteHandler = (
  endpoint: HttpApiEndpoint.HttpApiEndpoint.Any,
  handler: HttpApiEndpoint.HttpApiEndpoint.Handler<any, any, any>,
  isFullResponse: boolean
): HttpRouteHandler.HttpRouteHandler<Route.Route.Any, any, any> => {
  const { guard, route } = asRouteGuard(endpoint.route)
  const isMultipart = endpoint.payloadSchema.pipe(
    Option.map((schema) => HttpApiSchema.getMultipart(schema.ast)),
    Option.getOrElse(() => false)
  )
  const decodePayload = Option.map(endpoint.payloadSchema as Option.Option<Schema.Schema.Any>, Schema.decodeUnknown)
    .pipe(
      Option.map((_) => flow(_, Effect.catchAll(HttpApiDecodeError.refailParseError)))
    )
  const decodeHeaders = Option.map(endpoint.headersSchema as Option.Option<Schema.Schema.Any>, Schema.decodeUnknown)
    .pipe(
      Option.map((_) => flow(_, Effect.catchAll(HttpApiDecodeError.refailParseError)))
    )
  const encoding = HttpApiSchema.getEncoding(endpoint.successSchema.ast)
  const successStatus = HttpApiSchema.getStatusSuccess(endpoint.successSchema)
  const encodeSuccess = Option.map(HttpApiEndpoint.schemaSuccess(endpoint), (schema) => {
    const encode = Schema.encodeUnknown(schema)
    switch (encoding.kind) {
      case "Json": {
        return (body: unknown) =>
          Effect.orDie(
            Effect.flatMap(encode(body), (json) =>
              HttpServerResponse.json(json, {
                status: successStatus,
                contentType: encoding.contentType
              }))
          )
      }
      case "Text": {
        return (body: unknown) =>
          Effect.map(Effect.orDie(encode(body)), (text) =>
            HttpServerResponse.text(text as any, {
              status: successStatus,
              contentType: encoding.contentType
            }))
      }
      case "Uint8Array": {
        return (body: unknown) =>
          Effect.map(Effect.orDie(encode(body)), (data) =>
            HttpServerResponse.uint8Array(data as any, {
              status: successStatus,
              contentType: encoding.contentType
            }))
      }
      case "UrlParams": {
        return (body: unknown) =>
          Effect.map(Effect.orDie(encode(body)), (params) =>
            HttpServerResponse.urlParams(params as any, {
              status: successStatus,
              contentType: encoding.contentType
            }))
      }
    }
  }).pipe(
    Option.map((_) => flow(_, Effect.catchAll(HttpApiDecodeError.refailParseError)))
  )

  return HttpRouteHandler.make(endpoint.method)(
    route,
    Effect.gen(function*() {
      const request = yield* HttpServerRequest.HttpServerRequest
      const url = HttpRouteHandler.getUrlFromServerRequest(request)
      const path = Navigation.getCurrentPathFromUrl(url)
      const inputParams = yield* guard(path)
      if (Option.isNone(inputParams)) {
        return yield* new HttpRouteHandler.RouteNotMatched({ request, route })
      }

      const { params, queryParams }: HttpRouteHandler.CurrentParams<typeof endpoint.route> = Option.match(
        yield* Effect.serviceOption(HttpRouteHandler.CurrentParams),
        {
          onNone: () => ({ params: inputParams.value, queryParams: url.searchParams }),
          onSome: (existing) => ({
            params: { ...existing.params, ...inputParams.value },
            queryParams: existing.queryParams
          })
        }
      )

      const input: {
        path: any
        payload?: unknown
        headers?: unknown
      } = {
        path: inputParams.value
      }

      if (Option.isSome(decodePayload)) {
        input.payload = yield* requestPayload(request, queryParams, isMultipart).pipe(
          Effect.flatMap((raw) => decodePayload.value(raw))
        )
      }

      if (Option.isSome(decodeHeaders)) {
        input.headers = yield* decodeHeaders.value(request.headers)
      }

      const response = yield* handler(input as any).pipe(
        Effect.provide(Layer.mergeAll(
          Navigation.initialMemory({ url }),
          CurrentRoute.layer({ route, parent: yield* Effect.serviceOption(CurrentRoute) }),
          HttpRouteHandler.currentParamsLayer<typeof endpoint.route>({
            params,
            queryParams: url.searchParams
          })
        ))
      )

      if (isFullResponse) {
        return yield* HttpServerRespondable.toResponse(response as any)
      }

      if (Option.isSome(encodeSuccess)) {
        return yield* encodeSuccess.value(response)
      }

      return yield* HttpServerResponse.empty({ status: successStatus })
    })
  )
}

const astCache = globalValue(
  "@effect/platform/HttpApiBuilder/astCache",
  () => new WeakMap<AST.AST, Schema.Schema.Any>()
)

const makeErrorSchema = (
  api: HttpApi.HttpApi<HttpApiGroup.HttpApiGroup<string, HttpApiEndpoint.HttpApiEndpoint.Any>, any, any>
): Schema.Schema<unknown, HttpServerResponse.HttpServerResponse> => {
  const schemas = new Set<Schema.Schema.Any>()
  function processSchema(schema: Schema.Schema.Any): void {
    if (astCache.has(schema.ast)) {
      schemas.add(astCache.get(schema.ast)!)
      return
    }
    const ast = schema.ast
    if (ast._tag === "Union") {
      for (const astType of ast.types) {
        const errorSchema = Schema.make(astType).annotations({
          ...ast.annotations,
          ...astType.annotations
        })
        astCache.set(astType, errorSchema)
        schemas.add(errorSchema)
      }
    } else {
      astCache.set(ast, schema)
      schemas.add(schema)
    }
  }
  processSchema(api.errorSchema)
  for (const group of api.groups) {
    for (const endpoint of group.endpoints) {
      processSchema(endpoint.errorSchema as Schema.Schema.Any)
    }
    processSchema(group.errorSchema)
  }
  return Schema.Union(...[...schemas].map((schema) => {
    const status = HttpApiSchema.getStatusError(schema)
    const encoded = AST.encodedAST(schema.ast)
    const isEmpty = encoded._tag === "VoidKeyword"
    return Schema.transformOrFail(Schema.Any, schema, {
      decode: (_, __, ast) => ParseResult.fail(new ParseResult.Forbidden(ast, _, "Encode only schema")),
      encode: (error, _, ast) =>
        isEmpty ?
          HttpServerResponse.empty({ status }) :
          HttpServerResponse.json(error, { status }).pipe(
            Effect.mapError((error) => new ParseResult.Type(ast, error, "Could not encode to JSON"))
          )
    })
  })) as any
}
