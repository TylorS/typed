import { Kind, Kind2, URIS, URIS2 } from 'fp-ts/HKT'
import { Schema } from 'io-ts/Schema'
import { Schemable1, Schemable2C } from 'io-ts/Schemable'

import { TypedSchema } from './TypedSchema'
import { TypedSchemable1, TypedSchemable2C } from './TypedSchemable'

// Extendable inteface to allow additional schemas
export interface SchemableInterpreter {
  <S extends URIS2, E>(schemable: TypedSchemable2C<S, E>): <A>(
    schema: TypedSchema<A>,
  ) => Kind2<S, E, A>
  <S extends URIS>(schemable: TypedSchemable1<S>): <A>(schema: TypedSchema<A>) => Kind<S, A>

  <S extends URIS2, E>(schemable: Schemable2C<S, E>): <A>(schema: Schema<A>) => Kind2<S, E, A>
  <S extends URIS>(schemable: Schemable1<S>): <A>(schema: Schema<A>) => Kind<S, A>
}

export const createInterpreter: SchemableInterpreter = (s: any) => (schema: any) => schema(s)

export type Schemable2CE<S> = S extends Schemable2C<any, infer R> ? R : never
