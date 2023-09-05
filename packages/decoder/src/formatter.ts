import type { Effect } from "@effect/io/Effect"
import { mapError } from "@effect/io/Effect"
import type * as ParseResult from "@effect/schema/ParseResult"
import { formatErrors } from "@effect/schema/TreeFormatter"

export function formatResult<A>(result: ParseResult.ParseResult<A>): Effect<never, string, A> {
  return mapError(result, (e) => formatErrors(e.errors))
}
