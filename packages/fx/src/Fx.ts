import { methodWithTrace } from '@effect/data/Debug'
import { identity } from '@effect/data/Function'
import type { Cause } from '@effect/io/Cause'
import type { Effect } from '@effect/io/Effect'
import type { Scope } from '@effect/io/Scope'

export interface Fx<R, E, A> extends Fx.Variance<R, E, A> {
  /**
   * @macro traced
   */
  readonly run: <R2>(sink: Fx.Sink<R2, E, A>) => Effect<R | R2 | Scope, never, unknown>
}

export function Fx<R, E, A>(
  run: <R2>(sink: Fx.Sink<R2, E, A>) => Effect<R | R2 | Scope, never, unknown>,
): Fx<R, E, A> {
  return new (class extends Fx.Variance<R, E, A> {
    readonly run = run
  })()
}

export namespace Fx {
  export const TypeId = Symbol.for('@typed/fx/Fx')
  export type TypeId = typeof TypeId

  export abstract class Variance<R, E, A> {
    readonly [TypeId]: {
      readonly _R: (_: never) => R
      readonly _E: (_: never) => E
      readonly _A: (_: never) => A
    } = {
      _R: identity,
      _E: identity,
      _A: identity,
    }
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */

  export type ResourcesOf<T> = [T] extends [Variance<infer R, infer _E, infer _A>] ? R : never

  export type ErrorsOf<T> = [T] extends [Variance<infer _R, infer E, infer _A>] ? E : never

  export type OutputOf<T> = [T] extends [Variance<infer _R, infer _E, infer A>] ? A : never

  /* eslint-enable @typescript-eslint/no-unused-vars */

  export interface Sink<out R, in E, in A> {
    readonly event: (value: A) => Effect<R, never, unknown>
    readonly error: (error: Cause<E>) => Effect<R, never, unknown>
    readonly end: Effect<R, never, unknown>
  }

  export function Sink<A, R, E, R2, R3>(
    event: (value: A) => Effect<R, never, unknown>,
    error: (error: Cause<E>) => Effect<R2, never, unknown>,
    end: Effect<R3, never, unknown>,
  ): Sink<R | R2 | R3, E, A> {
    return {
      event: methodWithTrace((trace) => (a: A) => event(a).traced(trace)),
      error: methodWithTrace((trace) => (cause: Cause<E>) => error(cause).traced(trace)),
      end,
    }
  }

  export interface Success<A> extends Fx<never, never, A> {}
  export interface IO<E, A> extends Fx<never, E, A> {}
}

export const TypeId = Fx.TypeId
export type TypeId = Fx.TypeId

export type ResourcesOf<T> = Fx.ResourcesOf<T>
export type ErrorOf<T> = Fx.ErrorsOf<T>
export type OutputOf<T> = Fx.OutputOf<T>

export type Success<A> = Fx.Success<A>
export type IO<E, A> = Fx.IO<E, A>

export type Sink<R, E, A> = Fx.Sink<R, E, A>
export const Sink = Fx.Sink

export function isFx<R, E, A>(v: unknown): v is Fx<R, E, A> {
  return typeof v === 'object' && v != null && TypeId in v
}
