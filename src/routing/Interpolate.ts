import { A } from 'ts-toolbelt'

import { FindNextIndex, PathToParts } from './Params'
import { Optional, Param, PathJoin, QueryParam, Unnamed } from './paths'

// Interpolations
export type Interpolate<P extends string, Params extends {}> =
  P extends `${infer Head}\\?${infer Tail}`
    ? PathJoin<
        InterpolateWithQueryParams<
          SplitQueryParams<Tail>,
          Params,
          InpterpolateParts<PathToParts<Head>, Params>
        >[0]
      >
    : PathJoin<InpterpolateParts<PathToParts<P>, Params>[0]>

export type InpterpolateParts<
  Parts extends readonly any[],
  Params extends {},
  R extends readonly any[] = [],
  AST = {},
> = Parts extends readonly [infer H, ...infer T]
  ? InpterpolatePartsWithNext<T, Params, R, InterpolatePart<H, Params, AST>>
  : readonly [R, AST]

export type InpterpolatePartsWithNext<
  Parts extends readonly any[],
  Params extends {},
  R extends readonly any[],
  Next extends readonly [any, any],
> = InpterpolateParts<Parts, Params, readonly [...R, Next[0]], Next[1]>

export type InterpolatePart<P, Params, AST> = P extends Optional<Param<infer R>>
  ? R extends keyof Params
    ? readonly [Params[R], AST]
    : readonly [P, AST]
  : P extends Param<infer R>
  ? R extends keyof Params
    ? readonly [Params[R], AST]
    : readonly [P, AST]
  : P extends Unnamed
  ? FindNextIndex<AST> extends keyof Params
    ? InterpolateUnnamedPart<Params, FindNextIndex<AST>, AST>
    : readonly [P, AST]
  : readonly [P, AST]

export type InterpolateUnnamedPart<Params, K extends keyof Params, AST> = readonly [
  Params[K],
  AST & Record<K, Params[K]>,
]

type InterpolateWithQueryParams<
  Q extends readonly string[],
  Params,
  Previous extends readonly [any, any],
  First extends boolean = true,
> = Q extends readonly [infer Head, ...infer Tail]
  ? InterpolateWithQueryParams<
      A.Cast<Tail, readonly string[]>,
      Params,
      InterpolateQueryParamPart<Head, Params, Previous, First>,
      false
    >
  : Previous

export type InterpolateQueryParamPart<
  Part,
  Params,
  Previous extends readonly [readonly string[], any],
  First extends boolean,
> = Part extends QueryParam<infer K, infer V>
  ? InterpolateQueryParamPartWithKey<
      First extends true ? `?${K}` : `&${K}`,
      Previous[0],
      InterpolatePart<V, Params, Previous[1]>
    >
  : readonly [[...Previous[0], Part], Previous[1]]

type InterpolateQueryParamPartWithKey<
  K extends string,
  Parts extends readonly string[],
  Previous extends readonly [string, any],
> = [[...Parts, `${K}=${Previous[0]}`], Previous[1]]

type SplitQueryParams<P extends string> = P extends `${infer Head}&${infer Tail}`
  ? readonly [Head, ...SplitQueryParams<Tail>]
  : readonly [P]
