import { Equals } from 'ts-toolbelt/out/Any/Equals'

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
