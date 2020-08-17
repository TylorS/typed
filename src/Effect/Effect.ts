import { Arity1, IsNever } from '@typed/fp/common'
import { Disposable, disposeNone } from '@typed/fp/Disposable'
import { fromEnv } from '@typed/fp/Effect/fromEnv'
import { flow } from 'fp-ts/es6/function'
import { IO } from 'fp-ts/es6/IO'
import { Reader } from 'fp-ts/es6/Reader'

/**
 * An Iterable used to represent Effects which work like lightweight coroutines
 * @since 0.0.1
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
 * @since 0.0.1
 */
export type Pure<A> = Effect<{}, A>
export const Pure = Effect

/**
 * The underlying generator that allows modeling lightweight coroutines
 * @since 0.0.1
 */
export type EffectGenerator<E, A> = Generator<Env<E, any>, A, any>

/**
 * A monadic environment type which can be yielded within an Effect
 * @since 0.0.1
 */
export type Env<E, A> = Reader<E, Resume<A>>

/**
 * When interpreting how to run an effect, Resume is used to return control-flow back
 * to the generator. Can by synchronous or asynchronous.
 * @since 0.0.1
 */
export type Resume<A> = Sync<A> | Async<A>

/**
 * @since 0.0.1
 */
export interface Sync<A> {
  readonly async: false
  readonly value: A
}

/**
 * @since 0.0.1
 */
export interface Async<A> {
  readonly async: true
  readonly run: (resume: Arity1<A, Disposable>) => Disposable
}

/**
 * Resume an effect synchronously
 * @since 0.0.1
 */
export const sync = <A>(value: A): Sync<A> => ({ async: false, value })

/**
 * Resume an effect asynchronously, can only be resumed one time.
 * @since 0.0.1
 */
export const async = <A>(run: (resume: Arity1<A, Disposable>) => Disposable): Async<A> => {
  return {
    async: true,
    run: resumeOnce(run),
  }
}

function resumeOnce<A>(run: (resume: Arity1<A, Disposable>) => Disposable) {
  return (resume: Arity1<A, Disposable>) => {
    let hasResumed = false

    return run((a) => {
      if (hasResumed) {
        return disposeNone()
      }

      hasResumed = true

      return resume(a)
    })
  }
}

/**
 * Helper for retrieving the effect with widened environment type
 * @since 0.0.1
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
 * @since 0.0.1
 */
export type EnvOf<A> = EffectOf<A> extends Effect<infer R, any> ? CastToEmptyObject<R> : never

/**
 * Helper for getting the return type from a given effect type
 * @since 0.0.1
 */
export type ReturnOf<A> = EffectOf<A> extends Effect<any, infer R> ? R : never

/**
 * Helper for widening the effect type of a given effect
 * @since 0.0.1
 */
export type AddEnv<E, Fx> = Effect<CastToEmptyObject<E> & EnvOf<Fx>, ReturnOf<Fx>>

type CastToEmptyObject<A> = IsNever<A> extends true ? {} : [A] extends [{}] ? A : {}
