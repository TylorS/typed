/**
 * This module provides a data type which is both an Fx and an Effect. This is a more advanced types, and is the basis
 * for creating Computed + Filtered types from a RefSubject which is the canonical implementation of
 * an at type which is both Fx + Effect.
 * @since 1.18.0
 */

import type { Effect } from "@effect/io/Effect"
import type { Fx } from "@typed/fx/Fx"
import type { TypeId } from "@typed/fx/TypeId"

/**
 * A data type which is both an Fx and an Effect.
 * @since 1.18.0
 */
export interface FxEffect<R, E, A, R2, E2, B> extends Fx<R, E, A>, Omit<Effect<R2, E2, B>, TypeId> {}

/**
 * A data type which is both an Fx and an Effect. This is a more advanced types, and is the basis
 * for creating Computed + Filtered types from a RefSubject which is the canonical implementation of
 * an at type which is both Fx + Effect.
 * @since 1.18.0
 */
export interface VersionedFxEffect<R0, R, E, A, R2, E2, B> extends FxEffect<R, E, A, R2, E2, B> {
  /**
   * Get the current value
   */
  readonly get: Effect<R2, E2, B>

  /**
   * The current version of this FxEffect. This is used to determine if the current value
   * is up to date to allow localized caching of value.
   */
  readonly version: Effect<R0, never, number>
}