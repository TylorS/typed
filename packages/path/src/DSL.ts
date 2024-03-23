/**
 * DSL for subset of path-to-regexp syntax
 *
 * @since 1.0.0
 */

import type { S } from "ts-toolbelt"

/* Start Region: Parameter DSL */

/**
 * Template for parameters
 * @category Model
 * @since 1.0.0
 */
export type Param<A extends string> = `:${A}`

/**
 * @category Constructor
 * @since 1.0.0
 */
export const param = <A extends string>(param: A): Param<A> => `:${param}` as Param<A>

/**
 * Template for parameters
 * @category Model
 * @since 1.0.0
 */
export type ParamWithOptions<A extends string, Options extends ReadonlyArray<string>> = `:${A}(${S.Join<Options, "|">})`

/**
 * @category Constructor
 * @since 1.0.0
 */
export const paramWithOptions = <const A extends string, Options extends ReadonlyArray<string>>(
  param: A,
  ...options: Options
): ParamWithOptions<A, Options> => `:${param}(${options.join("|")})` as ParamWithOptions<A, Options>

/**
 * Template for optional path parts
 * @category Model
 * @since 1.0.0
 */
export type Optional<A extends string> = `${A}?`

/**
 * @category Constructor
 * @since 1.0.0
 */
export const optional = <A extends string>(param: A): Optional<A> => `${param}?` as Optional<A>

/**
 *  Construct a custom prefix
 * @category Model
 * @since 1.0.0
 */
export type Prefix<P extends string, A extends string> = `{${P}${A}}`

/**
 * @category Constructor
 * @since 1.0.0
 */
export const prefix = <P extends string, A extends string>(prefix: P, param: A) => `{${prefix}${param}}` as Prefix<P, A>

/**
 * Construct query params
 * @category Model
 * @since 1.0.0
 */
export type QueryParam<K extends string, V extends string> = `` extends V ? K : `${K}=${V}`

/**
 * Construct query params
 * @category Constructor
 * @since 1.0.0
 */
export const queryParam = <K extends string, V extends string>(key: K, value: V) =>
  `${key}=${value}` as QueryParam<K, V>

/**
 * zero or more path parts will be matched to this param
 * @category Model
 * @since 1.0.0
 */
export type ZeroOrMore<A extends string> = `${A}*`

/**
 * @category Constructor
 * @since 1.0.0
 */
export const zeroOrMore = <A extends string>(param: A): ZeroOrMore<A> => `${param}*` as ZeroOrMore<A>

/**
 * @category Model
 * @since 1.0.0
 */
export type OneOrMore<A extends string> = `${A}+`

/**
 * one or more path parts will be matched to this param
 * @category Constructor
 * @since 1.0.0
 */
export const oneOrMore = <A extends string>(param: A): OneOrMore<A> => `${param}+` as OneOrMore<A>

/**
 *  Creates the path-to-regexp syntax for query parameters
 * @category Model
 * @since 1.0.0
 */
export type QueryParams<
  Q extends ReadonlyArray<QueryParam<any, any>>,
  R extends string = ``
> = Q extends readonly [
  infer Head extends string,
  ...infer Tail extends ReadonlyArray<QueryParam<any, any>>
] ? QueryParams<Tail, `` extends R ? `\\?${Head}` : `${R}&${Head}`>
  : R

/**
 * @category Constructor
 * @since 1.0.0
 */
export const queryParams = <P extends readonly [QueryParam<any, any>, ...QueryParam<any, any>]>(
  ...params: P
): QueryParams<P> => `\\?${params.join("&")}` as QueryParams<P>

/**
 * @category Constructor
 * @since 1.0.0
 */
export const unnamed = `(.*)` as const

/**
 * @category Model
 * @since 1.0.0
 */
export type Unnamed = typeof unnamed
