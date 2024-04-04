import type { Effect, Types } from "effect"
import type { NoSuchElementException } from "effect/Cause"

export const FilteredTypeId = Symbol.for("@typed/signal/Filtered")
export type FilteredTypeId = typeof FilteredTypeId

export interface Filtered<A, E, R> extends Effect.Effect<A, E | NoSuchElementException, R> {
  readonly [FilteredTypeId]: Filtered.Variance<A, E, R>
  readonly version: Effect.Effect<number, never, R>
}

export namespace Filtered {
  export type Any = Filtered<any, any, any>

  export interface Variance<A, E, R> {
    readonly _A: Types.Covariant<A>
    readonly _E: Types.Covariant<E>
    readonly _R: Types.Covariant<R>
  }
}
