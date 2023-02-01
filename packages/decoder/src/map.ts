import * as Either from '@fp-ts/core/Either'
import { pipe } from '@fp-ts/core/Function'

import type { Decoder } from './decoder.js'

export function map<A, B>(f: (a: A) => B) {
  return <I>(decoder: Decoder<I, A>): Decoder<I, B> =>
    (i, options) =>
      pipe(decoder(i, options), Either.map(f))
}
