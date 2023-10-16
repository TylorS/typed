/**
 * A Computed is a Subject that has a current value that can be read and observed
 * @since 1.18.0
 */

import { Filtered } from "@typed/fx/Filtered"
import { switchMap } from "@typed/fx/internal/core"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"
import { VersionedTransform } from "@typed/fx/internal/versioned-transform"
import type { Versioned } from "@typed/fx/Versioned"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"

/**
 * @since 1.18.0
 * @category symbols
 */
export const ComputedTypeId = Symbol.for("@typed/fx/Computed")

/**
 * @since 1.18.0
 * @category symbols
 */
export type ComputedTypeId = typeof ComputedTypeId

/**
 * A Computed is a Subject that has a current value that can be read and observed
 * @since 1.18.0
 * @category models
 */
export interface Computed<out R, out E, out A> extends Versioned<R, R, E, A, R, E, A> {
  readonly [ComputedTypeId]: ComputedTypeId

  /**
   * Map the current value of this Computed to a new value using an Effect
   * @since 1.18.0
   */
  readonly mapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) => Computed<R | R2, E | E2, B>

  /**
   * Map the current value of this Computed to a new value
   * @since 1.18.0
   */
  readonly map: <B>(f: (a: A) => B) => Computed<R, E, B>

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
}

/**
 * Create a Computed from a data type which is an Fx and an Effect.
 * @since 1.18.0
 */
export function Computed<R, E, A, R2, E2, B>(
  input: Versioned<R, R, E, A, R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Computed<R | R2, E | E2, B> {
  return new ComputedImpl(input, f) as any
}

class ComputedImpl<R, E, A, R2, E2, B>
  extends VersionedTransform<R, R, E, A, R, E, A, R | R2, E | E2, B, R | R2, E | E2, B>
  implements Omit<Computed<R | R2, E | E2, B>, ModuleAgumentedEffectKeysToOmit>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId

  constructor(
    readonly input: Versioned<R, R, E, A, R, E, A>,
    readonly f: (a: A) => Effect.Effect<R2, E2, B>
  ) {
    super(
      input,
      switchMap(f),
      Effect.flatMap(f)
    )
  }

  mapEffect: Computed<R | R2, E | E2, B>["mapEffect"] = (f) => Computed(this.input, (a) => Effect.flatMap(this.f(a), f))

  map: Computed<R | R2, E | E2, B>["map"] = (f) => this.mapEffect((a) => Effect.sync(() => f(a)))

  filterMapEffect: Computed<R | R2, E | E2, B>["filterMapEffect"] = (f) => Filtered(this as any, f)

  filterMap: Computed<R | R2, E | E2, B>["filterMap"] = (f) => this.filterMapEffect((a) => Effect.sync(() => f(a)))

  filterEffect: Computed<R | R2, E | E2, B>["filterEffect"] = (f) =>
    this.filterMapEffect((a) => Effect.map(f(a), (b) => (b ? Option.some(a) : Option.none())))

  filter: Computed<R | R2, E | E2, B>["filter"] = (f) => this.filterEffect((a) => Effect.sync(() => f(a)))
}
