import { Equals } from 'ts-toolbelt/out/Any/Equals'

/**
 * A iterable using generators as do-notation for effects.
 */
export interface Fx<Effects, Result, Next = unknown> {
  readonly [Symbol.iterator]: () => Generator<Effects, Result, Next>
}

/**
 * Extract the effects being performed within an Fx
 */
export type GetEffects<A> = A extends Fx<infer R, any, any>
  ? IsNever<R> extends true
    ? unknown
    : R
  : never

type IsNever<A> = Equals<[never], [A]> extends 1 ? true : false

/**
 * Extract the result being performed within an Fx
 */
export type GetResult<A> = A extends Fx<any, infer R, any> ? R : never

/**
 * Extract the values being returned to the internal Fx
 */
export type GetNext<A> = A extends Fx<any, any, infer R> ? R : never
