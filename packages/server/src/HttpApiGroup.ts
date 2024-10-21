/**
 * @since 1.0.0
 */
import {
  HttpApiSchema,
  HttpMethod,
  HttpServerRequest,
  HttpServerRespondable,
  HttpServerResponse
} from "@effect/platform"
import { HttpApiDecodeError } from "@effect/platform/HttpApiError"
import * as PlatformHttpApiGroup from "@effect/platform/HttpApiGroup"
import * as Schema from "@effect/schema/Schema"
import type { Route } from "@typed/route"
import * as Router from "@typed/router"
import type { Layer } from "effect"
import { Chunk, Context, Effect, Option, Unify } from "effect"
import { dual, flow } from "effect/Function"
import type { Mutable } from "effect/Types"
import * as HttpApiEndpoint from "./HttpApiEndpoint.js"
import * as HttpApiHandlers from "./HttpApiHandlers.js"
import { HttpApiRouter } from "./HttpApiRouter.js"
import * as HttpRouteHandler from "./HttpRouteHandler.js"
import { fromIterable } from "./HttpRouter.js"

/**
 * @since 1.0.0
 * @category guards
 */
export const isHttpApiGroup: (u: unknown) => u is HttpApiGroup.Any = PlatformHttpApiGroup.isHttpApiGroup

/**
 * An `HttpApiGroup` is a collection of `HttpApiEndpoint`s. You can use an `HttpApiGroup` to
 * represent a portion of your domain.
 *
 * The endpoints can be implemented later using the `HttpApiBuilder.group` api.
 *
 * @since 1.0.0
 * @category models
 */
export type HttpApiGroup<
  Name extends string,
  Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any = never,
  Error = HttpApiDecodeError,
  ErrorR = never
> = PlatformHttpApiGroup.HttpApiGroup<Name, Endpoints, Error, ErrorR>

/**
 * @since 1.0.0
 * @category models
 */
export declare namespace HttpApiGroup {
  /**
   * @since 1.0.0
   * @category models
   */
  export type Any =
    | HttpApiGroup<any, any, any, any>
    | HttpApiGroup<any, any, any, never>
    | HttpApiGroup<any, any, never, never>

  /**
   * @since 1.0.0
   * @category models
   */
  export interface Service<Name extends string> {
    readonly _: unique symbol
    readonly name: Name
  }

  /**
   * @since 1.0.0
   * @category models
   */
  export type ToService<Group> = Group extends HttpApiGroup<infer Name, infer _Endpoints, infer _Error, infer _ErrorR>
    ? Service<Name>
    : never

  /**
   * @since 1.0.0
   * @category models
   */
  export type WithName<Group, Name extends string> = Extract<Group, { readonly identifier: Name }>

  /**
   * @since 1.0.0
   * @category models
   */
  export type Endpoints<Group> = Group extends HttpApiGroup<infer _Name, infer _Endpoints, infer _Error, infer _ErrorR>
    ? _Endpoints
    : never

  /**
   * @since 1.0.0
   * @category models
   */
  export type EndpointsWithName<Group extends Any, Name extends string> = Endpoints<WithName<Group, Name>>

  /**
   * @since 1.0.0
   * @category models
   */
  export type Error<Group> = Group extends HttpApiGroup<infer _Name, infer _Endpoints, infer _Error, infer _ErrorR> ?
    _Error
    : never

  /**
   * @since 1.0.0
   * @category models
   */
  export type ErrorWithName<Group extends Any, Name extends string> = Error<WithName<Group, Name>>

  /**
   * @since 1.0.0
   * @category models
   */
  export type Context<Group> = Group extends HttpApiGroup<infer _Name, infer _Endpoints, infer _Error, infer _ErrorR>
    ? _ErrorR | HttpApiEndpoint.HttpApiEndpoint.Context<_Endpoints>
    : never

  /**
   * @since 1.0.0
   * @category models
   */
  export type ContextWithName<Group extends Any, Name extends string> = Context<WithName<Group, Name>>
}

/**
 * An `HttpApiGroup` is a collection of `HttpApiEndpoint`s. You can use an `HttpApiGroup` to
 * represent a portion of your domain.
 *
 * The endpoints can be implemented later using the `HttpApiBuilder.group` api.
 *
 * @since 1.0.0
 * @category constructors
 */
export const make: <Name extends string>(identifier: Name) => HttpApiGroup<Name> = PlatformHttpApiGroup.make

/**
 * Add an `HttpApiEndpoint` to an `HttpApiGroup`.
 *
 * @since 1.0.0
 * @category endpoints
 */
export const add: {
  <A extends HttpApiEndpoint.HttpApiEndpoint.Any>(
    endpoint: A
  ): <Name extends string, Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any, Error, ErrorR>(
    self: HttpApiGroup<Name, Endpoints, Error, ErrorR>
  ) => HttpApiGroup<Name, Endpoints | A, Error, ErrorR>
  <
    Name extends string,
    Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any,
    Error,
    ErrorR,
    A extends HttpApiEndpoint.HttpApiEndpoint.Any
  >(
    self: HttpApiGroup<Name, Endpoints, Error, ErrorR>,
    endpoint: A
  ): HttpApiGroup<Name, Endpoints | A, Error, ErrorR>
} = dual(2, <
  Name extends string,
  Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any,
  Error,
  ErrorR,
  A extends HttpApiEndpoint.HttpApiEndpoint.Any
>(
  self: HttpApiGroup<Name, Endpoints, Error, ErrorR>,
  endpoint: A
): HttpApiGroup<Name, Endpoints | A, Error, ErrorR> => PlatformHttpApiGroup.add(self, endpoint))

/**
 * Add an error schema to an `HttpApiGroup`, which is shared by all endpoints in the
 * group.
 *
 * @since 1.0.0
 * @category errors
 */
export const addError: {
  <A, I, R>(
    schema: Schema.Schema<A, I, R>,
    annotations?: {
      readonly status?: number | undefined
    }
  ): <Name extends string, Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any, Error, ErrorR>(
    self: HttpApiGroup<Name, Endpoints, Error, ErrorR>
  ) => HttpApiGroup<Name, Endpoints, Error | A, ErrorR | R>
  <Name extends string, Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any, Error, ErrorR, A, I, R>(
    self: HttpApiGroup<Name, Endpoints, Error, ErrorR>,
    schema: Schema.Schema<A, I, R>,
    annotations?: {
      readonly status?: number | undefined
    }
  ): HttpApiGroup<Name, Endpoints, Error | A, ErrorR | R>
} = PlatformHttpApiGroup.addError

/**
 * Add a path prefix to all endpoints in an `HttpApiGroup`. Note that this will only
 * add the prefix to the endpoints before this api is called.
 *
 * @since 1.0.0
 * @category endpoints
 */
export const prefix: {
  <Prefix extends Router.MatchInput.Any>(
    prefix: Prefix
  ): <Name extends string, Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any, Error, ErrorR>(
    self: HttpApiGroup<Name, Endpoints, Error, ErrorR>
  ) => HttpApiGroup<
    Name,
    HttpApiEndpoint.HttpApiEndpoint.WithPrefix<Prefix, Endpoints>,
    Error,
    ErrorR
  >
  <
    Name extends string,
    Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any,
    Error,
    ErrorR,
    Prefix extends Router.MatchInput.Any
  >(
    self: HttpApiGroup<Name, Endpoints, Error, ErrorR>,
    prefix: Prefix
  ): HttpApiGroup<
    Name,
    HttpApiEndpoint.HttpApiEndpoint.WithPrefix<Prefix, Endpoints>,
    Error,
    ErrorR
  >
} = dual(
  2,
  <
    Name extends string,
    Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any,
    Error,
    ErrorR,
    Prefix extends Router.MatchInput.Any
  >(
    self: HttpApiGroup<Name, Endpoints, Error, ErrorR>,
    prefix: Prefix
  ): HttpApiGroup<
    Name,
    HttpApiEndpoint.HttpApiEndpoint.WithPrefix<Prefix, Endpoints>,
    Error,
    ErrorR
  > =>
    Object.assign(
      self,
      { endpoints: Chunk.map(self.endpoints, (endpoint) => HttpApiEndpoint.prefix(prefix)(endpoint)) }
    )
)

/**
 * Merge the annotations of an `HttpApiGroup` with a new context.
 *
 * @since 1.0.0
 * @category annotations
 */
export const annotateMerge: {
  <I>(context: Context.Context<I>): <A extends HttpApiGroup.Any>(self: A) => A
  <A extends HttpApiGroup.Any, I>(self: A, context: Context.Context<I>): A
} = PlatformHttpApiGroup.annotateMerge

/**
 * Add an annotation to an `HttpApiGroup`.
 *
 * @since 1.0.0
 * @category annotations
 */
export const annotate: {
  <I, S>(tag: Context.Tag<I, S>, value: S): <A extends HttpApiGroup.Any>(self: A) => A
  <A extends HttpApiGroup.Any, I, S>(self: A, tag: Context.Tag<I, S>, value: S): A
} = PlatformHttpApiGroup.annotate

/**
 * For each endpoint in an `HttpApiGroup`, update the annotations with a new
 * context.
 *
 * Note that this will only update the annotations before this api is called.
 *
 * @since 1.0.0
 * @category annotations
 */
export const annotateEndpointsMerge: {
  <I>(context: Context.Context<I>): <A extends HttpApiGroup.Any>(self: A) => A
  <A extends HttpApiGroup.Any, I>(self: A, context: Context.Context<I>): A
} = PlatformHttpApiGroup.annotateEndpointsMerge

/**
 * For each endpoint in an `HttpApiGroup`, add an annotation.
 *
 * Note that this will only add the annotation to the endpoints before this api
 * is called.
 *
 * @since 1.0.0
 * @category annotations
 */
export const annotateEndpoints: {
  <I, S>(tag: Context.Tag<I, S>, value: S): <A extends HttpApiGroup.Any>(self: A) => A
  <A extends HttpApiGroup.Any, I, S>(self: A, tag: Context.Tag<I, S>, value: S): A
} = PlatformHttpApiGroup.annotateEndpoints

/**
 * @since 1.0.0
 */
export const build = <
  Name extends string,
  Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any,
  Error,
  ErrorR,
  EH,
  RH,
  EX = never,
  RX = never
>(
  group: HttpApiGroup<Name, Endpoints, Error, ErrorR>,
  builder: (
    handlers: HttpApiHandlers.HttpApiHandlers<never, ErrorR, HttpApiGroup.Endpoints<typeof group>>
  ) =>
    | HttpApiHandlers.HttpApiHandlers<EH | HttpApiGroup.Error<typeof group>, RH>
    | Effect.Effect<
      HttpApiHandlers.HttpApiHandlers<EH | HttpApiGroup.Error<typeof group>, RH>,
      EX,
      RX
    >
): Layer.Layer<
  HttpApiGroup.ToService<typeof group>,
  EX,
  RH | RX | HttpApiGroup.ContextWithName<typeof group, Name> | HttpApiRouter
> =>
  HttpApiRouter.use((router) =>
    Effect.gen(function*() {
      const context = yield* Effect.context<any>()
      const currentRoute = Context.getOption(context, Router.CurrentRoute)
      const result = builder(HttpApiHandlers.makeHandlers({ group, handlers: Chunk.empty() }))
      const { handlers } = Effect.isEffect(result) ? (yield* result) : result
      const routes: Array<HttpRouteHandler.HttpRouteHandler<any, any, any>> = []

      for (const item of handlers) {
        if (item._tag === "Middleware") {
          for (const route of routes) {
            const handler = route.handler
            ;(route as Mutable<HttpRouteHandler.HttpRouteHandler<any, any, any>>).handler = item.middleware(
              Option.match(
                currentRoute,
                {
                  onNone: () => handler as any,
                  onSome: (currentRoute) => HttpRouteHandler.prefix(handler as any, currentRoute.route)
                }
              )
            )
          }
        } else {
          routes.push(apiHandlerToRouteHandler(
            Option.match(
              currentRoute,
              {
                onNone: () => item.endpoint,
                onSome: (currentRoute) => HttpApiEndpoint.prefix(item.endpoint, currentRoute.route)
              }
            ),
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

      yield* router.concat(fromIterable(routes))
    })
  ) as any

// internal

const requestPayload = (
  request: HttpServerRequest.HttpServerRequest,
  urlParams: URLSearchParams,
  isMultipart: boolean
) =>
  Unify.unify(
    HttpMethod.hasBody(request.method)
      ? isMultipart
        ? Effect.orDie(request.multipart)
        : Effect.orDie(request.json)
      : Effect.succeed(urlParams)
  )

const apiHandlerToRouteHandler = (
  endpoint: HttpApiEndpoint.HttpApiEndpoint.Any,
  handler: HttpApiEndpoint.HttpApiEndpoint.Handler<any, any, any>,
  isFullResponse: boolean
): HttpRouteHandler.HttpRouteHandler<Route.Any, any, any> => {
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
    endpoint.route as any,
    Effect.gen(function*() {
      const request = yield* HttpServerRequest.HttpServerRequest
      const { params, queryParams } = (yield* HttpRouteHandler.CurrentParams) as HttpRouteHandler.CurrentParams<
        typeof endpoint.route
      >

      const input: {
        path: any
        payload?: unknown
        headers?: unknown
      } = {
        path: params
      }

      if (Option.isSome(decodePayload)) {
        input.payload = yield* requestPayload(request, queryParams, isMultipart).pipe(
          Effect.flatMap((raw) => decodePayload.value(raw))
        )
      }

      if (Option.isSome(decodeHeaders)) {
        input.headers = yield* decodeHeaders.value(request.headers)
      }

      const response = yield* handler(input as any)

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
