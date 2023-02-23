import * as Either from '@effect/data/Either'
import { pipe } from '@effect/data/Function'
import * as RA from '@effect/data/ReadonlyArray'
import * as ParseResult from '@fp-ts/schema/ParseResult'

import { compose } from './compose.js'
import type { Decoder } from './decoder.js'

export const unknownArray: Decoder<unknown, ReadonlyArray<unknown>> = (i) =>
  Array.isArray(i) ? ParseResult.success(i) : ParseResult.failure(ParseResult.unexpected(i))

export const fromArray =
  <I, O>(member: Decoder<I, O>): Decoder<readonly I[], readonly O[]> =>
  (i, options) => {
    const [failures, successes] = RA.separate(
      pipe(
        i,
        RA.map((ix, idx) =>
          pipe(
            member(ix, options),
            Either.mapLeft((errors) => ParseResult.index(idx, errors)),
          ),
        ),
      ),
    )

    if (RA.isNonEmptyReadonlyArray(failures)) {
      return ParseResult.failures(failures)
    }

    return ParseResult.success(successes)
  }

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
