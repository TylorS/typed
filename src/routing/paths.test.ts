import { describe, given, it } from '@typed/test'
import { A } from 'ts-toolbelt'

import {
  Interpolate,
  optional,
  param,
  ParamsOf,
  pathJoin,
  queryParam,
  queryParams,
  QueryParamsOf,
  unnamed,
} from '.'

const query = queryParams(queryParam('d', optional(param('foo'))), queryParam('e', unnamed))
const path = pathJoin('foo', param('bar'), unnamed, query)

export const test = describe('pathJoin', [
  given(`Path Parts`, [
    it(`returns expected path`, ({ equal }) => {
      equal('/foo/:bar/(.*)\\?d=:foo?&e=(.*)', path)
    }),
  ]),
])

// Type-level tests
declare const check: <_ extends 1>() => true

type Path = typeof path
type Params = ParamsOf<Path>
type QueryParams = QueryParamsOf<Path>

type Input = { bar: '1'; 0: '2'; foo: '3'; 1: '4' }
type Interpolated = Interpolate<Path, Input>

if (typeof check !== 'undefined') {
  check<
    A.Equals<
      Params,
      {
        readonly bar: string
        readonly 0: string
        readonly foo?: string | undefined
        readonly 1: string
      }
    >
  >()

  check<
    A.Equals<
      QueryParams,
      {
        readonly d?: string
        readonly e: string
      }
    >
  >()

  check<A.Equals<Interpolated, '/foo/1/2?d=3&e=4'>>()
}
