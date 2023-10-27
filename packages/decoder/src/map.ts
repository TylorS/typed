import type { ParseOptions } from "@effect/schema/AST"
import * as PR from "@effect/schema/ParseResult"

import type { Decoder } from "@typed/decoder/decoder"

export function map<A, B>(f: (a: A) => B) {
  return <I>(decoder: Decoder<I, A>): Decoder<I, B> => (i: I, options?: ParseOptions) => PR.map(decoder(i, options), f)
}
