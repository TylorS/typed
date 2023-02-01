import { pipe } from '@fp-ts/core/Function'
import { isNonEmpty } from '@fp-ts/core/ReadonlyArray'
import type { ReadonlyRecord } from '@fp-ts/core/ReadonlyRecord'
import * as ParseResult from '@fp-ts/schema/ParseResult'

import { compose } from './compose.js'
import type { Decoder, InputOf, OutputOf } from './decoder.js'
import { unknownRecord } from './record.js'

export function fromStruct<P extends ReadonlyRecord<Decoder<any, any>>>(
  properties: P,
): Decoder<
  {
    readonly [K in keyof P]: InputOf<P[K]>
  },
  {
    readonly [K in keyof P]: OutputOf<P[K]>
  }
> {
  return {
    decode: (i, options) => {
      const keys = Reflect.ownKeys(properties) as (keyof P)[]
      const failures: ParseResult.ParseError[] = []
      const successes: Partial<Record<keyof P, any>> = {}
      for (const key of keys) {
        const property = properties[key]

        if (!property) continue

        const result = property.decode(i[key], options)

        if (ParseResult.isFailure(result)) {
          failures.push(ParseResult.key(key, result.left))
        } else {
          successes[key] = result.right
        }
      }

      if (isNonEmpty(failures)) {
        return ParseResult.failures(failures)
      }

      return ParseResult.success(successes as any)
    },
  }
}

export const struct = <P extends ReadonlyRecord<Decoder<unknown, any>>>(
  properties: P,
): Decoder<
  unknown,
  {
    readonly [K in keyof P]: OutputOf<P[K]>
  }
> =>
  pipe(
    unknownRecord as Decoder<
      unknown,
      {
        readonly [K in keyof P]: InputOf<P[K]>
      }
    >,
    compose(fromStruct(properties)),
  )
