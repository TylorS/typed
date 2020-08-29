import { HKT } from 'fp-ts/lib/HKT'
import { memoize } from 'io-ts/es6/Schemable'

import { TypedSchemable } from './TypedSchemable'

export interface TypedSchema<A> {
  <S>(schemable: TypedSchemable<S>): HKT<S, A>
}

export const makeTyped = <A>(schema: TypedSchema<A>): TypedSchema<A> => memoize(schema)
