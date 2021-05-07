// A type-level cast, I'm using it to avoid mutiple nested extends clauses

import { ReaderOption } from '@fp/ReaderOption'
import { none, some } from 'fp-ts/Option'
import * as ptr from 'path-to-regexp'

// since `infer T` does not retain its contextual types.
export type Cast<A, B> = A extends B ? A : B

// Template for parameters
export type Param<A extends string> = `:${A}`

export const param = <A extends string>(param: A): Param<A> => `:${param}` as Param<A>

// Template for optional path parts
export type Maybe<A extends string> = `${A}?`

export const maybe = <A extends string>(param: A): Maybe<A> => `${param}?` as Maybe<A>

// Construct a custom prefix
export type Prefix<P extends string, A extends string> = `{${P}${A}}`

export const prefix = <P extends string, A extends string>(prefix: P, param: Param<A>) =>
  `{${prefix}${param}}` as Prefix<P, Param<A>>

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
      Cast<Tail, readonly QueryParam<any, any>[]>,
      `` extends R ? `\\?${Cast<Head, string>}` : `${R}&${Cast<Head, string>}`
    >
  : R

export const queryParams = <P extends readonly [QueryParam<any, any>, ...QueryParam<any, any>]>(
  ...params: P
): QueryParams<P> => `\\\\?${params.join('&')}` as QueryParams<P>

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
  ? `${PathJoinHead<Cast<Head, string>>}${PathJoinNext<
      PathJoin<Cast<Tail, ReadonlyArray<string>>>
    >}`
  : ``

export type PathJoinHead<P extends string> = P extends `/${infer R}`
  ? `/${RemoveLeadingSlash<R>}`
  : `/${P}`

export type PathJoinNext<P extends string> = `` extends P
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
  const next = pathJoin(...tail)
  const nextPostfix = `${
    next.startsWith('{') || next.startsWith('\\?') || next === ''
      ? next
      : `/${removeLeadingSlash(next)}`
  }`

  return `${
    head.startsWith('/') ? `/${removeLeadingSlash(head)}` : head
  }${nextPostfix}` as PathJoin<P>
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

export type PartsToParams<A extends ReadonlyArray<string>> = Intersect<
  {
    [K in keyof A]: PartToParam<Cast<A[K], string>>
  }
>

export type Intersect<A extends readonly any[], R = unknown> = A extends readonly [
  infer Head,
  ...infer Tail
]
  ? Intersect<Tail, R & Head>
  : R

export type PartToParam<A extends string> = A extends `${infer _}${Param<infer R>}}?`
  ? { readonly [K in R]?: string }
  : A extends `${infer _}${Param<infer R>}}`
  ? { readonly [K in R]?: string }
  : A extends `${infer _}${Param<infer R>}?`
  ? { readonly [K in R]?: string }
  : A extends `${infer _}${Param<infer R>}`
  ? { readonly [K in R]: string }
  : {}

// Extract the parameters out of a path
export type ParamsOf<A extends string> = PartsToParams<PathToParts<A>>

// Same as monocle-ts, but there's no published version with compat for fp-ts v3
export interface Prism<S, A> {
  readonly getOption: ReaderOption<S, A>
  readonly reverseGet: (a: A) => S
}

export interface Route<P extends string> extends Prism<string, ParamsOf<P>> {
  readonly type: 'route'
  readonly path: P
}

export const createRoute = <P extends string>(path: P): Route<P> => {
  const matchPath = ptr.match(path)
  const createPath = ptr.compile(path)

  return {
    type: 'route',
    path,
    getOption: (s) => {
      const match = matchPath(s)

      return !match ? none : some(match.params! as ParamsOf<P>)
    },
    reverseGet: (params) => createPath(params as object),
  }
}
