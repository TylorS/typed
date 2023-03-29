import * as Either from '@effect/data/Either'
import * as Effect from '@effect/io/Effect'
import * as ParseResult from '@effect/schema/ParseResult'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type IOError<T> = T extends ParseResult.IO<infer E, infer _> ? E : never
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type IOOutput<T> = T extends ParseResult.IO<infer _, infer A> ? A : never

export function mapError<E, A, E2>(
  io: ParseResult.IO<E, A>,
  f: (e: E) => E2,
): ParseResult.IO<E2, A> {
  if (Effect.isEffect(io)) {
    return Effect.mapError(io, f)
  }

  return Either.mapLeft(io, f)
}
