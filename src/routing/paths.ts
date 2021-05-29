import { A, N } from 'ts-toolbelt'

// Template for parameters
export type Param<A extends string> = `:${A}`

export const param = <A extends string>(param: A): Param<A> => `:${param}` as Param<A>

// Template for optional path parts
export type Optional<A extends string> = `${A}?`

export const optional = <A extends string>(param: A): Optional<A> => `${param}?` as Optional<A>

// Construct a custom prefix
export type Prefix<P extends string, A extends string> = `{${P}${A}}`

export const prefix = <P extends string, A extends Param<string> | Unnamed>(prefix: P, param: A) =>
  `{${prefix}${param}}` as Prefix<P, A>

// Construct query params
export type QueryParam<K extends string, V extends string> = `` extends V ? K : `${K}=${V}`

export const queryParam = <K extends string, V extends string>(key: K, value: V) =>
  `${key}=${value}` as QueryParam<K, V>

// zero or more path parts will be matched to this param
export type ZeroOrMore<A extends string> = `${Param<A>}*`

export const zeroOrMore = <A extends string>(param: A): ZeroOrMore<A> =>
  `${param}*` as ZeroOrMore<A>

export type OneOrMore<A extends string> = `${Param<A>}+`

// one or more path parts will be matched to this param
export const oneOrMore = <A extends string>(param: A): OneOrMore<A> => `${param}+` as OneOrMore<A>

// Creates the path-to-regexp syntax for query parameters
export type QueryParams<
  Q extends readonly QueryParam<any, any>[],
  R extends string = ``
> = Q extends readonly [infer Head, ...infer Tail]
  ? QueryParams<
      A.Cast<Tail, readonly QueryParam<any, any>[]>,
      `` extends R ? `\\?${A.Cast<Head, string>}` : `${R}&${A.Cast<Head, string>}`
    >
  : R

export const queryParams = <P extends readonly [QueryParam<any, any>, ...QueryParam<any, any>]>(
  ...params: P
): QueryParams<P> => `\\?${params.join('&')}` as QueryParams<P>

export const unnamed = `(.*)` as const
export type Unnamed = typeof unnamed

// Remove forward slashes prefixes recursively
export type RemoveLeadingSlash<A> = A extends `/${infer R}` ? RemoveLeadingSlash<R> : A

export const removeLeadingSlash = <A extends string>(a: A): RemoveLeadingSlash<A> => {
  let s = a.slice()

  while (s.startsWith('/')) {
    s = s.slice(1)
  }

  return s as RemoveLeadingSlash<A>
}

// Composes other path parts into a single path
export type PathJoin<A extends ReadonlyArray<string>> = A extends readonly [
  infer Head,
  ...infer Tail
]
  ? `${FormatPart<A.Cast<Head, string>>}${PathJoin<A.Cast<Tail, ReadonlyArray<string>>>}`
  : ``

// Extract the parameters out of a path
export type ParamsOf<A extends string> = Compact<PartsToParams<PathToParts<A>>>

export type QueryParamsOf<P extends string> = Compact<QueryToParams<PathToQuery<P>>>

export const pathJoin = <P extends ReadonlyArray<string>>(...parts: P): PathJoin<P> => {
  if (parts.length === 0) {
    return `` as PathJoin<P>
  }

  const [head, ...tail] = parts

  return `${formatPart(head)}${pathJoin(...tail)}` as PathJoin<P>
}

export const formatPart = (part: string) => {
  part = removeLeadingSlash(part)

  if (part.startsWith('{')) {
    return part
  }

  if (part.startsWith('\\?')) {
    return part
  }

  return part === '' ? '' : `/${part}`
}

export type FormatPart<P extends string> = `` extends P
  ? P
  : RemoveLeadingSlash<P> extends `\\?${infer _}`
  ? RemoveLeadingSlash<P>
  : RemoveLeadingSlash<P> extends `{${infer _}`
  ? RemoveLeadingSlash<P>
  : `/${RemoveLeadingSlash<P>}`

// Convert a path back into a tuple of path parts
export type PathToParts<P> = P extends `${infer Head}\\?${infer Tail}`
  ? readonly [...PathToParts<Head>, `\\?${Tail}`]
  : P extends `${infer Head}/${infer Tail}`
  ? readonly [...PathToParts<Head>, ...PathToParts<Tail>]
  : P extends `${infer Head}{${infer Q}}?${infer Tail}`
  ? readonly [...PathToParts<Head>, `{${Q}}?`, ...PathToParts<`${Tail}`>]
  : P extends `${infer Head}{${infer Q}}${infer Tail}`
  ? readonly [...PathToParts<Head>, `{${Q}}`, ...PathToParts<`${Tail}`>]
  : `` extends P
  ? readonly []
  : readonly [P]

export type PartsToParams<A extends ReadonlyArray<string>, AST = {}> = A extends readonly [
  infer Head,
  ...infer Tail
]
  ? PartsToParams<A.Cast<Tail, readonly string[]>, AST & PartToParam<A.Cast<Head, string>, AST>>
  : AST

export type PartToParam<A extends string, AST> = A extends `\\${infer R}`
  ? PartsToParams<QueryParamsToParts<R, []>, AST>
  : A extends Unnamed
  ? {
      readonly [K in FindNextIndex<AST> extends number ? FindNextIndex<AST> : never]: string
    }
  : A extends `${infer _}${Param<infer R>}}?`
  ? { readonly [K in R]?: string }
  : A extends `${infer _}${Param<infer R>}}`
  ? { readonly [K in R]: string }
  : A extends `${infer _}${Param<infer R>}?`
  ? { readonly [K in R]?: string }
  : A extends `${infer _}${Param<infer R>}+`
  ? { readonly [K in R]: readonly [string, ...string[]] }
  : A extends `${infer _}${Param<infer R>}*`
  ? { readonly [K in R]: readonly string[] }
  : A extends `${infer _}${Param<infer R>}`
  ? { readonly [K in R]: string }
  : {}

export type QueryParamsToParts<
  Q extends string,
  R extends ReadonlyArray<string>
> = Q extends `\\?${infer Q}`
  ? QueryParamsToParts<Q, R>
  : Q extends `?${infer Q}`
  ? QueryParamsToParts<Q, R>
  : Q extends `${infer Head}&${infer Tail}`
  ? QueryParamsToParts<Tail, QueryParamsToParts<Head, R>>
  : readonly [...R, QueryParamValue<Q>]

export type QueryToParams<Q extends string, AST = {}> = Q extends `${infer Head}&${infer Tail}`
  ? QueryToParams<Tail, QueryToParams<Head, AST>>
  : Q extends `?${infer K}`
  ? QueryToParams<K, AST>
  : Q extends `${infer K}?`
  ? AST & Partial<QueryParamAst<K>>
  : Q extends `${infer K}`
  ? AST & QueryParamAst<K>
  : AST

// Increments up from I until it finds an index that is not taken
type FindNextIndex<AST, I extends number = 0> = I extends keyof AST
  ? FindNextIndex<AST, N.Add<I, 1>>
  : I

type QueryParamValue<K extends string> = K extends `${infer _}=${infer R}` ? R : string

type PathToQuery<P extends string> = P extends `${infer _}\\${infer Q}` ? Q : ``

type QueryParamAst<K extends string> = Readonly<Record<QueryParamAstKey<K>, QueryParamAstValue<K>>>

type QueryParamAstKey<K extends string> = K extends `${infer K}=${infer _}` ? K : K

type QueryParamAstValue<K extends string> = K extends `${infer _}=${infer R}`
  ? R extends Param<infer _> | Unnamed
    ? string
    : R
  : string

type Compact<A> = { readonly [K in keyof A]: A[K] }
