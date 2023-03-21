import type { ParseOptions } from '@effect/schema/AST'
import type * as ParseResult from '@effect/schema/ParseResult'

export interface Decoder<I, O> {
  (i: I, options?: ParseOptions): ParseResult.ParseResult<O>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type InputOf<T> = [T] extends [Decoder<infer I, infer _>] ? I : never

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type OutputOf<T> = [T] extends [Decoder<infer _, infer O>] ? O : never
