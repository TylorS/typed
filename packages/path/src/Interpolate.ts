/**
 * Type-level interpolation of the path-to-regexp syntax
 *
 * @since 1.0.0
 */

/* eslint-disable */

import type { A, S } from "ts-toolbelt";
import type {
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
  UnnamedParamNode,
} from "./internal/ast.js";
import type { ParamsOf } from "./ParamsOf.js";
import type { PathJoin } from "./PathJoin.js";

/**
 * Interpolate a path with parameters
 * @since 1.0.0
 */
export type Interpolate<P extends string, Params extends ParamsOf<P>> =
  A.Equals<P, string> extends 1
    ? string
    : PathJoin<InterpolateParts<ParseSegments<PathToSegments<P>>, Params>>;

type InterpolateParts<T extends ReadonlyArray<any>, Params extends {}> = {
  readonly [K in keyof T]: InterpolatePart<T[K], Params>;
};

type InterpolatePartMap<
  T,
  Params extends {},
  IsOptional extends boolean,
  Prefix extends string,
> = {
  Modifier: T extends ModifierNode<infer M, infer S>
    ? InterpolatePart<S, Params, M extends "+" ? false : true>
    : never;
  Text: T extends TextNode<infer T> ? T : never;
  NamedParam: T extends NamedParamNode<infer N>
    ? N extends keyof Params
      ? EnsureIsString<Params[N], Prefix>
      : IsOptional extends true
        ? ""
        : string
    : never;
  NamedParamWithRegex: T extends NamedParamNodeWithRegex<infer N, infer _>
    ? N extends keyof Params
      ? EnsureIsString<Params[N], Prefix>
      : IsOptional extends true
        ? ""
        : string
    : never;
  UnnamedParam: T extends UnnamedParamNode<
    infer I extends Extract<keyof Params, number>
  >
    ? EnsureIsString<Params[I], Prefix>
    : IsOptional extends true
      ? ""
      : never;
  Prefix: T extends PrefixNode<infer P, infer S>
    ? S extends PrefixNode<infer P2, infer _>
      ? `${P}${InterpolatePart<S, Params, IsOptional, P2>}`
      : `` extends InterpolatePart<S, Params, IsOptional, P>
        ? ``
        : `${P}${InterpolatePart<S, Params, IsOptional, P>}`
    : never;
  Suffix: T extends SuffixNode<infer S, infer P>
    ? `` extends InterpolatePart<S, Params, IsOptional>
      ? ``
      : `${InterpolatePart<S, Params, IsOptional>}${P}`
    : never;
  QueryParams: T extends QueryParamsNode<infer Q>
    ? `?${InterpolateQueryParams<Q, Params>}`
    : never;
  QueryParam: T extends QueryParamNode<infer K, infer V>
    ? `${K}=${InterpolatePart<V, Params>}`
    : never;
};

type InterpolatePart<
  T,
  Params extends {},
  IsOptional extends boolean = false,
  Prefix extends string = "/",
> = T extends SegmentAST | QueryParamNode<any, any>
  ? InterpolatePartMap<T, Params, IsOptional, Prefix>[T["_tag"]]
  : never;

type InterpolateQueryParams<
  T extends ReadonlyArray<any>,
  Params extends {},
> = S.Join<
  {
    [K in keyof T]: InterpolatePart<T[K], Params>;
  },
  "&"
>;

type EnsureIsString<T, Prefix extends string> = T extends readonly [infer Head]
  ? Head extends string
    ? Head
    : never
  : T extends ReadonlyArray<any>
    ? S.Join<T, Prefix>
    : T extends string
      ? T
      : never;
