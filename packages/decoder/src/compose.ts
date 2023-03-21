import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import type { ParseOptions } from '@effect/schema/AST'
import type * as ParseResult from '@effect/schema/ParseResult'

import type { Decoder } from './decoder.js'

export const compose =
  <I2, O>(to: Decoder<I2, O>) =>
  <I>(from: Decoder<I, I2>): Decoder<I, O> =>
  (i: I, options?: ParseOptions): ParseResult.ParseResult<O> =>
    pipe(from(i, options), Effect.flatMap(to))
