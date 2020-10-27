import { ArgsOf as ArgsOfFn } from '@typed/fp/common/exports'
import { AddEnv, Effect, ReturnOf as ReturnOfEff } from '@typed/fp/Effect/exports'
import { Fn } from '@typed/fp/lambda/exports'
import { Newtype } from 'newtype-ts'

/**
 * Used to represent the resources required to perform a particular operation.
 */
export interface Op<Uri extends PropertyKey, F extends Fn<readonly any[], Effect<any, any>>>
  extends Newtype<OpUri<Uri, F>, Uri> {}

export interface OpUri<Uri extends PropertyKey, F extends Fn = Fn> {
  readonly Uri: Uri
  readonly Fn: F
}

// Type-level Helpers

/**
 * Extract the URI of an Op
 */
export type UriOf<A> = CastPropertyKey<A extends Op<infer R, any> ? R : never>

type CastPropertyKey<A> = A extends PropertyKey ? A : PropertyKey

/**
 * Extract the Function behind an Operation
 */
export type FnOf<A> = A extends Op<any, infer R> ? R : never

/**
 * Extract the arguments for a particular Op
 */
export type ArgsOf<A> = ArgsOfFn<FnOf<A>>

/**
 * Extract the effect of a particular Op
 */
export type EffectOf<A> = ReturnType<FnOf<A>>

/**
 * Extract the return value of a particular Op
 */
export type ReturnOf<A> = ReturnOfEff<EffectOf<A>>

export const OPS = '@typed/fp/Ops'
export type OPS = typeof OPS

/**
 * Opaque environment in which to request the implementation of a particular operation.
 */
export interface OpEnv<O extends Op<PropertyKey, any>>
  extends Newtype<Record<UriOf<O>, O['_URI']>, Record<OPS, OpMap>> {}

/**
 * The shared map in which *all* implementation of operations are placed in.
 */
export interface OpMap extends Map<Op<any, any>, Fn<any, Effect<any, any>>> {}

/**
 * Type-level map for using Op implementations that require type parameters. The "Env"
 * type-parameter is used to allow alternative implementations to inject environment requirements.
 * This is necessary because mapping over the Op's second paramater loses any type-parameters.
 * Hopefully TS will gain the ability to map over the return type of a function in the future
 * @example
 *
 * declare module "@typed/fp/Op/exports" {
 *   export interface Ops<Env> {
 *      [MY_URI]: <E, A>(eff: Effect<E, A>) => Effect<Env & E, A>
 *   }
 * }
 */
// @ts-ignore
export interface Ops<Env> {}

export type OpsUris = keyof Ops<any>

/**
 * Creates the Call signature of an Operation using the Ops type-level map,
 * if it exists, or simply appends the required environments.
 */
export type CallOf<O extends Op<any, any>, Env = unknown> = UriOf<O> extends OpsUris
  ? Ops<OpEnv<O> & Env>[UriOf<O>]
  : GetOperation<OpEnv<O> & Env, O>

export type GetOperation<E, O extends Op<any, any>> = (...args: ArgsOf<O>) => AddEnv<E, EffectOf<O>>
