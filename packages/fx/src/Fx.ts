import { Cause } from '@effect/io/Cause'
import { Effect } from '@effect/io/Effect'
import { Scope } from '@effect/io/Scope'
import { identity } from '@fp-ts/data/Function'

export interface Fx<R, E, A> extends Fx.Variance<R, E, A> {
  readonly run: <R2>(sink: Fx.Sink<R2, E, A>) => Effect<R | R2 | Scope, never, unknown>
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

  export type ErrorOf<T> = [T] extends [Variance<infer _R, infer E, infer _A>] ? E : never

  export type OutputOf<T> = [T] extends [Variance<infer _R, infer _E, infer A>] ? A : never

  /* eslint-enable @typescript-eslint/no-unused-vars */

  export interface Sink<R, E, A> {
    readonly event: (value: A) => Effect<R, never, unknown>
    readonly error: (error: Cause<E>) => Effect<R, never, unknown>
    readonly end: Effect<R, never, unknown>
  }

  export function Sink<R, E, A>(
    event: (value: A) => Effect<R, never, unknown>,
    error: (error: Cause<E>) => Effect<R, never, unknown>,
    end: Effect<R, never, unknown>,
  ): Sink<R, E, A> {
    return { event, error, end }
  }
}

export const TypeId = Fx.TypeId
export type TypeId = Fx.TypeId

export type ResourcesOf<T> = Fx.ResourcesOf<T>
export type ErrorOf<T> = Fx.ErrorOf<T>
export type OutputOf<T> = Fx.OutputOf<T>

export type Sink<R, E, A> = Fx.Sink<R, E, A>
export const Sink = Fx.Sink