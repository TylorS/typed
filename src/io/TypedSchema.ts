import type { Fn } from '@typed/fp/lambda/exports'
import type { HKT, Kind, Kind2, Kind3, Kind4 } from 'fp-ts/HKT'
import { memoize } from 'io-ts/Schemable'

import { TypedSchemable } from './TypedSchemable'

export interface TypedSchema<A> {
  <S>(schemable: TypedSchemable<S>): HKT<S, A>
}

// Similar to io-ts TypeOf from io-ts/Schema but works for all possible schemas and schemables
export type TypeOf<A extends Fn> = ReturnType<A> extends HKT<any, infer R>
  ? R
  : ReturnType<A> extends Kind<any, infer R>
  ? R
  : ReturnType<A> extends Kind2<any, any, infer R>
  ? R
  : ReturnType<A> extends Kind3<any, any, any, infer R>
  ? R
  : // @ts-expect-error // Kind4 does not currently have any URIs and wants me to put 'never', but no.
  ReturnType<A> extends Kind4<any, any, any, any, infer R>
  ? R
  : never

export const createSchema = <A>(schema: TypedSchema<A>): TypedSchema<A> => memoize(schema)
