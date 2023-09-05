import type { ParseOptions } from "@effect/schema/AST"
import * as ParseResult from "@effect/schema/ParseResult"

import { Decoder } from "./Decoder"

export function map<A, B>(f: (a: A) => B) {
  return <I>(decoder: Decoder<I, A>): Decoder<I, B> =>
    Decoder((i: I, options?: ParseOptions) => ParseResult.map(decoder(i, options), f))
}
