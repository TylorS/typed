import type { ParseOptions } from "@effect/schema/AST"
import * as PR from "@effect/schema/ParseResult"
import { Effect, pipe, ReadonlyArray as RA } from "effect"
import type { NonEmptyReadonlyArray } from "effect/ReadonlyArray"

import { compose } from "@typed/decoder/compose"
import type { Decoder } from "@typed/decoder/decoder"

export const unknownArray: Decoder<unknown, ReadonlyArray<unknown>> = (i) =>
  Array.isArray(i) ? PR.success(i) : PR.failure(PR.unexpected(i))

export const fromArray =
  <I, O>(member: Decoder<I, O>): Decoder<ReadonlyArray<I>, ReadonlyArray<O>> =>
  (i: ReadonlyArray<I>, options?: ParseOptions) => {
    return Effect.gen(function*($) {
      const results = yield* $(
        Effect.all(
          pipe(
            i,
            RA.map((ix, idx) =>
              pipe(
                member(ix, options),
                Effect.mapError((e: PR.ParseError) => PR.index(idx, e.errors)),
                Effect.either
              )
            )
          )
        )
      )
      const [failures, successes] = RA.separate(results)

      if (RA.isNonEmptyReadonlyArray(failures)) {
        return yield* $(Effect.fail(PR.parseError(failures)))
      }

      return successes
    })
  }

export const array = <O>(member: Decoder<unknown, O>): Decoder<unknown, ReadonlyArray<O>> =>
  pipe(unknownArray, compose(fromArray(member)))

export const fromNonEmptyArray =
  <I, O>(member: Decoder<I, O>): Decoder<ReadonlyArray<I>, NonEmptyReadonlyArray<O>> => (i, options) => {
    if (i.length === 0) {
      return PR.failure(PR.unexpected(i))
    }

    return fromArray(member)(i, options) as PR.ParseResult<NonEmptyReadonlyArray<O>>
  }

export const nonEmptyArray = <O>(member: Decoder<unknown, O>): Decoder<unknown, NonEmptyReadonlyArray<O>> =>
  pipe(unknownArray, compose(fromNonEmptyArray(member)))
