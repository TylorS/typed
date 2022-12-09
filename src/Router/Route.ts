/**
 * This DSL represents all of the standard syntax for path-to-regexp (e.g. used in express.js and many other libs)
 * but does not cover the fancier regex validations that are techincally possible.
 */
import * as Effect from '@effect/core/io/Effect'
import * as M from '@tsplus/stdlib/data/Maybe'
import * as ptr from 'path-to-regexp'
import { A } from 'ts-toolbelt'

import * as P from './Path.js'

/* Start Region: Route */

export interface Route<P extends string, R = never, E = never> {
  readonly path: P
  readonly match: (path: string) => Effect.Effect<R, E, M.Maybe<P.ParamsOf<P>>>
  readonly createPath: <I extends P.ParamsOf<P>>(params: I) => P.Interpolate<P, I>
}

export type PathOf<A> = [A] extends [Route<infer R, any, any>] ? R : never
export type ResourcesOf<A> = [A] extends [Route<any, infer R, any>] ? R : never
export type ErrorsOf<A> = [A] extends [Route<any, any, infer R>] ? R : never

export type ParamsOf<T> = P.ParamsOf<PathOf<T>>

export function makeRoute<P extends string>(path: P): Route<P> {
  // eslint-disable-next-line import/no-named-as-default-member
  const parse = ptr.match(path, { end: false })
  // eslint-disable-next-line import/no-named-as-default-member
  const createPath = ptr.compile(path)

  const match = (input: string) =>
    Effect.sync(() => {
      const match = parse(input)

      return !match ? M.none : M.some({ ...match.params } as unknown as P.ParamsOf<P>)
    })

  return {
    path,
    match,
    createPath: createPath as Route<P, unknown>['createPath'],
  }
}

export function guard<P extends string, R, E, R2, E2>(
  route: Route<P, R, E>,
  guard: (params: P.ParamsOf<P>, path: string) => Effect.Effect<R2, E2, boolean>,
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
): Route<P.PathJoin<[P1, P2]>, R | R2, E | E2> {
  const match = (path: string) =>
    Effect.gen(function* ($) {
      const aParams = yield* $(routeA.match(path))

      if (M.isNone(aParams)) {
        return M.none
      }

      const aPath = routeA.createPath(aParams.value)
      const remainingPath = P.pathJoin(path.replace(aPath, '')) || '/'
      const bParams = yield* $(routeB.match(remainingPath))

      if (M.isNone(bParams)) {
        return M.none
      }

      return M.some({
        ...aParams.value,
        ...bParams.value,
      } as unknown as P.ParamsOf<P.PathJoin<[P1, P2]>>)
    })

  return {
    ...makeRoute(P.pathJoin(routeA.path, routeB.path)),
    // Save any guards by matching manually
    match,
  }
}

export const baseRoute = makeRoute('/')

export const homeRoute = guard(baseRoute, (_, path) => Effect.succeed(path === '/'))

/* End Region: Route */

// ** Type-level Tests **

// Should always be dead-code eliminated

const query = P.queryParams(
  P.queryParam('d', P.optional(P.param('foo'))),
  P.queryParam('e', P.unnamed),
)
const path = P.pathJoin('test', P.param('bar'), P.optional(P.prefix('~', P.param('baz'))), query)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const check: <_ extends 1>() => true

type Path_ = typeof path
type Params_ = P.ParamsOf<Path_>
type QueryParams_ = P.QueryParamsOf<Path_>

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
      P.Interpolate<Path_, { foo: 'foo'; bar: 'bar'; baz: 'baz'; 0: '0' }>,
      '/test/bar~baz?d=foo&e=0'
    >
  >()

  check<A.Equals<P.Interpolate<Path_, { bar: 'bar'; 0: '0' }>, '/test/bar?e=0'>>()
}
