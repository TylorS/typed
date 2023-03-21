import * as Either from '@effect/data/Either'
import { pipe } from '@effect/data/Function'
import * as RA from '@effect/data/ReadonlyArray'
import type { ReadonlyRecord } from '@effect/data/ReadonlyRecord'
import * as Effect from '@effect/io/Effect'
import * as ParseResult from '@effect/schema/ParseResult'

import { compose } from './compose.js'
import type { Decoder, InputOf, OutputOf } from './decoder.js'
import { unknownRecord } from './record.js'

export function fromPartial<P extends ReadonlyRecord<Decoder<any, any>>>(
  properties: P,
): Decoder<
  {
    readonly [K in keyof P]?: InputOf<P[K]>
  },
  {
    readonly [K in keyof P]?: OutputOf<P[K]>
  }
> {
  return (i, options) =>
    Effect.gen(function* ($) {
      const keys = Reflect.ownKeys(properties) as (keyof P)[]
      const successes: Partial<Record<keyof P, any>> = {}
      const errors: ParseResult.ParseErrors[] = []
      for (const key of keys) {
        const property = properties[key]

        if (!property || !(key in i)) continue

        if (options?.allErrors) {
          const either = yield* $(Effect.either(property(i[key], options)))

          if (Either.isLeft(either)) {
            errors.push(ParseResult.key(key, either.left.errors))
          } else {
            successes[key] = either.right
          }
        } else {
          successes[key] = yield* $(property(i[key], options))
        }
      }

      if (RA.isNonEmptyReadonlyArray(errors)) {
        return yield* $(Effect.fail(ParseResult.parseError(errors)))
      }

      return successes
    })
}

export const partial = <P extends ReadonlyRecord<Decoder<unknown, any>>>(
  properties: P,
): Decoder<
  unknown,
  {
    readonly [K in keyof P]?: OutputOf<P[K]>
  }
> =>
  pipe(
    unknownRecord as Decoder<
      unknown,
      {
        readonly [K in keyof P]?: InputOf<P[K]>
      }
    >,
    compose(fromPartial(properties)),
  )
