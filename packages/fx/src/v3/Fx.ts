import type { Effect } from "effect"
import type * as Types from "effect/Types"
import type { TypeId } from "../TypeId"
import type { Sink } from "./Sink"

export interface Fx<out R, out E, out A> {
  readonly [TypeId]: Fx.Variance<R, E, A>

  run<R2 = never>(sink: Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown>
}

export namespace Fx {
  export interface Variance<R, E, A> {
    readonly _R: Types.Covariant<R>
    readonly _E: Types.Covariant<E>
    readonly _A: Types.Covariant<A>
  }

  export type Context<T> = T extends Fx<infer R, infer _E, infer _A> ? R : never

  export type Error<T> = T extends Fx<infer _R, infer E, infer _A> ? E : never

  export type Success<T> = T extends Fx<infer _R, infer _E, infer A> ? A : never
}

export type Context<T> = Fx.Context<T>

export type Error<T> = Fx.Error<T>

export type Success<T> = Fx.Success<T>
