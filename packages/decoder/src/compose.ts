import type { ParseOptions } from "@effect/schema/AST"
import * as ParseResult from "@effect/schema/ParseResult"

import { Decoder } from "./Decoder"

export const compose = <I2, O>(to: Decoder<I2, O>) => <I>(from: Decoder<I, I2>): Decoder<I, O> =>
  Decoder((i: I, options?: ParseOptions): ParseResult.ParseResult<O> => ParseResult.flatMap(from(i, options), to))
