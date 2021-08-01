/**
 * **This module is experimental**
 *
 * Experimental features are published in order to get early feedback from the community, see these tracking
 * [issues](https://github.com/gcanti/io-ts/issues?q=label%3Av2.2+) for further discussions and enhancements.
 *
 * A feature tagged as _Experimental_ is in a high state of flux, you're at risk of it changing without notice.
 *
 * @since 0.9.4
 */
import { HKT, Kind, Kind2, URIS, URIS2 } from 'fp-ts/HKT'

import * as D from './Decoder'
import * as Eq from './Eq'
import * as G from './Guard'
import {
  memoize,
  Schemable,
  Schemable1,
  Schemable2C,
  WithRefine,
  WithRefine1,
  WithRefine2C,
  WithUnion,
  WithUnion1,
  WithUnion2C,
} from './Schemable'

// -------------------------------------------------------------------------------------
// Model
// -------------------------------------------------------------------------------------

/**
 * @category Model
 * @since 0.9.4
 */
export interface Schema<A> {
  <S>(S: Schemable<S>): HKT<S, A>
}

/**
 * @category Model
 * @since 0.9.5
 */
export interface WithRefineSchema<A> {
  <S>(S: Schemable<S> & WithRefine<S>): HKT<S, A>
}

/**
 * @category Model
 * @since 0.9.5
 */
export interface WithUnionSchema<A> {
  <S>(S: Schemable<S> & WithUnion<S>): HKT<S, A>
}

/**
 * @category Model
 * @since 0.9.5
 */
export interface WithUnionRefineSchema<A> {
  <S>(S: Schemable<S> & WithUnion<S> & WithRefine<S>): HKT<S, A>
}

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

/**
 * @category Constructor
 * @since 0.9.4
 */
export function make<A>(schema: Schema<A>): Schema<A> {
  return memoize(schema)
}

/**
 * @category Constructor
 * @since 0.9.5
 */
export function withRefine<A>(schema: WithRefineSchema<A>): WithRefineSchema<A> {
  return memoize(schema)
}

/**
 * @category Constructor
 * @since 0.9.5
 */
export function withUnion<A>(schema: WithUnionSchema<A>): WithUnionSchema<A> {
  return memoize(schema)
}

/**
 * @category Constructor
 * @since 0.9.5
 */
export function create<A>(schema: WithUnionRefineSchema<A>): WithUnionRefineSchema<A> {
  return memoize(schema)
}

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

/**
 * @since 0.9.4
 * @category Type-level
 */
export type TypeOf<S> = S extends Schema<infer A> ? A : never

/**
 * @since 0.9.5
 * @category Combinator
 */
export interface Interpret {
  <S extends URIS2, E>(S: Schemable2C<S, E> & WithRefine2C<S, E> & WithUnion2C<S, E>): <A>(
    schema: WithUnionRefineSchema<A> | WithUnionSchema<A> | WithRefineSchema<A> | Schema<A>,
  ) => Kind2<S, E, A>
  <S extends URIS2, E>(S: Schemable2C<S, E> & WithRefine2C<S, E>): <A>(
    schema: WithRefineSchema<A> | Schema<A>,
  ) => Kind2<S, E, A>
  <S extends URIS2, E>(S: Schemable2C<S, E> & WithUnion2C<S, E>): <A>(
    schema: WithUnionSchema<A> | Schema<A>,
  ) => Kind2<S, E, A>
  <S extends URIS2, E>(S: Schemable2C<S, E>): <A>(schema: Schema<A>) => Kind2<S, E, A>
  <S extends URIS>(S: Schemable1<S> & WithRefine1<S> & WithUnion1<S>): <A>(
    schema: WithUnionRefineSchema<A> | WithRefineSchema<A> | WithUnionSchema<A> | Schema<A>,
  ) => Kind<S, A>
  <S extends URIS>(S: Schemable1<S> & WithRefine1<S>): <A>(
    schema: WithRefineSchema<A> | Schema<A>,
  ) => Kind<S, A>
  <S extends URIS>(S: Schemable1<S> & WithUnion1<S>): <A>(
    schema: WithUnionSchema<A> | Schema<A>,
  ) => Kind<S, A>
  <S extends URIS>(S: Schemable1<S>): <A>(schema: Schema<A>) => Kind<S, A>
}

/**
 * @since 0.9.4
 * @category Combinator
 */
export const interpret = (<S>(schemable: Schemable<S>) =>
  <A>(schema: Schema<A>): HKT<S, A> =>
    schema(schemable)) as Interpret

/**
 * @since 0.9.5
 * @category Combinator
 */
export const toDecoder = interpret({ ...D.Schemable, ...D.WithUnion, ...D.WithRefine })

/**
 * @since 0.9.5
 * @category Combinator
 */
export const toEq = interpret(Eq.Schemable)

/**
 * @since 0.9.5
 * @category Combinator
 */
export const toGuard = interpret({ ...G.Schemable, ...G.WithUnion, ...G.WithRefine })
