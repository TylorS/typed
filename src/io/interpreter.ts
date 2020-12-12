import type { Kind, Kind2, URIS, URIS2 } from 'fp-ts/HKT'
import { Schema } from 'io-ts/Schema'

import { RuntimeSchema, TypedSchema } from './TypedSchema'
import {
  RuntimeSchemable1,
  RuntimeSchemable2C,
  TypedSchemable1,
  TypedSchemable2C,
} from './TypedSchemable'

export interface SchemableInterpreter {
  <S extends URIS2, E>(schemable: RuntimeSchemable2C<S, E>): {
    <A>(schema: RuntimeSchema<A>): Kind2<S, E, A>
    <A>(schema: TypedSchema<A>): Kind2<S, E, A>
    <A>(schema: Schema<A>): Kind2<S, E, A>
  }
  <S extends URIS>(schemable: RuntimeSchemable1<S>): {
    <A>(schema: RuntimeSchema<A>): Kind<S, A>
    <A>(schema: TypedSchema<A>): Kind<S, A>
    <A>(schema: Schema<A>): Kind<S, A>
  }

  <S extends URIS2, E>(schemable: TypedSchemable2C<S, E>): {
    <A>(schema: TypedSchema<A>): Kind2<S, E, A>
    <A>(schema: Schema<A>): Kind2<S, E, A>
  }
  <S extends URIS>(schemable: TypedSchemable1<S>): {
    <A>(schema: TypedSchema<A>): Kind<S, A>
    <A>(schema: Schema<A>): Kind<S, A>
  }
}

/**
 * Create an interpreter from a Schemable instance
 */
export const createInterpreter: SchemableInterpreter = (s: any) => (schema: any) => schema(s)
