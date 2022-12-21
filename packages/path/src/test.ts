import { ParamsOf } from './ParamsOf.js'
import { unnamed } from './ast.js'
import { queryParams, queryParam, optional, param, prefix } from './dsl.js'

const query = queryParams(queryParam('d', optional(param('foo'))), queryParam('e', unnamed))
const path = pathJoin('test', param('bar'), optional(prefix('~', param('baz'))), query)

declare const check: <_ extends 1>() => true

type Path_ = typeof path
type Params_ = ParamsOf<Path_>
// type QueryParams_ = QueryParamsOf<Path_>

check<
  Equals<
    Params_,
    {
      readonly bar: string
      readonly baz?: string
      readonly foo?: string
      readonly 0: string
    }
  >
>()
