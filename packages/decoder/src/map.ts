import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import type { ParseOptions } from '@effect/schema/AST'

import type { Decoder } from './decoder.js'

export function map<A, B>(f: (a: A) => B) {
  return <I>(decoder: Decoder<I, A>): Decoder<I, B> =>
    (i: I, options?: ParseOptions) =>
      pipe(decoder(i, options), Effect.map(f))
}
