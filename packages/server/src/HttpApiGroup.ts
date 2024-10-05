/**
 * @since 1.0.0
 */
import type { HttpApiDecodeError } from "@effect/platform/HttpApiError"
import * as PlatformHttpApiGroup from "@effect/platform/HttpApiGroup"
import type * as Schema from "@effect/schema/Schema"
import type * as Router from "@typed/router"
import * as Chunk from "effect/Chunk"
import type * as Context from "effect/Context"
import { dual } from "effect/Function"
import * as HttpApiEndpoint from "./HttpApiEndpoint.js"

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
