import type { ParseOptions } from "@effect/schema/AST"
import * as PR from "@effect/schema/ParseResult"

import type { Decoder } from "@typed/decoder/decoder"

export const compose =
  <I2, O>(to: Decoder<I2, O>) =>
  <I>(from: Decoder<I, I2>): Decoder<I, O> =>
  (i: I, options?: ParseOptions): PR.ParseResult<O> => PR.flatMap(from(i, options), to)
