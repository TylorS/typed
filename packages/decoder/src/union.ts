import * as PR from "@effect/schema/ParseResult"
import type { ReadonlyArray } from "effect"
import { Effect, Either } from "effect"

import type { Decoder, OutputOf } from "@typed/decoder/decoder"

export function union<Members extends ReadonlyArray.NonEmptyReadonlyArray<Decoder<unknown, any>>>(
  ...members: Members
): Decoder<unknown, OutputOf<Members[number]>> {
  return (i, options) =>
    Effect.gen(function*($) {
      const failures: Array<PR.ParseErrors> = []

      for (const member of members) {
        const result = yield* $(Effect.either(member(i, options)))

        if (Either.isRight(result)) {
          return result.right
        }
      }

      return yield* $(
        Effect.fail(PR.parseError(failures as unknown as ReadonlyArray.NonEmptyReadonlyArray<PR.ParseErrors>))
      )
    })
}
