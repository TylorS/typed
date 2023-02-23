import type { Refinement } from '@effect/data/Predicate'
import * as ParseResult from '@fp-ts/schema/ParseResult'

import type { Decoder } from './decoder.js'

export function fromRefinement<A, B extends A>(refinement: Refinement<A, B>): Decoder<A, B> {
  return (a) =>
    refinement(a) ? ParseResult.success(a) : ParseResult.failure(ParseResult.unexpected(a))
}
