import * as Either from '@effect/data/Either'
import { pipe } from '@effect/data/Function'
import type * as ParseResult from '@fp-ts/schema/ParseResult'
import { formatErrors } from '@fp-ts/schema/formatter/Tree'

export function formatResult<A>(result: ParseResult.ParseResult<A>): Either.Either<string, A> {
  return pipe(result, Either.mapLeft(formatErrors))
}
