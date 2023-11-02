/**
 * A Filtered is a Subject that has a current value that can be read and observed
 * but getting the value might not succeed
 * @since 1.18.0
 */

// eslint-disable-next-line import/no-cycle
import { Computed } from "@typed/fx/Computed"
import type * as Fx from "@typed/fx/Fx"
import * as core from "@typed/fx/internal/core"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"
import { VersionedTransform } from "@typed/fx/internal/versioned-transform"
import { FilteredTypeId } from "@typed/fx/TypeId"
import * as Versioned from "@typed/fx/Versioned"
import type * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"

/**
 * A Filtered is a Subject that has a current value that can be read and observed
 * but getting the value might not succeed
 * @since 1.18.0
 * @category models
 */
export interface Filtered<out R, out E, out A>
  extends Versioned.Versioned<R, R, E, A, R, E | Cause.NoSuchElementException, A>
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
   * Convert a Filtered back into a Computed of an Option
   */
  readonly option: Computed<R, E, Option.Option<A>>

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
  input: Versioned.Versioned<R, R, E, A, R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
): Filtered<R | R2, E | E2, B> {
  return new FilteredImpl(input, f) as any
}

class FilteredImpl<R, E, A, R2, E2, B>
  extends VersionedTransform<R, R, E, A, R, E, A, R | R2, E | E2, B, R | R2, E | E2 | Cause.NoSuchElementException, B>
  implements Omit<Filtered<R | R2, E | E2, B>, ModuleAgumentedEffectKeysToOmit>
{
  readonly [FilteredTypeId]: FilteredTypeId = FilteredTypeId

  constructor(
    readonly input: Versioned.Versioned<R, R, E, A, R, E, A>,
    readonly f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
  ) {
    super(
      input,
      (fx) => core.skipRepeats(core.compact(core.mapEffect(fx, f))),
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

  option: Filtered<R | R2, E | E2, B>["option"] = Computed(
    this.input,
    this.f
  )
}

export function combine<const Computeds extends ReadonlyArray<Filtered<any, any, any> | Computed<any, any, any>>>(
  computeds: Computeds
): Filtered<
  Fx.Fx.Context<Computeds[number]>,
  Fx.Fx.Error<Computeds[number]>,
  { readonly [K in keyof Computeds]: Fx.Fx.Success<Computeds[number]> }
> {
  return Filtered(
    Versioned.combine(computeds) as Versioned.Versioned<
      Fx.Fx.Context<Computeds[number]>,
      Fx.Fx.Context<Computeds[number]>,
      Fx.Fx.Error<Computeds[number]>,
      { readonly [K in keyof Computeds]: Fx.Fx.Success<Computeds[number]> },
      Fx.Fx.Context<Computeds[number]>,
      Fx.Fx.Error<Computeds[number]>,
      { readonly [K in keyof Computeds]: Fx.Fx.Success<Computeds[number]> }
    >,
    Effect.succeedSome
  )
}

export function struct<
  const Computeds extends Readonly<Record<string, Filtered<any, any, any | Computed<any, any, any>>>>
>(
  computeds: Computeds
): Filtered<
  Fx.Fx.Context<Computeds[string]>,
  Fx.Fx.Error<Computeds[string]>,
  { readonly [K in keyof Computeds]: Fx.Fx.Success<Computeds[string]> }
> {
  return Filtered(
    Versioned.struct(computeds) as Versioned.Versioned<
      Fx.Fx.Context<Computeds[string]>,
      Fx.Fx.Context<Computeds[string]>,
      Fx.Fx.Error<Computeds[string]>,
      { readonly [K in keyof Computeds]: Fx.Fx.Success<Computeds[string]> },
      Fx.Fx.Context<Computeds[string]>,
      Fx.Fx.Error<Computeds[string]>,
      { readonly [K in keyof Computeds]: Fx.Fx.Success<Computeds[string]> }
    >,
    Effect.succeedSome
  )
}
