import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import type * as ParseResult from '@effect/schema/ParseResult'
import { formatErrors } from '@effect/schema/TreeFormatter'

export function formatResult<A>(result: ParseResult.ParseResult<A>) {
  return pipe(
    result,
    Effect.mapError((e) => formatErrors(e.errors)),
  )
}
