/**
 * @typed/path is a collection of helpers for constructing paths that follow
 * the path-to-regexp syntax and type-level combinators for parsing that syntax and
 * for interpolating values.
 * @since 1.0.0
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */

import type { A, N } from "ts-toolbelt"

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
export const prefix = <P extends string, A extends Param<string> | Unnamed>(prefix: P, param: A) =>
  `{${prefix}${param}}` as Prefix<P, A>

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
export type ZeroOrMore<A extends string> = `${Param<A>}*`

/**
 * @category Constructor
 * @since 1.0.0
 */
export const zeroOrMore = <A extends string>(param: A): ZeroOrMore<A> => `:${param}*` as ZeroOrMore<A>

/**
 * @category Model
 * @since 1.0.0
 */
export type OneOrMore<A extends string> = `${Param<A>}+`

/**
 * one or more path parts will be matched to this param
 * @category Constructor
 * @since 1.0.0
 */
export const oneOrMore = <A extends string>(param: A): OneOrMore<A> => `:${param}+` as OneOrMore<A>

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

/**
 * Composes other path parts into a single path
 * @category Type-level
 * @since 1.0.0
 */
export type PathJoin<A extends ReadonlyArray<string>> = A extends readonly [
  infer Head extends string,
  ...infer Tail extends ReadonlyArray<string>
] ? `${FormatPart<Head>}${PathJoin<Tail>}`
  : ``

/**
 * Join together path parts
 * @category Combinator
 * @since 1.0.0
 */
export const pathJoin = <P extends ReadonlyArray<string>>(...parts: P): PathJoin<P> => {
  if (parts.length === 0) {
    return `` as PathJoin<P>
  }

  const [head, ...tail] = parts

  return (`${formatPart(head)}${pathJoin(...tail)}` || "/") as PathJoin<P>
}

/**
 * Formats a piece of a path
 * @category Combinator
 * @since 1.0.0
 */
export const formatPart = (part: string) => {
  part = removeLeadingSlash(part)
  part = removeTrailingSlash(part)

  if (part.startsWith("{")) {
    return part
  }

  if (part.startsWith("\\?")) {
    return part
  }

  return part === "" ? "" : `/${part}`
}

/**
 * @category Type-level
 * @since 1.0.0
 */
export type FormatPart<P extends string> = A.Equals<string, P> extends 1 ? `/${string}`
  : `` extends P ? P
  : RemoveTrailingSlash<RemoveLeadingSlash<P>> extends `\\?${infer _}` ? RemoveTrailingSlash<RemoveLeadingSlash<P>>
  : RemoveTrailingSlash<RemoveLeadingSlash<P>> extends `{${infer _}` ? RemoveTrailingSlash<RemoveLeadingSlash<P>>
  : P extends QueryParam<infer _, infer _> | QueryParams<infer _, infer _> ? P
  : `/${RemoveTrailingSlash<RemoveLeadingSlash<P>>}`

/**
 * Remove forward slashes prefixes recursively
 * @category Type-level
 * @since 1.0.0
 */
export type RemoveLeadingSlash<A> = A extends `/${infer R}` ? RemoveLeadingSlash<R> : A

/**
 * @category Combinator
 * @since 1.0.0
 */
export const removeLeadingSlash = <A extends string>(a: A): RemoveLeadingSlash<A> => {
  let s = a.slice()

  while (s.startsWith("/")) {
    s = s.slice(1)
  }

  return s as RemoveLeadingSlash<A>
}

/**
 * @category Combinator
 * @since 1.0.0
 */
export const removeTrailingSlash = <A extends string>(a: A): RemoveTrailingSlash<A> => {
  let s = a.slice()

  while (s.endsWith("/")) {
    s = s.slice(0, -1)
  }

  return s as RemoveTrailingSlash<A>
}

/**
 * Remove forward slashes postfixes recursively
 * @category Type-level
 * @since 1.0.0
 */
export type RemoveTrailingSlash<A> = A extends `${infer R}/` ? RemoveTrailingSlash<R> : A

/* End Region: Parameter DSL */

/* Start Region: Extract Parameters from Path */

/**
 * Extract the parameters out of a path
 * @category Type-level
 * @since 1.0.0
 */
export type ParamsOf<A extends string> = Compact<PartsToParams<PathToParts<A>>>

/**
 * Extract the Query parameters out of a path
 * @category Type-level
 * @since 1.0.0
 */
export type QueryParamsOf<P extends string> = Compact<QueryToParams<PathToQuery<P>>>

/**
 * Convert a path back into a tuple of path parts
 * @category Type-level
 * @since 1.0.0
 */
export type PathToParts<P> = P extends `${infer Head}\\?${infer Tail}` ? readonly [...PathToParts<Head>, `\\?${Tail}`]
  : P extends `${infer Head}/${infer Tail}` ? readonly [...PathToParts<Head>, ...PathToParts<Tail>]
  : P extends `${infer Head}{${infer Q}}?${infer Tail}`
    ? readonly [...PathToParts<Head>, `{${Q}}?`, ...PathToParts<`${Tail}`>]
  : P extends `${infer Head}{${infer Q}}${infer Tail}`
    ? readonly [...PathToParts<Head>, `{${Q}}`, ...PathToParts<`${Tail}`>]
  : A.Equals<``, P> extends 1 ? readonly []
  : readonly [P]

/**
 * Convert a path back into a tuple of path parts
 * @category Type-level
 * @since 1.0.0
 */
export type PartsToParams<A extends ReadonlyArray<string>, AST = {}> = A extends readonly [
  infer Head extends string,
  ...infer Tail extends ReadonlyArray<string>
] ? PartsToParams<Tail, AST & PartToParam<Head, AST>>
  : AST

/**
 * @category Type-level
 * @since 1.0.0
 */
export type PartToParam<A extends string, AST> = A extends `\\${infer R}`
  ? PartsToParams<QueryParamsToParts<R, []>, AST>
  : A extends Unnamed ? {
      readonly [K in FindNextIndex<AST> extends number ? FindNextIndex<AST> : never]: string
    }
  : A extends `${infer _}${Unnamed}}?`
    ? { readonly [K in FindNextIndex<AST> extends number ? FindNextIndex<AST> : never]?: string }
  : A extends `${infer _}${Unnamed}}`
    ? { readonly [K in FindNextIndex<AST> extends number ? FindNextIndex<AST> : never]: string }
  : A extends `${infer _}${Param<infer R>}}?` ? { readonly [K in R]?: string }
  : A extends `${infer _}${Param<infer R>}}` ? { readonly [K in R]: string }
  : A extends `${infer _}${Param<infer R>}?` ? { readonly [K in R]?: string }
  : A extends `${infer _}${Param<infer R>}+` ? { readonly [K in R]: readonly [string, ...Array<string>] }
  : A extends `${infer _}${Param<infer R>}*` ? { readonly [K in R]: ReadonlyArray<string> }
  : A extends `${infer _}${Param<infer R>}` ? { readonly [K in R]: string }
  : {}

/**
 * @category Type-level
 * @since 1.0.0
 */
export type QueryParamsToParts<
  Q extends string,
  R extends ReadonlyArray<string>
> = Q extends `\\?${infer Q}` ? QueryParamsToParts<Q, R>
  : Q extends `?${infer Q}` ? QueryParamsToParts<Q, R>
  : Q extends `${infer Head}&${infer Tail}` ? QueryParamsToParts<Tail, QueryParamsToParts<Head, R>>
  : readonly [...R, QueryParamValue<Q>]

/**
 * @category Type-level
 * @since 1.0.0
 */
export type QueryToParams<Q extends string, AST = {}> = Q extends `${infer Head}&${infer Tail}`
  ? QueryToParams<Tail, QueryToParams<Head, AST>>
  : Q extends `?${infer K}` ? QueryToParams<K, AST>
  : Q extends `${infer K}?` ? AST & Partial<QueryParamAst<K>>
  : Q extends `${infer K}` ? AST & QueryParamAst<K>
  : AST

/**
 *  Increments up from I until it finds an index that is not taken
 * @category Type-level
 * @since 1.0.0
 */
export type FindNextIndex<AST, I extends number = 0> = I extends keyof AST ? FindNextIndex<AST, N.Add<I, 1>>
  : I

/**
 * Extracts the query params from a path
 * @category Type-level
 * @since 1.0.0
 */
export type PathToQuery<P extends string> = P extends `${infer _}\\${infer Q}` ? Q : ``

type QueryParamValue<K extends string> = K extends `${infer _}=${infer R}` ? R : string

type QueryParamAst<K extends string> = Readonly<Record<QueryParamAstKey<K>, QueryParamAstValue<K>>>

type QueryParamAstKey<K extends string> = K extends `${infer K}=${infer _}` ? K : K

type QueryParamAstValue<K extends string> = K extends `${infer _}=${infer R}`
  ? R extends Param<infer _> | Unnamed ? string
  : R
  : string

type Compact<A> = { readonly [K in keyof A]: A[K] }

/* End Region: Extract Parameters from Path */

/* Start Region: Interpolations */

/**
 * Interpolate a path with a set of parameters
 * @category Type-level
 * @since 1.0.0
 */
export type Interpolate<P extends string, Params extends ParamsOf<P>> = [keyof Params] extends [never] ? P
  : P extends `${infer Head}\\?${infer Tail}` ? PathJoin<
      InterpolateWithQueryParams<
        SplitQueryParams<Tail>,
        Params,
        InpterpolateParts<PathToParts<Head>, Params>
      >[0]
    >
  : PathJoin<InpterpolateParts<PathToParts<P>, Params>[0]>

/**
 * Interpolate a path with a set of parameters
 * @category Type-level
 * @since 1.0.0
 */
export type InpterpolateParts<
  Parts extends ReadonlyArray<any>,
  Params extends {},
  R extends ReadonlyArray<any> = [],
  AST = {}
> = Parts extends readonly [infer H, ...infer T]
  ? A.Equals<string, H> extends 1 ? InpterpolateParts<T, Params, [...R, H], AST>
  : H extends Optional<Prefix<infer Pre, Unnamed>> ? FindNextIndex<AST> extends keyof Params ? InpterpolateParts<
        T,
        Params,
        AppendPrefix<R, Pre, `${A.Cast<Params[FindNextIndex<AST>], string | number>}`>,
        AST & Record<H, Params[FindNextIndex<AST>]>
      >
    : InpterpolateParts<T, Params, R, AST>
  : H extends Prefix<infer Pre, Unnamed> ? InpterpolateParts<
      T,
      Params,
      AppendPrefix<
        R,
        Pre,
        `${A.Cast<Params[A.Cast<FindNextIndex<AST>, keyof Params>], string | number>}`
      >,
      AST & Record<H, Params[A.Cast<FindNextIndex<AST>, keyof Params>]>
    >
  : H extends Optional<Prefix<infer Pre, Param<infer P>>> ? P extends keyof Params ? InpterpolateParts<
        T,
        Params,
        AppendPrefix<R, Pre, A.Cast<Params[A.Cast<P, keyof Params>], string>>,
        AST & Record<H, Params[A.Cast<P, keyof Params>]>
      >
    : InpterpolateParts<T, Params, R, AST>
  : H extends Prefix<infer Pre, Param<infer P>> ? InpterpolateParts<
      T,
      Params,
      AppendPrefix<R, Pre, A.Cast<Params[A.Cast<P, keyof Params>], string>>,
      AST & Record<H, Params[A.Cast<P, keyof Params>]>
    >
  : InterpolatePart<H, Params, AST> extends readonly [infer A, infer B]
    ? InpterpolatePartsWithNext<T, Params, R, readonly [A, B]>
  : InpterpolateParts<T, Params, R, AST>
  : readonly [R, AST]

/**
 * @category Type-level
 * @since 1.0.0
 */
export type AppendPrefix<
  R extends ReadonlyArray<any>,
  Pre extends string,
  P extends string
> = R extends readonly [...infer Init, infer L extends string] ? readonly [...Init, `${L}${Pre}${P}`]
  : R

/**
 * @category Type-level
 * @since 1.0.0
 */
export type InpterpolatePartsWithNext<
  Parts extends ReadonlyArray<any>,
  Params extends {},
  R extends ReadonlyArray<any>,
  Next extends readonly [any, any]
> = InpterpolateParts<Parts, Params, readonly [...R, Next[0]], Next[1]>

/**
 * @category Type-level
 * @since 1.0.0
 */
export type InterpolatePart<P, Params, AST> = P extends Optional<Param<infer R>>
  ? R extends keyof Params ? readonly [Params[R], AST & Record<R, Params[R]>]
  : readonly ["", AST]
  : P extends Param<infer R> ? R extends keyof Params ? readonly [Params[R], AST & Record<R, Params[R]>]
    : readonly [P, AST]
  : P extends Unnamed
    ? FindNextIndex<AST> extends keyof Params ? InterpolateUnnamedPart<Params, FindNextIndex<AST>, AST>
    : readonly [P, AST]
  : P extends Prefix<infer Pre, Param<infer R>>
    ? R extends keyof Params ? [`${Pre}${A.Cast<Params[R], string>}`, AST & Record<R, Params[R]>]
    : []
  : P extends Optional<Prefix<infer Pre, Param<infer R>>>
    ? R extends keyof Params ? [`${Pre}${A.Cast<Params[R], string>}`, AST & Partial<Record<R, Params[R]>>]
    : []
  : readonly [P, AST]

/**
 * @category Type-level
 * @since 1.0.0
 */
export type InterpolateUnnamedPart<Params, K extends keyof Params, AST> = readonly [
  Params[K],
  AST & Record<K, Params[K]>
]

type InterpolateWithQueryParams<
  Q extends ReadonlyArray<string>,
  Params,
  Previous extends readonly [any, any],
  First extends boolean = true
> = Q extends readonly [infer Head, ...infer Tail extends ReadonlyArray<string>] ? InterpolateWithQueryParams<
    Tail,
    Params,
    InterpolateQueryParamPart<Head, Params, Previous, First>[0],
    InterpolateQueryParamPart<Head, Params, Previous, First>[1]
  >
  : Previous

/**
 * @category Type-level
 * @since 1.0.0
 */
export type InterpolateQueryParamPart<
  Part,
  Params,
  Previous extends readonly [ReadonlyArray<string>, any],
  First extends boolean
> = Part extends QueryParam<infer K, infer V> ? InterpolateQueryParamPartWithKey<
    First extends true ? `?${K}` : `&${K}`,
    Previous[0],
    InterpolatePart<V, Params, Previous[1]>,
    First
  >
  : readonly [[[...Previous[0], Part], Previous[1]], false]

type InterpolateQueryParamPartWithKey<
  K extends string,
  Parts extends ReadonlyArray<string>,
  Previous extends readonly [string, any],
  First extends boolean
> = "" extends Previous[0] ? [[Parts, Previous[1]], First]
  : [[[...Parts, `${K}=${Previous[0]}`], Previous[1]], false]

type SplitQueryParams<P extends string> = P extends `${infer Head}&${infer Tail}`
  ? readonly [Head, ...SplitQueryParams<Tail>]
  : readonly [P]
