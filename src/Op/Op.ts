import * as C from '@typed/fp/common'
import { Effect } from '@typed/fp/Effect'
import { Fn } from '@typed/fp/lambda'
import { Newtype } from 'newtype-ts'

/**
 * Used to represent the resources required to perform a particular computation
 */
export interface Op<Uri = any, F extends Fn = Fn> extends Newtype<OpUri<Uri, F>, Uri> {}

interface OpUri<Uri, F extends Fn = Fn> {
  readonly Op: unique symbol
  readonly Uri: Uri
  readonly Fn: F
}

// Type-level Helpers

export type UriOf<A> = A extends Op<infer R, any> ? R : never

export type FnOf<A> = A extends Op<any, infer R> ? R : never

export type ArgsOf<A> = C.ArgsOf<FnOf<A>>

export type ReturnOf<A> = ReturnType<FnOf<A>>

export interface OpEnv<O extends Op> extends Newtype<O, Readonly<Record<'ops', OpMap>>> {}

export interface OpMap extends Map<Op<any, any>, any> {}

/**
 * Type-level maps for using Op implementations that require type parameters
 */

// @ts-ignore - Ignore phantom type param
export interface Ops<E> {}

export type OpsUris = keyof Ops<any>

export type GetOpEffect<E, O extends Op> = C.IsNever<GetOpUri<O>> extends true
  ? (...args: ArgsOf<O>) => Effect<E, ReturnOf<O>>
  : Ops<E>[GetOpUri<O>]

export type GetOpUri<O extends Op> = UriOf<O> extends OpsUris ? UriOf<O> : never
