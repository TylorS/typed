import * as Either from '@effect/data/Either'
import { pipe } from '@effect/data/Function'
import * as RA from '@effect/data/ReadonlyArray'
import type * as RR from '@effect/data/ReadonlyRecord'
import * as ParseResult from '@fp-ts/schema/ParseResult'

import { compose } from './compose.js'
import type { Decoder } from './decoder.js'

const isRecord = (i: unknown): i is RR.ReadonlyRecord<unknown> =>
  typeof i === 'object' && i !== null && !Array.isArray(i)

export const unknownRecord: Decoder<unknown, RR.ReadonlyRecord<unknown>> = (i) =>
  isRecord(i) ? ParseResult.success(i) : ParseResult.failure(ParseResult.unexpected(i))

export const fromRecord =
  <I, O>(member: Decoder<I, O>): Decoder<RR.ReadonlyRecord<I>, RR.ReadonlyRecord<O>> =>
  (i, options) => {
    const [failures, successes] = RA.separate(
      pipe(
        Object.entries(i),
        RA.map(([key, value]) =>
          pipe(
            member(value, options),
            Either.bimap(
              (errors) => ParseResult.key(key, errors),
              (o) => [key, o] as const,
            ),
          ),
        ),
      ),
    )

    if (RA.isNonEmptyReadonlyArray(failures)) {
      return ParseResult.failures(failures)
    }

    return ParseResult.success(Object.fromEntries(successes))
  }

export const record = <O>(member: Decoder<unknown, O>): Decoder<unknown, RR.ReadonlyRecord<O>> =>
  pipe(unknownRecord, compose(fromRecord(member)))
