import type { Fn } from '@fp/lambda/exports'
import type { HKT, Kind, Kind2 } from 'fp-ts/HKT'
import { memoize, WithRefine } from 'io-ts/Schemable'

import { TypedSchemable, WithNever, WithUnknown } from './TypedSchemable'

/**
 * A io-ts Schema type using TypedSchemable to include additional types.
 */
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
  : never

/**
 * Create a TypedSchema
 */
export const createSchema = <A>(schema: TypedSchema<A>): TypedSchema<A> => memoize(schema)

/**
 * A io-ts Schema type using TypedSchemable plus concepts only available with runtime types.
 */
export interface RuntimeSchema<A> {
  <S>(schemable: TypedSchemable<S> & WithRefine<S> & WithNever<S> & WithUnknown<S>): HKT<S, A>
}

/**
 * Create a TypedSchema
 */
export const createRuntimeSchema = <A>(schema: RuntimeSchema<A>): RuntimeSchema<A> =>
  memoize(schema)
