import type { Effect, Types } from "effect"

export const ComputedTypeId = Symbol.for("@typed/signal/Computed")
export type ComputedTypeId = typeof ComputedTypeId

export interface Computed<A, E, R> extends Effect.Effect<A, E, R> {
  readonly [ComputedTypeId]: Computed.Variance<A, E, R>
  readonly version: Effect.Effect<number, never, R>
}

export namespace Computed {
  export type Any = Computed<any, any, any>

  export interface Variance<A, E, R> {
    readonly _A: Types.Covariant<A>
    readonly _E: Types.Covariant<E>
    readonly _R: Types.Covariant<R>
  }
}
