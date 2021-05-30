import { A, N } from 'ts-toolbelt'

import { Param, Unnamed } from './paths'

// Extract the parameters out of a path
export type ParamsOf<A extends string> = Compact<PartsToParams<PathToParts<A>>>

// Extract the Query parameters out of a path
export type QueryParamsOf<P extends string> = Compact<QueryToParams<PathToQuery<P>>>

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

export type QueryParamsToParts<Q extends string, R extends ReadonlyArray<string>> =
  Q extends `\\?${infer Q}`
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
export type FindNextIndex<AST, I extends number = 0> = I extends keyof AST
  ? FindNextIndex<AST, N.Add<I, 1>>
  : I

export type PathToQuery<P extends string> = P extends `${infer _}\\${infer Q}` ? Q : ``

type QueryParamValue<K extends string> = K extends `${infer _}=${infer R}` ? R : string

type QueryParamAst<K extends string> = Readonly<Record<QueryParamAstKey<K>, QueryParamAstValue<K>>>

type QueryParamAstKey<K extends string> = K extends `${infer K}=${infer _}` ? K : K

type QueryParamAstValue<K extends string> = K extends `${infer _}=${infer R}`
  ? R extends Param<infer _> | Unnamed
    ? string
    : R
  : string

type Compact<A> = { readonly [K in keyof A]: A[K] }
