/**
 * A Filtered is a Subject that has a current value that can be read and observed
 * but getting the value might not succeed
 * @since 1.18.0
 */

import * as Option from "@effect/data/Option"
import type * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import type { VersionedFxEffect } from "@typed/fx/FxEffect"
import * as core from "@typed/fx/internal/core"
import { FxEffectTransform } from "@typed/fx/internal/fx-effect-transform"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"

/**
 * @since 1.18.0
 * @category symbols
 */
export const FilteredTypeId = Symbol.for("@typed/fx/Filtered")

/**
 * @since 1.18.0
 * @category symbols
 */
export type FilteredTypeId = typeof FilteredTypeId

/**
 * A Filtered is a Subject that has a current value that can be read and observed
 * but getting the value might not succeed
 * @since 1.18.0
 * @category models
 */
export interface Filtered<out R, out E, out A>
  extends VersionedFxEffect<R, R, E, A, R, E | Cause.NoSuchElementException, A>
{
  readonly [FilteredTypeId]: FilteredTypeId

  /**
   * Map the current value of this Filtered to a new value using an Effect
   * @since 1.18.0
   */
  readonly filterMapEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
  ) => Filtered<R | R2, E | E2, B>

  /**
   * Map the current value of this Filtered to a new value
   * @since 1.18.0
   */
  readonly filterMap: <B>(f: (a: A) => Option.Option<B>) => Filtered<R, E, B>

  /**
   * Filter the current value of this Filtered to a new value using an Effect
   */
  readonly filterEffect: <R2, E2>(
    f: (a: A) => Effect.Effect<R2, E2, boolean>
  ) => Filtered<R | R2, E | E2, A>

  /**
   * Filter the current value of this Filtered to a new value
   */
  readonly filter: (f: (a: A) => boolean) => Filtered<R, E, A>

  /**
   * Map the current value of this Computed to a new value using an Effect
   * @since 1.18.0
   */
  readonly mapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) => Filtered<R | R2, E | E2, B>

  /**
   * Map the current value of this Computed to a new value
   * @since 1.18.0
   */
  readonly map: <B>(f: (a: A) => B) => Filtered<R, E, B>
}

/**
 * Create a Filtered from a data type which is an Fx and an Effect.
 * @since 1.18.0
 */
export function Filtered<R, E, A, R2, E2, B>(
  input: VersionedFxEffect<R, R, E, A, R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
): Filtered<R | R2, E | E2, B> {
  return new FilteredImpl(input, f) as any
}

class FilteredImpl<R, E, A, R2, E2, B>
  extends FxEffectTransform<R, R, E, A, R, E, A, R | R2, E | E2, B, R | R2, E | E2 | Cause.NoSuchElementException, B>
  implements Omit<Filtered<R | R2, E | E2, B>, ModuleAgumentedEffectKeysToOmit>
{
  readonly [FilteredTypeId]: FilteredTypeId = FilteredTypeId

  constructor(
    readonly input: VersionedFxEffect<R, R, E, A, R, E, A>,
    readonly f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
  ) {
    super(
      input,
      (fx) => core.compact(core.switchMap(fx, f)),
      (effect) => Effect.flatten(Effect.flatMap(effect, f))
    )
  }

  filterMapEffect: Filtered<R | R2, E | E2, B>["filterMapEffect"] = (f) => new FilteredImpl(this as any, f) as any

  filterMap: Filtered<R | R2, E | E2, B>["filterMap"] = (f) => this.filterMapEffect((a) => Effect.sync(() => f(a)))

  filterEffect: Filtered<R | R2, E | E2, B>["filterEffect"] = (f) =>
    this.filterMapEffect((a) => Effect.map(f(a), (b) => (b ? Option.some(a) : Option.none())))

  filter: Filtered<R | R2, E | E2, B>["filter"] = (f) => this.filterEffect((a) => Effect.sync(() => f(a)))

  mapEffect: Filtered<R | R2, E | E2, B>["mapEffect"] = (f) => this.filterMapEffect((a) => Effect.asSome(f(a)))

  map: Filtered<R | R2, E | E2, B>["map"] = (f) => this.mapEffect((a) => Effect.sync(() => f(a)))
}
