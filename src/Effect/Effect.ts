import { Equals } from 'ts-toolbelt/out/Any/Equals'

/**
 * Effect is a placeholder which helps us out with accurate type inference for each Type Parameter
 * utilized by Fx. R is contravariant, and E + A are both covariant.
 *
 * If you're here from the Fx definition, @see Instruction from the Fiber module for what really occurs
 * beneath the hood of Fx.
 */
export interface Effect<R, E, A> {
  readonly _R: (resources: R) => void
  readonly _E: () => E
  readonly _A: () => A
}

export interface REffect<R, A> extends Effect<R, never, A> {}
export interface EEffect<E, A> extends Effect<unknown, E, A> {}
export interface Of<A> extends Effect<unknown, never, A> {}

export type ResourcesOf<T> = [T] extends [Effect<infer R, any, any>]
  ? R
  : [T] extends [Effect<infer R, never, any>]
  ? R
  : unknown

export type ErrorOf<T> = [T] extends [Effect<any, infer E, any>] ? CoerceError<E> : never

export type CoerceError<T> = Equals<T, unknown> extends 1 ? never : T

export type OutputOf<T> = [T] extends [Effect<any, any, infer A>]
  ? A
  : [T] extends [Effect<any, never, infer A>]
  ? A
  : unknown
