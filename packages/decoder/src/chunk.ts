import * as C from '@effect/data/Chunk'
import * as Either from '@effect/data/Either'
import { pipe } from '@effect/data/Function'
import type { NonEmptyReadonlyArray } from '@effect/data/ReadonlyArray'
import * as ParseResult from '@fp-ts/schema/ParseResult'

import { compose } from './compose.js'
import type { Decoder } from './decoder.js'

export const unknownChunk: Decoder<unknown, C.Chunk<unknown>> = (i) =>
  C.isChunk(i) ? ParseResult.success(i) : ParseResult.failure(ParseResult.unexpected(i))

export const fromChunk =
  <I, O>(member: Decoder<I, O>): Decoder<C.Chunk<I>, C.Chunk<O>> =>
  (i, options) => {
    const [failures, successes] = C.separate(
      pipe(
        i,
        C.mapWithIndex((ix, idx) =>
          pipe(
            member(ix, options),
            Either.mapLeft((errors) => ParseResult.index(idx, errors)),
          ),
        ),
      ),
    )

    if (C.isNonEmpty(failures)) {
      return ParseResult.failures(
        failures.toReadonlyArray() as NonEmptyReadonlyArray<ParseResult.ParseError>,
      )
    }

    return ParseResult.success(successes)
  }

export const chunk = <O>(member: Decoder<unknown, O>): Decoder<unknown, C.Chunk<O>> =>
  pipe(unknownChunk, compose(fromChunk(member)))

export const fromNonEmptyChunk =
  <I, O>(member: Decoder<I, O>): Decoder<C.Chunk<I>, C.NonEmptyChunk<O>> =>
  (i, options) => {
    if (!i.isNonEmpty()) {
      return ParseResult.failure(ParseResult.unexpected(i))
    }

    return fromChunk(member)(i, options) as any
  }

export const nonEmptyChunk = <O>(
  member: Decoder<unknown, O>,
): Decoder<unknown, C.NonEmptyChunk<O>> => pipe(unknownChunk, compose(fromNonEmptyChunk(member)))
