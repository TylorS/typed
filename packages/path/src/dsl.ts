/* Start Region: Parameter DSL */

import { Param, Optional, Prefix, Unnamed, QueryParam, ZeroOrMore, OneOrMore } from './ast.js'

export const param = <A extends string>(param: A): Param<A> => `:${param}` as Param<A>

export const optional = <A extends string>(param: A): Optional<A> => `${param}?` as Optional<A>

export const prefix = <P extends string, A extends Param<string> | Unnamed>(prefix: P, param: A) =>
  `{${prefix}${param}}` as Prefix<P, A>

export type FormatQueryParams<
  Q extends readonly QueryParam<any, any>[],
  R extends string = ``,
> = Q extends readonly [
  infer Head extends string,
  ...infer Tail extends readonly QueryParam<any, any>[],
]
  ? FormatQueryParams<Tail, `` extends R ? `\\?${Head}` : `${R}&${Head}`>
  : R

export const queryParams = <P extends readonly [QueryParam<any, any>, ...QueryParam<any, any>]>(
  ...params: P
): FormatQueryParams<P> => `\\?${params.join('&')}` as FormatQueryParams<P>

export const queryParam = <K extends string, V extends string>(key: K, value: V) =>
  `${key}=${value}` as QueryParam<K, V>

export const zeroOrMore = <A extends string>(param: A): ZeroOrMore<A> =>
  `:${param}*` as ZeroOrMore<A>

export const oneOrMore = <A extends string>(param: A): OneOrMore<A> => `:${param}+` as OneOrMore<A>

export const unnamed: Unnamed = `(.*)` as const

/* End Region: Parameter DSL */
