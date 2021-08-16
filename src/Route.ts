/**
 * This DSL represents all of the standard syntax for path-to-regexp (e.g. used in express.js and many other libs)
 * but does not cover the fancier regex validations that are techincally possible.
 */
import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import ptr from 'path-to-regexp'
import { A } from 'ts-toolbelt'

import {
  Interpolate,
  optional,
  param,
  ParamsOf,
  pathJoin,
  prefix,
  queryParam,
  queryParams,
  QueryParamsOf,
  unnamed,
} from './Path'
import { altAll, ReaderOption } from './ReaderOption'

/* End Region: Interpolations */

/* Start Region: Route */

/**
 * @category Model
 * @since 0.13.0
 */
export interface Route<P extends string, A = ParamsOf<P>> {
  readonly path: P
  readonly match: ReaderOption<string, A>
  readonly createPath: <I extends ParamsOf<P>>(params: I) => Interpolate<P, I>
}

/**
 * @category Type-level
 * @since 0.13.0
 */
export type PathOf<A> = [A] extends [Route<infer R>] ? R : never

/**
 * @category Type-level
 * @since 0.13.0
 */
export type ValueOf<A> = [A] extends [Route<infer R>] ? ParamsOf<R> : never

/**
 * @category Constructor
 * @since 0.13.0
 */
export function make<P extends string>(path: P): Route<P> {
  const parse = ptr.match(path)
  const createPath = ptr.compile(path)

  return {
    path,
    match: (path: string) => {
      const match = parse(path)

      return !match ? O.none : O.some(match.params as ParamsOf<P>)
    },
    createPath: createPath as Route<P>['createPath'],
  }
}

/**
 * @category Combinator
 * @since 0.13.0
 */
export function map<A, B>(f: (value: A) => B) {
  return <P extends string>(route: Route<P, A>): Route<P, B> => {
    return {
      ...route,
      match: (r) => pipe(r, route.match, O.map(f)),
    }
  }
}

/* End Region: Route */

/**
 * @category Combinator
 * @since 0.13.0
 */
export function oneOf<Routes extends readonly [Route<string>, ...Route<string>[]]>(
  ...[first, ...rest]: Routes
): ReaderOption<string, OneOf<Routes>> {
  return (path: string) => {
    const f = first.match
    const rs = rest.map((r) => r.match)
    const all = pipe(rs, altAll(f))

    return all(path) as O.Option<OneOf<Routes>>
  }
}

/**
 * @category Type-level
 * @since 0.13.0
 */
export type OneOf<Routes extends readonly [Route<string>, ...Route<string>[]]> = ValueOf<
  Routes[number]
>

// ** Type-level Tests **

// Should always be dead-code eliminated

const query = queryParams(queryParam('d', optional(param('foo'))), queryParam('e', unnamed))
const path = pathJoin('foo', param('bar'), optional(prefix('-', param('baz'))), unnamed, query)

declare const check: <_ extends 1>() => true

type Path_ = typeof path
type Params_ = ParamsOf<Path_>
type QueryParams_ = QueryParamsOf<Path_>

type Input_ = { bar: '1'; 0: '2'; foo: '3'; 1: '4' }
type Interpolated_ = Interpolate<Path_, Input_>

check<
  A.Equals<
    Params_,
    {
      readonly bar: string
      readonly baz?: string
      readonly 0: string
      readonly foo?: string
      readonly 1: string
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

check<A.Equals<Interpolated_, '/foo/1/2?d=3&e=4'>>()
