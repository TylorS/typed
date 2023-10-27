import * as PR from "@effect/schema/ParseResult"
import { Effect, Either, pipe, ReadonlyArray as RA } from "effect"
import type { ReadonlyRecord } from "effect/ReadonlyRecord"

import { compose } from "@typed/decoder/compose"
import type { Decoder, InputOf, OutputOf } from "@typed/decoder/decoder"
import { unknownRecord } from "@typed/decoder/record"

export function fromPartial<P extends ReadonlyRecord<Decoder<any, any>>>(
  properties: P
): Decoder<{ readonly [K in keyof P]?: InputOf<P[K]> }, { readonly [K in keyof P]?: OutputOf<P[K]> }> {
  return (i, options) =>
    Effect.gen(function*($) {
      const keys = Reflect.ownKeys(properties) as Array<keyof P>
      const successes: Partial<Record<keyof P, any>> = {}
      const errors: Array<PR.ParseErrors> = []
      for (const key of keys) {
        const property = properties[key]

        if (!property || !(key in i)) continue

        if (options?.errors === "first") {
          successes[key] = yield* $(property(i[key], options))
        } else {
          const either = yield* $(Effect.either(property(i[key], options)))

          if (Either.isLeft(either)) {
            errors.push(PR.key(key, either.left.errors))
          } else {
            successes[key] = either.right
          }
        }
      }

      if (RA.isNonEmptyReadonlyArray(errors)) {
        return yield* $(Either.left(PR.parseError(errors)))
      }

      return successes
    })
}

export const partial = <P extends ReadonlyRecord<Decoder<unknown, any>>>(
  properties: P
): Decoder<unknown, { readonly [K in keyof P]?: OutputOf<P[K]> }> =>
  pipe(
    unknownRecord as Decoder<unknown, { readonly [K in keyof P]?: InputOf<P[K]> }>,
    compose(fromPartial(properties))
  )
