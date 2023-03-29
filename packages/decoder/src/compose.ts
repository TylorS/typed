import type { ParseOptions } from '@effect/schema/AST'
import * as ParseResult from '@effect/schema/ParseResult'

import type { Decoder } from './decoder.js'

export const compose =
  <I2, O>(to: Decoder<I2, O>) =>
  <I>(from: Decoder<I, I2>): Decoder<I, O> =>
  (i: I, options?: ParseOptions): ParseResult.ParseResult<O> =>
    ParseResult.flatMap(from(i, options), to)
