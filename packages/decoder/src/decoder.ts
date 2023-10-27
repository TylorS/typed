import type { ParseOptions } from "@effect/schema/AST"
import type * as PR from "@effect/schema/ParseResult"

export interface Decoder<I, O> {
  (i: I, options?: ParseOptions): PR.ParseResult<O>
}

export type InputOf<T> = [T] extends [Decoder<infer I, infer _>] ? I : never

export type OutputOf<T> = [T] extends [Decoder<infer _, infer O>] ? O : never
