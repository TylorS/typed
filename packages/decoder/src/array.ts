import * as Either from '@fp-ts/core/Either'
import { pipe } from '@fp-ts/core/Function'
import * as RA from '@fp-ts/core/ReadonlyArray'
import * as ParseResult from '@fp-ts/schema/ParseResult'

import { compose } from './compose.js'
import type { Decoder } from './decoder.js'

export const unknownArray: Decoder<unknown, ReadonlyArray<unknown>> = {
  decode: (i) =>
    Array.isArray(i) ? ParseResult.success(i) : ParseResult.failure(ParseResult.unexpected(i)),
}

export const fromArray = <I, O>(member: Decoder<I, O>): Decoder<readonly I[], readonly O[]> => ({
  decode: (i, options) => {
    const [failures, successes] = RA.separate(
      pipe(
        i,
        RA.mapWithIndex((ix, idx) =>
          pipe(
            member.decode(ix, options),
            Either.mapLeft((errors) => ParseResult.index(idx, errors)),
          ),
        ),
      ),
    )

    if (RA.isNonEmpty(failures)) {
      return ParseResult.failures(failures)
    }

    return ParseResult.success(successes)
  },
})

export const array = <O>(member: Decoder<unknown, O>): Decoder<unknown, readonly O[]> =>
  pipe(unknownArray, compose(fromArray(member)))

export const fromNonEmptyArray = <I, O>(
  member: Decoder<I, O>,
): Decoder<readonly I[], readonly O[]> => ({
  decode: (i, options) => {
    if (i.length === 0) {
      return ParseResult.failure(ParseResult.unexpected(i))
    }

    return fromArray(member).decode(i, options)
  },
})

export const nonEmptyArray = <O>(member: Decoder<unknown, O>): Decoder<unknown, readonly O[]> =>
  pipe(unknownArray, compose(fromNonEmptyArray(member)))
