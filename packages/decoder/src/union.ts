import * as Either from '@effect/data/Either'
import type { NonEmptyReadonlyArray } from '@effect/data/ReadonlyArray'
import * as Effect from '@effect/io/Effect'
import * as ParseResult from '@effect/schema/ParseResult'

import type { Decoder, OutputOf } from './decoder.js'

export function union<Members extends NonEmptyReadonlyArray<Decoder<unknown, any>>>(
  ...members: Members
): Decoder<unknown, OutputOf<Members[number]>> {
  return (i, options) =>
    Effect.gen(function* ($) {
      const failures: ParseResult.ParseErrors[] = []

      for (const member of members) {
        const result = yield* $(Effect.either(ParseResult.effect(member(i, options))))

        if (Either.isRight(result)) {
          return result.right
        }
      }

      return yield* $(
        Effect.fail(
          ParseResult.parseError(
            failures as unknown as NonEmptyReadonlyArray<ParseResult.ParseErrors>,
          ),
        ),
      )
    })
}
