import type * as ParseResult from "@effect/schema/ParseResult"
import { formatErrors } from "@effect/schema/TreeFormatter"
import { Effect } from "effect"

export function formatResult<A>(result: ParseResult.ParseResult<A>): Effect.Effect<never, string, A> {
  return Effect.mapError(result, (e) => formatErrors(e.errors))
}
