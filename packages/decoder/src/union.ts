import * as Either from "@effect/data/Either"
import type { NonEmptyReadonlyArray } from "@effect/data/ReadonlyArray"
import * as Effect from "@effect/io/Effect"
import * as ParseResult from "@effect/schema/ParseResult"

import { Decoder } from "./Decoder"
import type { OutputOf } from "./Decoder"

export function union<Members extends NonEmptyReadonlyArray<Decoder<unknown, any>>>(
  ...members: Members
): Decoder<unknown, OutputOf<Members[number]>> {
  return Decoder((i, options) =>
    Effect.gen(function*($) {
      const failures: Array<ParseResult.ParseErrors> = []

      for (const member of members) {
        const result = yield* $(Effect.either(member(i, options)))

        if (Either.isRight(result)) {
          return result.right
        } else if (options?.errors === "first") {
          return yield* $(Effect.fail(result.left))
        }
      }

      return yield* $(
        Effect.fail(
          ParseResult.parseError(
            failures as unknown as NonEmptyReadonlyArray<ParseResult.ParseErrors>
          )
        )
      )
    })
  )
}
