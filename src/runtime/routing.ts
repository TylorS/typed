import { Arity1 } from '@fp/function'
import { ReaderOption } from '@fp/ReaderOption'
import { none, some } from 'fp-ts/Option'
import * as ptr from 'path-to-regexp'
import { A, N } from 'ts-toolbelt'

// Template for parameters
export type Named<A extends string = string> = `:${A}`

export const named = <A extends string>(param: A): Named<A> => `:${param}` as Named<A>

export const unnamed = `(.*)` as const
export type Unnamed = typeof unnamed

// Template for optional path parts
export type Optional<A extends Named | Unnamed = Named | Unnamed> = `${A}?`

export const optional = <A extends Named | Unnamed>(param: A): Optional<A> =>
  `${param}?` as Optional<A>

// Construct a custom prefix
export type Prefix<P extends string, A extends Named | Unnamed> = `{${P}${A}}`

export const prefix = <P extends string, A extends Named | Unnamed>(prefix: P, param: A) =>
  `{${prefix}${param}}` as Prefix<P, A>

// Construct query params
export type QueryParam<K extends string, V extends string> = `` extends V ? K : `${K}=${V}`

export const queryParam = <K extends string, V extends string>(
  key: K,
  value: V,
): QueryParam<K, V> => (value === '' ? key : `${key}=${value}`) as QueryParam<K, V>

// zero or more path parts will be matched to this param
export type ZeroOrMore<A extends string> = `${Named<A>}*`

export const zeroOrMore = <A extends string>(param: A): ZeroOrMore<A> =>
  `${named(param)}*` as ZeroOrMore<A>

export type OneOrMore<A extends string> = `${Named<A>}+`

// one or more path parts will be matched to this param
export const oneOrMore = <A extends string>(param: A): OneOrMore<A> =>
  `${named(param)}+` as OneOrMore<A>

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
  ? `${FormatPart<A.Cast<Head, string>>}${FormatPart<
      PathJoin<A.Cast<Tail, ReadonlyArray<string>>>
    >}`
  : ``

export type FormatPart<P extends string> = `` extends P
  ? P
  : RemoveLeadingSlash<P> extends `\\?${infer _}`
  ? RemoveLeadingSlash<P>
  : RemoveLeadingSlash<P> extends `{${infer _}`
  ? RemoveLeadingSlash<P>
  : `/${RemoveLeadingSlash<P>}`

export const pathJoin = <P extends ReadonlyArray<string>>(...parts: P): PathJoin<P> => {
  if (parts.length === 0) {
    return `` as PathJoin<P>
  }

  const [head, ...tail] = parts

  return `${formatPart(head)}${pathJoin(...tail)}` as PathJoin<P>
}

export const formatPart = (part: string) => {
  const trimmed = removeLeadingSlash(part)

  if (trimmed === '') {
    return ''
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('\\?')) {
    return trimmed
  }

  return `/${trimmed}`
}

// Convert a path back into a tuple of path parts
export type PathToParts<P> = P extends `${infer Head}/${infer Tail}`
  ? [...PathToParts<Head>, ...PathToParts<Tail>]
  : P extends `${infer Head}{${infer Q}}?${infer Tail}`
  ? [...PathToParts<Head>, `{${Q}}?`, ...PathToParts<`${Tail}`>]
  : P extends `${infer Head}{${infer Q}}${infer Tail}`
  ? [...PathToParts<Head>, `{${Q}}`, ...PathToParts<`${Tail}`>]
  : `` extends P
  ? []
  : [P]

export type PartsToParams<A, AST = {}> = A extends readonly [infer Head, ...infer Tail]
  ? PartsToParams<Tail, AST & PartToParam<Head, AST>>
  : AST

export type PartToParam<A, AST> = A extends Unnamed
  ? {
      readonly [K in FindNextIndex<AST> extends number ? FindNextIndex<AST> : never]: string
    }
  : A extends `${infer _}${Named<infer R>}}?`
  ? { readonly [K in R]?: string }
  : A extends `${infer _}${Named<infer R>}}`
  ? { readonly [K in R]?: string }
  : A extends `${infer _}${Named<infer R>}?`
  ? { readonly [K in R]?: string }
  : A extends `${infer _}${Named<infer R>}+`
  ? { readonly [K in R]: readonly [string, ...string[]] }
  : A extends `${infer _}${Named<infer R>}*`
  ? { readonly [K in R]: readonly string[] }
  : A extends `${infer _}${Named<infer R>}`
  ? { readonly [K in R]: string }
  : {}

// Increments up from I until it finds an index that is not taken
export type FindNextIndex<AST, I extends number = 0> = I extends keyof AST
  ? FindNextIndex<AST, N.Add<I, 1>>
  : I

// Extract the parameters out of a path
export type ParamsOf<A extends string> = PartsToParams<PathToParts<A>>

// Same as monocle-ts, but there's no published version with compat for fp-ts v3
export interface Prism<S, A> {
  readonly getOption: ReaderOption<S, A>
  readonly reverseGet: Arity1<A, S>
}

export interface Route<P extends string> extends Prism<string, ParamsOf<P>> {
  readonly _tag: 'route'
  readonly path: P
}

export const createRoute = <P extends string>(path: P): Route<P> => {
  const matchPath = ptr.match<ParamsOf<P>>(path)

  return {
    _tag: 'route',
    path,
    getOption: (s) => {
      const match = matchPath(s)

      return !match ? none : some(match.params)
    },
    reverseGet: ptr.compile<ParamsOf<P>>(path),
  }
}
