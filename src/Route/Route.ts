/**
 * This DSL represents all of the standard syntax for path-to-regexp (e.g. used in express.js and many other libs)
 * but does not cover the fancier regex validations that are techincally possible.
 */
import * as Effect from '@effect/core/io/Effect'
import * as M from '@tsplus/stdlib/data/Maybe'
import ptr from 'path-to-regexp'
import { A } from 'ts-toolbelt'

import {
  Interpolate,
  ParamsOf,
  PathJoin,
  QueryParamsOf,
  optional,
  param,
  pathJoin,
  prefix,
  queryParam,
  queryParams,
  unnamed,
} from './Path.js'

/* Start Region: Route */

export interface Route<P extends string, R = never, E = never> {
  readonly path: P
  readonly match: (path: string) => Effect.Effect<R, E, M.Maybe<ParamsOf<P>>>
  readonly createPath: <I extends ParamsOf<P>>(params: I) => Interpolate<P, I>
}

export type PathOf<A> = [A] extends [Route<infer R, any, any>] ? R : never

export function makeRoute<P extends string>(path: P): Route<P> {
  // eslint-disable-next-line import/no-named-as-default-member
  const parse = ptr.match(path, { end: false })
  // eslint-disable-next-line import/no-named-as-default-member
  const createPath = ptr.compile(path)

  const match = (input: string) =>
    Effect.sync(() => {
      const match = parse(input)

      return !match ? M.none : M.some({ ...match.params } as unknown as ParamsOf<P>)
    })

  return {
    path,
    match,
    createPath: createPath as Route<P, unknown>['createPath'],
  }
}

export function guard<P extends string, R, E, R2, E2>(
  route: Route<P, R, E>,
  guard: (params: ParamsOf<P>, path: string) => Effect.Effect<R2, E2, boolean>,
): Route<P, R | R2, E | E2> {
  const match = (path: string) =>
    Effect.gen(function* ($) {
      const params = yield* $(route.match(path))

      if (M.isNone(params)) {
        return params
      }

      const matched = yield* $(guard(params.value, path))

      if (!matched) {
        return M.none
      }

      return params
    })

  return {
    ...route,
    match,
  }
}

export function concatRoute<P1 extends string, R, E, P2 extends string, R2, E2>(
  routeA: Route<P1, R, E>,
  routeB: Route<P2, R2, E2>,
): Route<PathJoin<[P1, P2]>, R | R2, E | E2> {
  const match = (path: string) =>
    Effect.gen(function* ($) {
      const aParams = yield* $(routeA.match(path))

      if (M.isNone(aParams)) {
        return M.none
      }

      const aPath = routeA.createPath(aParams.value)
      const remainingPath = pathJoin(path.replace(aPath, '')) || '/'
      const bParams = yield* $(routeB.match(remainingPath))

      if (M.isNone(bParams)) {
        return M.none
      }

      return M.some({
        ...aParams.value,
        ...bParams.value,
      } as unknown as ParamsOf<PathJoin<[P1, P2]>>)
    })

  return {
    ...makeRoute(pathJoin(routeA.path, routeB.path)),
    // Save any guards by matching manually
    match,
  }
}

/* End Region: Route */

// ** Type-level Tests **

// Should always be dead-code eliminated

const query = queryParams(queryParam('d', optional(param('foo'))), queryParam('e', unnamed))
const path = pathJoin('test', param('bar'), optional(prefix('~', param('baz'))), query)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const check: <_ extends 1>() => true

type Path_ = typeof path
type Params_ = ParamsOf<Path_>
type QueryParams_ = QueryParamsOf<Path_>

// eslint-disable-next-line no-constant-condition
if (false) {
  check<
    A.Equals<
      Params_,
      {
        readonly bar: string
        readonly baz?: string
        readonly foo?: string
        readonly 0: string
      }
    >
  >()

  check<
    A.Equals<
      QueryParams_,
      {
        readonly d?: string
        readonly e: string
      }
    >
  >()

  check<
    A.Equals<
      Interpolate<Path_, { foo: 'foo'; bar: 'bar'; baz: 'baz'; 0: '0' }>,
      '/test/bar~baz?d=foo&e=0'
    >
  >()

  check<A.Equals<Interpolate<Path_, { bar: 'bar'; 0: '0' }>, '/test/bar?e=0'>>()
}
