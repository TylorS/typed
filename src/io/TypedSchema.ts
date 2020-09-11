import { Fn } from '@typed/fp/lambda/exports'
import { HKT, Kind, Kind2 } from 'fp-ts/es6/HKT'
import { memoize } from 'io-ts/es6/Schemable'

import { TypedSchemable } from './TypedSchemable'

export interface TypedSchema<A> {
  <S>(schemable: TypedSchemable<S>): HKT<S, A>
}

// Similar to io-ts TypeOf from io-ts/es6/Schema but works for all possible schemas and schemables
export type TypeOf<A extends Fn> = ReturnType<A> extends HKT<any, infer R>
  ? R
  : ReturnType<A> extends Kind<any, infer R>
  ? R
  : ReturnType<A> extends Kind2<any, any, infer R>
  ? R
  : never

export const createSchema = <A>(schema: TypedSchema<A>): TypedSchema<A> => memoize(schema)
