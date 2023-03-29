import { pipe } from '@effect/data/Function'
import * as RA from '@effect/data/ReadonlyArray'
import type * as RR from '@effect/data/ReadonlyRecord'
import * as Effect from '@effect/io/Effect'
import type { ParseOptions } from '@effect/schema/AST'
import * as ParseResult from '@effect/schema/ParseResult'

import { compose } from './compose.js'
import type { Decoder } from './decoder.js'

const isRecord = (i: unknown): i is RR.ReadonlyRecord<unknown> =>
  typeof i === 'object' && i !== null && !Array.isArray(i)

export const unknownRecord: Decoder<unknown, RR.ReadonlyRecord<unknown>> = (i) =>
  isRecord(i) ? ParseResult.success(i) : ParseResult.failure(ParseResult.unexpected(i))

export const fromRecord =
  <I, O>(member: Decoder<I, O>): Decoder<RR.ReadonlyRecord<I>, RR.ReadonlyRecord<O>> =>
  (i: RR.ReadonlyRecord<I>, options?: ParseOptions) =>
    Effect.gen(function* ($) {
      const results = yield* $(
        Effect.all(
          pipe(
            Object.entries(i),
            RA.map(([k, v]) =>
              pipe(
                member(v, options),
                ParseResult.effect,
                Effect.mapBoth(
                  (e) => ParseResult.key(k, e.errors),
                  (a) => [k, a] as const,
                ),
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

      return Object.fromEntries(successes)
    })

export const record = <O>(member: Decoder<unknown, O>): Decoder<unknown, RR.ReadonlyRecord<O>> =>
  pipe(unknownRecord, compose(fromRecord(member)))
