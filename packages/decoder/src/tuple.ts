import * as Either from '@effect/data/Either'
import { pipe } from '@effect/data/Function'
import * as RA from '@effect/data/ReadonlyArray'
import * as ParseResult from '@fp-ts/schema/ParseResult'

import { unknownArray } from './array.js'
import { compose } from './compose.js'
import type { Decoder, InputOf, OutputOf } from './decoder.js'

export const fromTuple =
  <Members extends RA.NonEmptyReadonlyArray<Decoder<any, any>>>(
    ...members: Members
  ): Decoder<
    { readonly [K in keyof Members]: InputOf<Members[K]> },
    { readonly [K in keyof Members]: OutputOf<Members[K]> }
  > =>
  (i, options) => {
    const [failures, successes] = RA.separate(
      pipe(
        i,
        RA.map((ix, idx) =>
          pipe(
            members[idx](ix, options),
            Either.mapLeft((errors) => ParseResult.index(idx, errors)),
          ),
        ),
      ),
    )

    if (RA.isNonEmptyReadonlyArray(failures)) {
      return ParseResult.failures(failures)
    }

    return ParseResult.success(successes as { readonly [K in keyof Members]: OutputOf<Members[K]> })
  }

export const tuple = <Members extends RA.NonEmptyReadonlyArray<Decoder<any, any>>>(
  ...members: Members
): Decoder<unknown, { readonly [K in keyof Members]: OutputOf<Members[K]> }> =>
  pipe(
    unknownArray as unknown as Decoder<
      unknown,
      { readonly [K in keyof Members]: InputOf<Members[K]> }
    >,
    compose(fromTuple<Members>(...members)),
  )
