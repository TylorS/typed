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

export function createRoute<P extends string>(path: P): Route<P> {
  const parse = ptr.match(path)
  const toPath = ptr.compile(path)

  return {
    path,
    match: (path: string) => {
      const match = parse(path)

      return !match ? none : some(match.params as ParamsOf<P>)
    },
    createPath: (params) => toPath(params) as Interpolate<P, typeof params>,
  }
}
