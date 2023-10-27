import type { ParseOptions } from "@effect/schema/AST"
import * as ParseResult from "@effect/schema/ParseResult"
import { Effect, pipe, ReadonlyArray as RA } from "effect"
import type { ReadonlyRecord } from "effect/ReadonlyRecord"

import { compose } from "@typed/decoder/compose"
import type { Decoder } from "@typed/decoder/decoder"

const isRecord = (i: unknown): i is ReadonlyRecord<unknown> => typeof i === "object" && i !== null && !Array.isArray(i)

export const unknownRecord: Decoder<unknown, ReadonlyRecord<unknown>> = (i) =>
  isRecord(i) ? ParseResult.success(i) : ParseResult.failure(ParseResult.unexpected(i))

export const fromRecord =
  <I, O>(member: Decoder<I, O>): Decoder<ReadonlyRecord<I>, ReadonlyRecord<O>> =>
  (i: ReadonlyRecord<I>, options?: ParseOptions) => {
    return Effect.gen(function*($) {
      const results = yield* $(
        Effect.all(
          pipe(
            Object.entries(i),
            RA.map(([k, v]) =>
              pipe(
                member(v, options),
                Effect.mapBoth({
                  onFailure: (e: ParseResult.ParseError) => ParseResult.key(k, e.errors),
                  onSuccess: (a: O) => [k, a] as const
                }),
                Effect.either
              )
            )
          )
        )
      )
      const [failures, successes] = RA.separate(results)

      if (RA.isNonEmptyReadonlyArray(failures)) {
        return yield* $(Effect.fail(ParseResult.parseError(failures)))
      }

      return Object.fromEntries(successes)
    })
  }

export const record = <O>(member: Decoder<unknown, O>): Decoder<unknown, ReadonlyRecord<O>> =>
  pipe(unknownRecord, compose(fromRecord(member)))
