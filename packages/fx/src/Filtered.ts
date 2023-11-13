/**
 * A Filtered is a Subject that has a current value that can be read and observed
 * but getting the value might not succeed
 * @since 1.18.0
 */

import type { Tag } from "@typed/context"
// eslint-disable-next-line import/no-cycle
import { Computed } from "@typed/fx/Computed"
import type * as Fx from "@typed/fx/Fx"
import * as core from "@typed/fx/internal/core"
import { fromFxEffect } from "@typed/fx/internal/fx"
import { OnceEffect } from "@typed/fx/internal/protos"
import { VersionedTransform } from "@typed/fx/internal/versioned-transform"
import { FilteredTypeId } from "@typed/fx/TypeId"
import * as Versioned from "@typed/fx/Versioned"
import type * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import type { Equivalence } from "effect/Equivalence"
import { dual } from "effect/Function"
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

  /**
   * Skip values that match the provided Equivalence instance
   */
  readonly skipRepeats: (eq?: Equivalence<A>) => Filtered<R, E, A>
}

/**
 * Create a Filtered from a data type which is an Fx and an Effect.
 * @since 1.18.0
 */
export function Filtered<R, E, A, R2, E2, B>(
  input: Versioned.Versioned<R, R, E, A, R, E | Cause.NoSuchElementException, A>,
  f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
): Filtered<R | R2, E | E2, B> {
  return new FilteredImpl(input, f) as any
}

class FilteredImpl<R, E, A, R2, E2, B>
  extends VersionedTransform<R, R, E, A, R, E, A, R | R2, E | E2, B, R | R2, E | E2 | Cause.NoSuchElementException, B>
  implements Filtered<R | R2, E | E2, B>
{
  readonly [FilteredTypeId]: FilteredTypeId = FilteredTypeId

  constructor(
    readonly input: Versioned.Versioned<R, R, E, A, R, E, A>,
    readonly f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
  ) {
    super(
      input,
      (fx) => {
        const computed = core.skipRepeats(core.compact(core.mapEffect(fx, f)))

        return core.suspend(() => {
          if (Option.isSome(this._currentValue)) {
            return core.startWith(computed, this._currentValue.value)
          } else {
            return computed
          }
        })
      },
      (effect) => Effect.flatten(Effect.flatMap(effect, f))
    )

    this.option = Computed(
      this.input,
      this.f
    )
  }

  filterMapEffect: Filtered<R | R2, E | E2, B>["filterMapEffect"] = (f) => new FilteredImpl(this as any, f) as any

  filterMap: Filtered<R | R2, E | E2, B>["filterMap"] = (f) => this.filterMapEffect((a) => Effect.sync(() => f(a)))

  filterEffect: Filtered<R | R2, E | E2, B>["filterEffect"] = (f) =>
    this.filterMapEffect((a) => Effect.map(f(a), (b) => (b ? Option.some(a) : Option.none())))

  filter: Filtered<R | R2, E | E2, B>["filter"] = (f) => this.filterEffect((a) => Effect.sync(() => f(a)))

  mapEffect: Filtered<R | R2, E | E2, B>["mapEffect"] = (f) => this.filterMapEffect((a) => Effect.asSome(f(a)))

  map: Filtered<R | R2, E | E2, B>["map"] = (f) => this.mapEffect((a) => Effect.sync(() => f(a)))

  skipRepeats: (eq?: Equivalence<B> | undefined) => Filtered<R | R2, E | E2, B> = (eq = equals) =>
    Filtered(
      Versioned.transformFx(
        this,
        (fx: Fx.Fx<R | R2, E | E2, B>) => core.skipRepeatsWith(fx, eq)
      ),
      Effect.succeedSome
    )

  readonly option: Filtered<R | R2, E | E2, B>["option"]
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
  Fx.Fx.Context<Computeds[keyof Computeds]>,
  Fx.Fx.Error<Computeds[keyof Computeds]>,
  { readonly [K in keyof Computeds]: Fx.Fx.Success<Computeds[K]> }
> {
  return Filtered(
    Versioned.struct(computeds) as Versioned.Versioned<
      Fx.Fx.Context<Computeds[keyof Computeds]>,
      Fx.Fx.Context<Computeds[keyof Computeds]>,
      Fx.Fx.Error<Computeds[keyof Computeds]>,
      { readonly [K in keyof Computeds]: Fx.Fx.Success<Computeds[K]> },
      Fx.Fx.Context<Computeds[keyof Computeds]>,
      Fx.Fx.Error<Computeds[keyof Computeds]>,
      { readonly [K in keyof Computeds]: Fx.Fx.Success<Computeds[K]> }
    >,
    Effect.succeedSome
  )
}

export const fromTag: {
  <S, R2, E2, B>(f: (s: S) => Filtered<R2, E2, B>): <I>(tag: Tag<I, S>) => Filtered<I | R2, E2, B>
  <I, S, R2, E2, B>(tag: Tag<I, S>, f: (s: S) => Filtered<R2, E2, B>): Filtered<I | R2, E2, B>
} = dual(
  2,
  function fromTag<I, S, R2, E2, B>(tag: Tag<I, S>, f: (s: S) => Filtered<R2, E2, B>) {
    const get = new OnceEffect(Effect.map(tag, f))

    return Filtered(
      Versioned.make({
        fx: fromFxEffect(get),
        effect: Effect.flatten(get),
        version: Effect.flatMap(get, (c) => c.version)
      }),
      Effect.succeedSome
    )
  }
)
