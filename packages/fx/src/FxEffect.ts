import type { Effect } from "@effect/io/Effect"
import type { Fx } from "@typed/fx/Fx"
import type { TypeId } from "@typed/fx/TypeId"

/**
 * A data type which is both an Fx and an Effect. This is a more advanced types, and is the basis
 * for creating Computed + Filtered types from a RefSubject which is the base implementation of
 * an Fx + Effect.
 * @since 1.18.0
 */
export interface FxEffect<R, E, A, R2, E2, B> extends Fx<R, E, A>, Omit<Effect<R2, E2, B>, TypeId> {
  /**
   * The current version of this FxEffect. This is used to determine if the current value
   * is up to date to allow localized caching of value.
   */
  readonly version: () => number
}
