/**
 * Type-level parameter extraction of the path-to-regexp syntax
 *
 * @since 1.0.0
 */

import type { A } from "ts-toolbelt"
import type {
  Modifier,
  ModifierNode,
  NamedParamNode,
  NamedParamNodeWithRegex,
  ParseSegments,
  PathToSegments,
  PrefixNode,
  QueryParamNode,
  QueryParamsNode,
  SegmentAST,
  SuffixNode,
  TextNode,
  UnnamedParamNode
} from "./internal/ast.js"

/**
 * Extract the parameters from a path
 * @since 1.0.0
 */
export type ParamsOf<T extends string> = A.Equals<T, string> extends 1 ? {}
  : ToParams<ParseSegments<PathToSegments<T>>>

type ToParams<T extends ReadonlyArray<any>, Params = {}> = [
  UnionToIntersection<
    {
      [K in keyof T]: AstToParams<T[K], Params>
    }[number]
  >
] extends [infer P] ? { readonly [K in keyof P]: P[K] } : never

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

type AstToParams<T, Params = {}> = T extends ModifierNode<infer M, infer S> ? ModifyParams<M, AstToParams<S>> :
  T extends TextNode<infer _> ? {} :
  T extends NamedParamNode<infer P extends string> ? { [K in P]: string } :
  // TODO: Attempt to parse regex for exact patterns
  T extends NamedParamNodeWithRegex<infer P extends string, infer _> ? { [K in P]: string } :
  T extends UnnamedParamNode<infer I extends number> ? { readonly [K in I]: string } :
  T extends PrefixNode<infer _, infer S extends SegmentAST> ? AstToParams<S> :
  T extends SuffixNode<infer S extends SegmentAST, infer _> ? AstToParams<S> :
  T extends QueryParamsNode<infer QueryParams extends ReadonlyArray<TextNode<any> | QueryParamNode<any, any>>> ?
    ToParams<QueryParams, Params> :
  T extends QueryParamNode<infer _Name, infer Value extends SegmentAST> ? AstToParams<Value>
  : {}

type ModifyParams<M extends Modifier, T> = {
  "?": Partial<T>
  "+": { readonly [K in keyof T]: readonly [T[K], ...Array<T[K]>] }
  "*": { readonly [K in keyof T]: ReadonlyArray<T[K]> }
}[M]
