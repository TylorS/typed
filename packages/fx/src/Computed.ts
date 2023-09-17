/**
 * A Computed is a Subject that has a current value that can be read and observed
 * @since 1.18.0
 */

import type * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import { Filtered } from "@typed/fx/Filtered"
import type { FxEffect } from "@typed/fx/FxEffect"
import { switchMap } from "@typed/fx/internal/core"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"
import { FxEffectTransform } from "@typed/fx/internal/ref-transform"

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
export interface Computed<out R, out E, out A> extends FxEffect<R, E, A, R, E, A> {
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
}

/**
 * Create a Computed from a data type which is an Fx and an Effect.
 * @since 1.18.0
 */
export function Computed<R, E, A, R2, E2, B>(
  input: FxEffect<R, E, A, R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Computed<R | R2, E | E2, B> {
  return new ComputedImpl(input, f) as any
}

class ComputedImpl<R, E, A, R2, E2, B> extends FxEffectTransform<R, E, A, R, E, A, R | R2, E | E2, B, R | R2, E | E2, B>
  implements Omit<Computed<R | R2, E | E2, B>, ModuleAgumentedEffectKeysToOmit>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId

  constructor(
    readonly input: FxEffect<R, E, A, R, E, A>,
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

  filterMapEffect: Computed<R | R2, E | E2, B>["filterMapEffect"] = (f) =>
    Filtered(this as any as Computed<R | R2, E | E2, B>, f)

  filterMap: Computed<R | R2, E | E2, B>["filterMap"] = (f) => this.filterMapEffect((a) => Effect.sync(() => f(a)))
}
