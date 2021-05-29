import { describe, given, it } from '@typed/test'
import { A } from 'ts-toolbelt'

import {
  optional,
  Param,
  param,
  ParamsOf,
  pathJoin,
  PathToParts,
  queryParam,
  queryParams,
  QueryParamsOf,
  Unnamed,
  unnamed,
} from '.'

const path = pathJoin(
  'foo',
  param('bar'),
  unnamed,
  queryParams(queryParam('d', optional(param('foo'))), queryParam('e', unnamed)),
)

export const test = describe('pathJoin', [
  given(`Path Parts`, [
    it(`returns expected path`, ({ equal }) => {
      equal('/foo/:bar/(.*)\\?d=:foo?&e=(.*)', path)
    }),
  ]),
])

// Type-level tests
declare const check: <_ extends 1>() => true

if (typeof check !== 'undefined') {
  type Path = typeof path
  type Parts = PathToParts<Path>
  type Params = ParamsOf<Path>
  type QueryParamsP = QueryParamsOf<Path>

  check<A.Equals<Parts, readonly ['foo', Param<'bar'>, Unnamed, '\\?d=:foo?&e=(.*)']>>()

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
      QueryParamsP,
      {
        readonly d?: string
        readonly e: string
      }
    >
  >()
}
