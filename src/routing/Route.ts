import { ReaderOption } from '@fp/ReaderOption'
import { none, some } from 'fp-ts/Option'
import * as ptr from 'path-to-regexp'

import { Interpolate } from './Interpolate'
import { ParamsOf } from './Params'

export interface Route<P extends string> {
  readonly path: P
  readonly match: ReaderOption<string, ParamsOf<P>>
  readonly createPath: <A extends ParamsOf<P>>(params: A) => Interpolate<P, A>
}

// TODO: Should we make route a Prism when monocle is ready for v3?

export function createRoute<P extends string>(path: P, options: RouteOptions = {}): Route<P> {
  const parse = ptr.match<ParamsOf<P>>(path, options.match)
  const toPath = ptr.compile<ParamsOf<P>>(path, options.compile)

  return {
    path,
    match: (path: string) => {
      const match = parse(path)

      return !match ? none : some(match.params)
    },
    createPath: toPath as Route<P>['createPath'],
  }
}

export type RouteOptions = {
  readonly match?: MatchOptions
  readonly compile?: CompileOptions
}

export type MatchOptions = ptr.TokensToRegexpOptions & ptr.RegexpToFunctionOptions
export type CompileOptions = ptr.TokensToFunctionOptions
