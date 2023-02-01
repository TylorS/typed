import { pipe } from '@fp-ts/core/Function'
import type { ReadonlyRecord } from '@fp-ts/core/ReadonlyRecord'
import * as ParseResult from '@fp-ts/schema/ParseResult'

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
  return (i, options) => {
    const keys = Reflect.ownKeys(properties) as (keyof P)[]
    const successes: Partial<Record<keyof P, any>> = {}
    for (const key of keys) {
      const property = properties[key]

      if (!property || !(key in i)) continue

      const result = property(i[key], options)

      if (ParseResult.isSuccess(result)) {
        successes[key] = result.right
      }
    }

    return ParseResult.success(successes as any)
  }
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
