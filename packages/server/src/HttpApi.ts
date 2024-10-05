/**
 * @since 1.0.0
 */
import * as PlatformHttpApi from "@effect/platform/HttpApi"
import type * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import type { HttpMethod } from "@effect/platform/HttpMethod"
import type * as AST from "@effect/schema/AST"
import type * as Schema from "@effect/schema/Schema"
import type { MatchInput } from "@typed/router"
import type * as Context from "effect/Context"
import type * as Option from "effect/Option"
import * as Predicate from "effect/Predicate"
import type * as HttpApiEndpoint from "./HttpApiEndpoint.js"
import type * as HttpApiGroup from "./HttpApiGroup.js"

/**
 * @since 1.0.0
 * @category type ids
 */
export const TypeId: unique symbol = Symbol.for("@effect/platform/HttpApi")

/**
 * @since 1.0.0
 * @category type ids
 */
export type TypeId = typeof TypeId

/**
 * @since 1.0.0
 * @category guards
 */
export const isHttpApi = (u: unknown): u is HttpApi<any, any> => Predicate.hasProperty(u, TypeId)

/**
 * An `HttpApi` represents a collection of `HttpApiGroup`s. You can use an `HttpApi` to
 * represent your entire domain.
 *
 * @since 1.0.0
 * @category models
 */
export type HttpApi<
  out Groups extends HttpApiGroup.HttpApiGroup.Any = never,
  in out Error = never,
  out ErrorR = never
> = PlatformHttpApi.HttpApi<Groups, Error, ErrorR>

export const HttpApi = PlatformHttpApi.HttpApi

export declare namespace HttpApi {
  /**
   * @since 1.0.0
   * @category models
   */
  export type Service = PlatformHttpApi.HttpApi.Service

  /**
   * @since 1.0.0
   * @category models
   */
  export type Any = PlatformHttpApi.HttpApi.Any

  /**
   * @since 1.0.0
   * @category models
   */
  export type Context<A> = PlatformHttpApi.HttpApi.Context<A>
}

/**
 * An empty `HttpApi`. You can use this to start building your `HttpApi`.
 *
 * You can add groups to this `HttpApi` using the `addGroup` function.
 *
 * @since 1.0.0
 * @category constructors
 */
export const empty: HttpApi = PlatformHttpApi.empty

/**
 * Add a `HttpApiGroup` to an `HttpApi`.
 *
 * @since 1.0.0
 * @category constructors
 */
export const addGroup: {
  <Group extends HttpApiGroup.HttpApiGroup.Any>(
    group: Group
  ): <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR>(
    self: HttpApi<Groups, Error, ErrorR>
  ) => HttpApi<Groups | Group, Error, ErrorR>
  <Group extends HttpApiGroup.HttpApiGroup.Any, Prefix extends MatchInput.Any>(
    prefix: Prefix,
    group: Group
  ): <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR>(
    self: HttpApi<Groups, Error, ErrorR>
  ) => HttpApi<Groups | Group, Error, ErrorR>
  <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR, Group extends HttpApiGroup.HttpApiGroup.Any>(
    self: HttpApi<Groups, Error, ErrorR>,
    group: Group
  ): HttpApi<Groups | Group, Error, ErrorR>
  <
    Groups extends HttpApiGroup.HttpApiGroup.Any,
    Error,
    ErrorR,
    Group extends HttpApiGroup.HttpApiGroup.Any,
    Prefix extends MatchInput.Any
  >(
    self: HttpApi<Groups, Error, ErrorR>,
    prefix: Prefix,
    group: Group
  ): HttpApi<Groups | Group, Error, ErrorR>
} = PlatformHttpApi.addGroup

/**
 * Add an error schema to an `HttpApi`, which is shared by all endpoints in the
 * `HttpApi`.
 *
 * Useful for adding error types from middleware or other shared error types.
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
  ): <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR>(
    self: HttpApi<Groups, Error, ErrorR>
  ) => HttpApi<Groups, Error | A, ErrorR | R>
  <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR, A, I, R>(
    self: HttpApi<Groups, Error, ErrorR>,
    schema: Schema.Schema<A, I, R>,
    annotations?: {
      readonly status?: number | undefined
    }
  ): HttpApi<Groups, Error | A, ErrorR | R>
} = PlatformHttpApi.addError

/**
 * @since 1.0.0
 * @category annotations
 */
export const annotateMerge: {
  <I>(context: Context.Context<I>): <A extends HttpApi.Any>(self: A) => A
  <A extends HttpApi.Any, I>(self: A, context: Context.Context<I>): A
} = PlatformHttpApi.annotateMerge

/**
 * @since 1.0.0
 * @category annotations
 */
export const annotate: {
  <I, S>(tag: Context.Tag<I, S>, value: S): <A extends HttpApi.Any>(self: A) => A
  <A extends HttpApi.Any, I, S>(self: A, tag: Context.Tag<I, S>, value: S): A
} = PlatformHttpApi.annotate

/**
 * Extract metadata from an `HttpApi`, which can be used to generate documentation
 * or other tooling.
 *
 * See the `OpenApi` & `HttpApiClient` modules for examples of how to use this function.
 *
 * @since 1.0.0
 * @category reflection
 */
export const reflect = <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR>(
  self: HttpApi<Groups, Error, ErrorR>,
  options: {
    readonly onGroup: (options: {
      readonly group: HttpApiGroup.HttpApiGroup<string, any>
      readonly mergedAnnotations: Context.Context<never>
    }) => void
    readonly onEndpoint: (options: {
      readonly group: HttpApiGroup.HttpApiGroup<string, any>
      readonly endpoint: HttpApiEndpoint.HttpApiEndpoint<string, HttpMethod, MatchInput.Any>
      readonly mergedAnnotations: Context.Context<never>
      readonly successAST: Option.Option<AST.AST>
      readonly successStatus: number
      readonly successEncoding: HttpApiSchema.Encoding
      readonly errors: ReadonlyMap<number, Option.Option<AST.AST>>
    }) => void
  }
) => PlatformHttpApi.reflect(self, options as any)
