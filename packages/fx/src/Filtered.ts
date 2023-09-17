import type * as Option from "@effect/data/Option"
import type * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import type { FxEffect } from "@typed/fx/FxEffect"
import * as core from "@typed/fx/internal/core"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"
import { FxEffectTransform } from "@typed/fx/internal/ref-transform"

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
export interface Filtered<out R, out E, out A> extends FxEffect<R, E, A, R, E | Cause.NoSuchElementException, A> {
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
}

/**
 * Create a Filtered from a data type which is an Fx and an Effect.
 * @since 1.18.0
 */
export function Filtered<R, E, A, R2, E2, B>(
  input: FxEffect<R, E, A, R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
): Filtered<R | R2, E | E2, B> {
  return new FilteredImpl(input, f) as any
}

class FilteredImpl<R, E, A, R2, E2, B>
  extends FxEffectTransform<R, E, A, R, E, A, R | R2, E | E2, B, R | R2, E | E2 | Cause.NoSuchElementException, B>
  implements Omit<Filtered<R | R2, E | E2, B>, ModuleAgumentedEffectKeysToOmit>
{
  readonly [FilteredTypeId]: FilteredTypeId = FilteredTypeId

  constructor(
    readonly input: FxEffect<R, E, A, R, E, A>,
    readonly f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
  ) {
    super(
      input,
      (fx) => core.filterMap(core.switchMap(fx, f), (x) => x),
      (effect) => Effect.flatten(Effect.flatMap(effect, f))
    )
  }

  filterMapEffect: Filtered<R | R2, E | E2, B>["filterMapEffect"] = (f) =>
    new FilteredImpl(this as any as Filtered<R | R2, E | E2, B>, f) as any

  filterMap: Filtered<R | R2, E | E2, B>["filterMap"] = (f) => this.filterMapEffect((a) => Effect.sync(() => f(a)))
}
