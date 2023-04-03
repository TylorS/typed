import { mapError } from '@effect/io/Effect'
import * as ParseResult from '@effect/schema/ParseResult'
import { formatErrors } from '@effect/schema/TreeFormatter'

export function formatResult<A>(result: ParseResult.ParseResult<A>): ParseResult.IO<string, A> {
  return mapError(result, (e) => formatErrors(e.errors))
}
