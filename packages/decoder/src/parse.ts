import type { ParseOptions } from "@effect/schema/AST"
import * as PR from "@effect/schema/ParseResult"

import type { Decoder } from "@typed/decoder/decoder"

export function parse<A, B>(f: (a: A) => PR.ParseResult<B>) {
  return <I>(decoder: Decoder<I, A>): Decoder<I, B> => (i: I, options?: ParseOptions) =>
    PR.flatMap(decoder(i, options), f)
}
