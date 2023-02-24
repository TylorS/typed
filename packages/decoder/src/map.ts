import * as Either from '@effect/data/Either'
import { pipe } from '@effect/data/Function'

import type { Decoder } from './decoder.js'

export function map<A, B>(f: (a: A) => B) {
  return <I>(decoder: Decoder<I, A>): Decoder<I, B> =>
    (i, options) =>
      pipe(decoder(i, options), Either.map(f))
}
