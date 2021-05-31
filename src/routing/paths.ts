import { A } from 'ts-toolbelt'

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
  `:${param}*` as ZeroOrMore<A>

export type OneOrMore<A extends string> = `${Param<A>}+`

// one or more path parts will be matched to this param
export const oneOrMore = <A extends string>(param: A): OneOrMore<A> => `:${param}+` as OneOrMore<A>

// Creates the path-to-regexp syntax for query parameters
export type QueryParams<Q extends readonly QueryParam<any, any>[], R extends string = ``> =
  Q extends readonly [infer Head, ...infer Tail]
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

// Composes other path parts into a single path
export type PathJoin<A extends ReadonlyArray<string>> = A extends readonly [
  infer Head,
  ...infer Tail
]
  ? `${FormatPart<A.Cast<Head, string>>}${PathJoin<A.Cast<Tail, ReadonlyArray<string>>>}`
  : ``

export const pathJoin = <P extends ReadonlyArray<string>>(...parts: P): PathJoin<P> => {
  if (parts.length === 0) {
    return `` as PathJoin<P>
  }

  const [head, ...tail] = parts

  return `${formatPart(head)}${pathJoin(...tail)}` as PathJoin<P>
}

// Formats a piece of a path
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
  : P extends QueryParam<infer _, infer _> | QueryParams<infer _, infer _>
  ? P
  : `/${RemoveLeadingSlash<P>}`

// Remove forward slashes prefixes recursively
export type RemoveLeadingSlash<A> = A extends `/${infer R}` ? RemoveLeadingSlash<R> : A

export const removeLeadingSlash = <A extends string>(a: A): RemoveLeadingSlash<A> => {
  let s = a.slice()

  while (s.startsWith('/')) {
    s = s.slice(1)
  }

  return s as RemoveLeadingSlash<A>
}
