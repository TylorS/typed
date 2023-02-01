import type { ParseOptions } from '@fp-ts/schema/AST'
import type * as ParseResult from '@fp-ts/schema/ParseResult'
import * as P from '@fp-ts/schema/Parser'
import type * as S from '@fp-ts/schema/Schema'

export interface Decoder<I, O> {
  readonly decode: (i: I, options?: ParseOptions) => ParseResult.ParseResult<O>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type InputOf<T> = [T] extends [Decoder<infer I, infer _>] ? I : never
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type OutputOf<T> = [T] extends [Decoder<infer _, infer O>] ? O : never

export interface SchemaDecoder<A> extends S.Schema<A>, Decoder<unknown, A> {}

export function fromSchema<A>(schema: S.Schema<A>): SchemaDecoder<A> {
  return {
    ...schema,
    decode: P.decode(schema),
  }
}

/**
 * TODO:
 * tuple
 * extend
 */
