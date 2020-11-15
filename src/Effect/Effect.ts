import { And, Equals, IsNever } from '@typed/fp/common/exports'
import { Resume, sync } from '@typed/fp/Resume/exports'
import { flow } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'

/**
 * An Iterable used to represent Effects which work like lightweight coroutines
 */
export interface Effect<E, A> {
  readonly [Symbol.iterator]: () => EffectGenerator<E, A>
}

export namespace Effect {
  export const of = <A>(value: A): Pure<A> => fromEnv(() => sync(value))
  export const fromIO = <A>(io: IO<A>): Pure<A> => fromEnv(flow(io, sync))
}

/**
 * An Effect which has no particular requirement on the environment. It has
 * been chosen to represent the "empty environment" using `unknown` because
 * A & unknown == A. However, it is often possible to get into an edge case
 * where you can pass an Effect<E, A> to a function expecting a Pure<A>
 * and not get a type-error.
 */
export type Pure<A> = Effect<unknown, A>
export const Pure = Effect

/**
 * The underlying generator that allows modeling lightweight coroutines
 */
export type EffectGenerator<E, A> = Generator<Env<E, any>, A, unknown>

/**
 * A monadic environment type which can be yielded within an Effect
 */
export type Env<E, A> = Reader<E, Resume<A>>

export function fromEnv<E, A>(env: Env<E, A>): Effect<E, A> {
  return {
    *[Symbol.iterator]() {
      const a = yield env

      return a as A
    },
  }
}

/**
 * Helper for retrieving the effect with widened environment type
 */
export type EffectOf<A> = A extends EffectGenerator<infer E, infer B>
  ? Effect<E, B>
  : A extends Effect<infer E, infer B>
  ? Effect<E, B>
  : IsNever<ReturnTypeOf<A>> extends true
  ? never
  : ReturnTypeOf<A> extends EffectGenerator<infer E, infer B>
  ? Effect<E, B>
  : ReturnTypeOf<A> extends Effect<infer E, infer B>
  ? Effect<E, B>
  : never

/**
 * Helper for creating an intersection of environments
 */
export type Envs<A extends ReadonlyArray<unknown>> = And<
  {
    [K in keyof A]: IsNever<A[K]> extends true
      ? unknown
      : IsEffect<EffectOf<A[K]>> extends true
      ? EnvOf<A[K]>
      : A[K]
  }
>

type IsEffect<A> = Equals<A, Effect<any, any>>
type ReturnTypeOf<A> = [A] extends [(...args: any) => any] ? ReturnType<A> : never

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
