import { And, IsNever } from '@typed/fp/common/exports'
import { Resume, sync } from '@typed/fp/Resume/exports'
import { flow } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { U } from 'ts-toolbelt'

import { fromEnv } from './fromEnv'

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
 * An Effect which has no particular requirement on the environment
 */
export type Pure<A> = Effect<unknown, A>
export const Pure = Effect

/**
 * The underlying generator that allows modeling lightweight coroutines
 */
export type EffectGenerator<E, A> = Generator<Env<E, any>, A>

/**
 * A monadic environment type which can be yielded within an Effect
 */
export type Env<E, A> = Reader<E, Resume<A>>

/**
 * Helper for retrieving the effect with widened environment type
 */
export type EffectOf<A> = A extends Effect<infer E, infer B>
  ? Effect<E, B>
  : ReturnTypeOf<A> extends Effect<infer E, infer B>
  ? Effect<E, B>
  : A extends Generator<infer E, infer B>
  ? Effect<And<U.ListOf<E>>, B>
  : ReturnTypeOf<A> extends Generator<infer E, infer B>
  ? Effect<And<U.ListOf<E>>, B>
  : never

type ReturnTypeOf<A> = A extends (...args: any) => any ? ReturnType<A> : never

/**
 * Helper for retrieving the environmental dependencies from an effect
 */
export type EnvOf<A> = EffectOf<A> extends Effect<infer R, any> ? CastToEmptyObject<R> : never

/**
 * Helper for getting the return type from a given effect type
 */
export type ReturnOf<A> = EffectOf<A> extends Effect<any, infer R> ? R : never

/**
 * Helper for widening the effect type of a given effect
 */
export type AddEnv<E, Fx> = Effect<CastToEmptyObject<E> & EnvOf<Fx>, ReturnOf<Fx>>

type CastToEmptyObject<A> = IsNever<A> extends true ? {} : [A] extends [{}] ? A : {}
