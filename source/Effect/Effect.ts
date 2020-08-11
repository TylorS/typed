import { Disposable } from '@most/types'
import { Arity1, EmptyObject } from '@typed/fp/common'
import { fromEnv } from './fromEnv'

/**
 * An Iterable used to model lazily-executed effects which model lightweight coroutines
 */
export interface Effect<E, A> {
  readonly [Symbol.iterator]: () => EffectGenerator<E, A>
}

export namespace Effect {
  export const of = Pure.of
}
/**
 * An Effect which has no particular requirement on the environment
 */
export interface Pure<A> extends Effect<EmptyObject, A> {}

export namespace Pure {
  export const of = <A>(value: A): Pure<A> => fromEnv((_) => sync(value))
}

/**
 * The underlying generator that allows modeling lightweight coroutines
 */
export interface EffectGenerator<E, A> extends Generator<Env<E, any>, A, unknown> {}

export interface Env<E, A> {
  (env: E): Resume<A>
}

export type Resume<A> = Sync<A> | Async<A>

export type Sync<A> = {
  async: false
  value: A
}

export type Async<A> = {
  async: true
  run: (resume: Arity1<A, Disposable>) => Disposable
}

export const sync = <A>(value: A): Sync<A> => ({ async: false, value })

export const async = <A>(run: (resume: Arity1<A, Disposable>) => Disposable): Async<A> => ({
  async: true,
  run,
})

/**
 * Helper for retrieving the effect with widened environment type
 */
export type EffectOf<A> = A extends Effect<infer E, infer B>
  ? Effect<E, B>
  : A extends (...args: any) => any
  ? ReturnType<A> extends Effect<infer E, infer B>
    ? Effect<E, B>
    : A extends EffectGenerator<infer E, infer B>
    ? Effect<E, B>
    : never
  : never

/**
 * Helper for retrieving the environmental dependencies from an effect
 */
export type EnvOf<A> = EffectOf<A> extends Effect<infer R, any> ? R : never

/**
 * Helper for getting the return type from a given effect type
 */
export type ReturnOf<A> = EffectOf<A> extends Effect<any, infer R> ? R : never

/**
 * Helper for widening the effect type of a given effect
 */
export type AddEnv<E, Fx> = Effect<E & EnvOf<Fx>, ReturnOf<Fx>>
