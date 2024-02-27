import type { N } from "ts-toolbelt"
import type { Param, Prefix, Unnamed } from "../DSL.js"

// Special-case syntax for DSL that uses Arrays for Regex
type QueryParamsSyntax<T extends string> = `\\?${T}`
type NamedParamWithRegexSyntax<T extends string, Regex extends string> = `:${T}(${Regex})`
type ModifierSyntax<T extends string, U extends Modifier = Modifier> = `${T}${U}`

export type PathToSegments<T extends string> = `` extends T ? []
  : T extends `${infer P}${QueryParamsSyntax<infer Q>}` ? [...PathToSegments<P>, QueryParamsSyntax<Q>]
  : T extends `${infer P}/${infer R}` ?
    `` extends P ? PathToSegments<R> : [...PathToSegments<P>, ...PathToSegments<R>] :
  [T]

export type QueryParamsToSegments<T extends string> = `` extends T ? []
  : T extends QueryParamsSyntax<infer T> ? QueryParamsToSegments<T>
  : T extends `${infer P}&${infer R}` ? [...QueryParamsToSegments<P>, ...QueryParamsToSegments<R>]
  : [T]

export type SegmentAST =
  | ModifierNode<any, any>
  | TextNode<any>
  | NamedParamNode<any>
  | NamedParamNodeWithRegex<any, any>
  | UnnamedParamNode<any>
  | PrefixNode<any, any>
  | SuffixNode<any, any>
  | QueryParamsNode<any>

export type TextNode<in out T extends string> = {
  _tag: "Text"
  text: T
}

export type NamedParamNode<in out T extends string> = {
  _tag: "NamedParam"
  name: TextNode<T>
}

export type NamedParamNodeWithRegex<in out T extends string, in out Regex extends string> = {
  _tag: "NamedParamWithRegex"
  name: TextNode<T>
  options: TextNode<Regex>
}

export type UnnamedParamNode<in out I extends number> = {
  _tag: "UnnamedParam"
  index: I
}

export type PrefixNode<in out T extends string, in out P extends SegmentAST | null> = {
  _tag: "Prefix"
  prefix: TextNode<T>
  param: P
}

export type MakePrefixNode<T extends string, P extends SegmentAST | null> = `` extends T ? P : PrefixNode<T, P>

export type SuffixNode<in out P extends SegmentAST | null, in out T extends string> = {
  _tag: "Suffix"
  param: P
  suffix: TextNode<T>
}

export type MakeSuffixNode<P extends SegmentAST | null, T extends string> = `` extends T ? P : SuffixNode<P, T>

export type QueryParamsNode<in out Params extends ReadonlyArray<TextNode<any> | QueryParamNode<any, any>>> = {
  _tag: "QueryParams"
  params: Params
}

export type QueryParamNode<in out T extends string, in out U extends SegmentAST> = {
  _tag: "QueryParam"
  name: TextNode<T>
  value: U
}

export type Modifier = "?" | "+" | "*"

export type ModifierNode<in out M extends Modifier, in out S extends SegmentAST> = {
  _tag: "Modifier"
  modifier: M
  segment: S
}

export type ParseSegments<T extends ReadonlyArray<string>> = ParseSegments_<T, 0>

type ParseSegments_<T extends ReadonlyArray<string>, Count extends number> = T extends
  readonly [infer Head, ...infer Tail extends ReadonlyArray<string>] ?
  HasUnnamedParam<ParseSegment<Head, Count>> extends true ?
    readonly [ParseSegment<Head, Count>, ...ParseSegments_<Tail, N.Add<Count, 1>>] :
  readonly [ParseSegment<Head, Count>, ...ParseSegments_<Tail, Count>] :
  T extends readonly [infer Head] ? [ParseSegment<Head, Count>]
  : []

export type ParseSegment<T, Count extends number> = [ParseExactSegment<T, Count>] extends [never] ?
  ParseSegmentWithImplicitPrefixAndSuffix<T, Count>
  : ParseExactSegment<T, Count>

type ParseExactSegment<T, Count extends number> = T extends QueryParamsSyntax<infer P> ?
  QueryParamsNode<ParseQueryParamSegments<QueryParamsToSegments<P>, Count>>
  : T extends ModifierSyntax<infer M, "?"> ? ModifierNode<"?", ParseSegment<M, Count>>
  : T extends ModifierSyntax<infer M, "*"> ? ModifierNode<"*", ParseSegment<M, Count>>
  : T extends ModifierSyntax<infer M, "+"> ? ModifierNode<"+", ParseSegment<M, Count>>
  : T extends Prefix<infer P, Unnamed> ? PrefixNode<P, UnnamedParamNode<Count>>
  : T extends Prefix<infer P, NamedParamWithRegexSyntax<infer S, infer Regex>> ?
    PrefixNode<P, NamedParamNodeWithRegex<S, Regex>>
  : T extends Prefix<infer P, Param<infer S>> ? PrefixNode<P, NamedParamNode<S>>
  : T extends Unnamed ? UnnamedParamNode<Count>
  : T extends NamedParamWithRegexSyntax<infer P, infer Regex> ? NamedParamNodeWithRegex<P, Regex>
  : T extends Param<infer P> ? // Special cases to ensure that suffixes in params are parsed correctly
    P extends `${infer P2}+${infer Tail}` ? MakeSuffixNode<ModifierNode<"+", NamedParamNode<P2>>, Tail>
    : P extends `${infer P2}*${infer Tail}` ? MakeSuffixNode<ModifierNode<"*", NamedParamNode<P2>>, Tail>
    : P extends `${infer P2}?${infer Tail}` ? MakeSuffixNode<ModifierNode<"?", NamedParamNode<P2>>, Tail>
    : NamedParamNode<P>
  : never

type ParseSegmentWithImplicitPrefixAndSuffix<T, Count extends number> = T extends
  `${infer Head}${ModifierSyntax<infer M, "?">}${infer Tail}` ?
  MakePrefixNode<Head, MakeSuffixNode<ModifierNode<"?", ParseSegment<M, Count>>, Tail>>
  : T extends `${infer Head}${ModifierSyntax<infer M, "*">}${infer Tail}` ?
    MakePrefixNode<Head, MakeSuffixNode<ModifierNode<"*", ParseSegment<M, Count>>, Tail>>
  : T extends `${infer Head}${ModifierSyntax<infer M, "+">}${infer Tail}` ?
    MakePrefixNode<Head, MakeSuffixNode<ModifierNode<"+", ParseSegment<M, Count>>, Tail>>
  : T extends `${infer Head}${Prefix<infer P, Unnamed>}${infer Tail}` ?
    MakePrefixNode<Head, MakeSuffixNode<MakePrefixNode<P, UnnamedParamNode<Count>>, Tail>>
  : T extends `${infer Head}${Prefix<infer P, NamedParamWithRegexSyntax<infer S, infer Regex>>}${infer Tail}` ?
    MakePrefixNode<Head, MakeSuffixNode<MakePrefixNode<P, NamedParamNodeWithRegex<S, Regex>>, Tail>>
  : T extends `${infer Head}${Prefix<infer P, Param<infer S>>}${infer Tail}` ?
    MakePrefixNode<Head, MakeSuffixNode<MakePrefixNode<P, NamedParamNode<S>>, Tail>>
  : T extends `${infer Head}${Unnamed}${infer Tail}` ?
    MakePrefixNode<Head, MakeSuffixNode<UnnamedParamNode<Count>, Tail>>
  : T extends `${infer Head}${NamedParamWithRegexSyntax<infer P, infer Regex>}${infer Tail}` ?
    MakePrefixNode<Head, MakeSuffixNode<NamedParamNodeWithRegex<P, Regex>, Tail>>
  : T extends `${infer Head}${Param<infer P>}` ? MakePrefixNode<Head, NamedParamNode<P>>
  : T extends `${infer Head}${Param<infer P>}${infer Tail}` ?
    MakePrefixNode<Head, MakeSuffixNode<NamedParamNode<P>, Tail>>
  : T extends string ? TextNode<T>
  : never

export type ParseQueryParamSegments<T extends ReadonlyArray<string>, Count extends number> = T extends
  readonly [infer Head, ...infer Tail extends ReadonlyArray<string>] ?
  HasUnnamedParam<ParseQueryParamSegment<Head, Count>> extends true
    ? [ParseQueryParamSegment<Head, Count>, ...ParseQueryParamSegments<Tail, N.Add<Count, 1>>]
  : [ParseQueryParamSegment<Head, Count>, ...ParseQueryParamSegments<Tail, Count>] :
  T extends readonly [infer Head] ? [ParseQueryParamSegment<Head, Count>]
  : []

export type ParseQueryParamSegment<T, Count extends number> = T extends `${infer K}=${infer V}` ?
  QueryParamNode<K, ParseSegment<V, Count>>
  : T extends string ? TextNode<T>
  : never

type HasUnnamedParam<T> = T extends UnnamedParamNode<infer _> ? true :
  T extends ModifierNode<any, infer S> ? HasUnnamedParam<S>
  : T extends PrefixNode<any, infer S> ? HasUnnamedParam<S>
  : T extends SuffixNode<infer S, any> ? HasUnnamedParam<S>
  : T extends QueryParamsNode<infer Q> ? HasUnnamedParamInQueryParams<Q>
  : false

type HasUnnamedParamInQueryParams<T extends ReadonlyArray<SegmentAST | QueryParamNode<any, any>>> = T extends
  readonly [infer Head, ...infer Tail extends ReadonlyArray<SegmentAST | QueryParamNode<any, any>>] ?
  HasUnnamedParam<Head> extends true ? true : HasUnnamedParamInQueryParams<Tail>
  : false
