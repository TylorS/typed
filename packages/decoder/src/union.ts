import type { NonEmptyReadonlyArray } from '@effect/data/ReadonlyArray'
import * as ParseResult from '@fp-ts/schema/ParseResult'

import type { Decoder, OutputOf } from './decoder.js'

export function union<Members extends NonEmptyReadonlyArray<Decoder<unknown, any>>>(
  ...members: Members
): Decoder<unknown, OutputOf<Members[number]>> {
  return (i, options) => {
    const failures: ParseResult.ParseError[] = []
    for (const member of members) {
      const result = member(i, options)
      if (ParseResult.isSuccess(result)) {
        return result
      }
    }

    return ParseResult.failures(
      failures as unknown as NonEmptyReadonlyArray<ParseResult.ParseError>,
    )
  }
}
