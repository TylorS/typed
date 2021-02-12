import { A } from 'ts-toolbelt'

/**
 * Fx is a generator-based abstraction for do-notation for any single-shot
 * effect. Due to the mutable nature of generators however, we cannot support this syntax
 * for multi-shot effects like reactive Streams/Observables. Most of the effects you
 * likely use are single-shot like Option/Either/Task.
 *
 * An Fx is a set of Effects which are being `yield`ed from the Generator.
 * This can be a powerful way to construct algorithms separate from their interpretation.
 *
 * Fx's Result parameter is the secret to getting type-safety by using yield* when running an Fx.
 */
export interface Fx<Effects, Result, Next = unknown> {
  readonly [Symbol.iterator]: () => Generator<Effects, Result, Next>
}

/**
 * Extract the effects being performed within an Fx
 */
export type GetEffects<A> = A extends Fx<infer R, any, any>
  ? IsNever<R> extends false
    ? R
    : unknown
  : unknown

type IsNever<A> = A.Equals<[never], [A]> extends 1 ? true : false

/**
 * Extract the result being performed within an Fx
 */
export type GetResult<A> = A extends Fx<any, infer R, any> ? R : never

/**
 * Extract the values being returned to the internal Fx
 */
export type GetNext<A> = A extends Fx<any, any, infer R> ? R : never
