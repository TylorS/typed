import { pipe } from '@effect/data/Function'
import * as RA from '@effect/data/ReadonlyArray'
import * as Effect from '@effect/io/Effect'
import type { ParseOptions } from '@effect/schema/AST'
import * as ParseResult from '@effect/schema/ParseResult'

import { compose } from './compose.js'
import type { Decoder } from './decoder.js'

export const unknownArray: Decoder<unknown, ReadonlyArray<unknown>> = (i) =>
  Array.isArray(i) ? ParseResult.success(i) : ParseResult.failure(ParseResult.unexpected(i))

export const fromArray =
  <I, O>(member: Decoder<I, O>): Decoder<readonly I[], readonly O[]> =>
  (i: readonly I[], options?: ParseOptions) =>
    Effect.gen(function* ($) {
      const results = yield* $(
        Effect.all(
          pipe(
            i,
            RA.map((ix, idx) =>
              pipe(
                member(ix, options),
                ParseResult.effect,
                Effect.mapError((e) => ParseResult.index(idx, e.errors)),
                Effect.either,
              ),
            ),
          ),
        ),
      )
      const [failures, successes] = RA.separate(results)

      if (RA.isNonEmptyReadonlyArray(failures)) {
        return yield* $(Effect.fail(ParseResult.parseError(failures)))
      }

      return successes
    })

export const array = <O>(member: Decoder<unknown, O>): Decoder<unknown, readonly O[]> =>
  pipe(unknownArray, compose(fromArray(member)))

export const fromNonEmptyArray =
  <I, O>(member: Decoder<I, O>): Decoder<readonly I[], readonly O[]> =>
  (i, options) => {
    if (i.length === 0) {
      return ParseResult.failure(ParseResult.unexpected(i))
    }

    return fromArray(member)(i, options)
  }

export const nonEmptyArray = <O>(member: Decoder<unknown, O>): Decoder<unknown, readonly O[]> =>
  pipe(unknownArray, compose(fromNonEmptyArray(member)))
