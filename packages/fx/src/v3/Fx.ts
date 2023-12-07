import type { Effect, Scope, Unify } from "effect"
import type * as Types from "effect/Types"
import type { TypeId } from "../TypeId"
import type { Sink } from "./Sink"

export interface Fx<out R, out E, out A> {
  readonly [TypeId]: Fx.Variance<R, E, A>

  run<R2 = never>(sink: Sink<R2, E, A>, scope: Scope.Scope): Effect.Effect<R | R2, never, unknown>

  readonly [Unify.typeSymbol]: unknown
  readonly [Unify.unifySymbol]: Fx.Unify<this>
  readonly [Unify.ignoreSymbol]: Fx.IgnoreList
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

  /**
   * @category models
   * @since 1.0.0
   */
  export interface Unify<A extends { [Unify.typeSymbol]?: any }> extends Effect.EffectUnify<A> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Fx: () => A[Unify.typeSymbol] extends Fx<infer R0, infer E0, infer A0> | infer _ ? Fx<R0, E0, A0> : never
  }

  /**
   * @category models
   * @since 1.0.0
   */
  export interface IgnoreList extends Effect.EffectUnifyIgnore {
    Effect: true
  }
}

export type Context<T> = Fx.Context<T>

export type Error<T> = Fx.Error<T>

export type Success<T> = Fx.Success<T>
