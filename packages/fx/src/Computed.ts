/**
 * A Computed is a Subject that has a current value that can be read and observed
 * @since 1.18.0
 */

import type { Tag } from "@typed/context"
// eslint-disable-next-line import/no-cycle
import { Filtered } from "@typed/fx/Filtered"
import type { Fx } from "@typed/fx/Fx"
import * as core from "@typed/fx/internal/core"
import { fromFxEffect } from "@typed/fx/internal/fx"
import { OnceEffect } from "@typed/fx/internal/protos"
import { VersionedTransform } from "@typed/fx/internal/versioned-transform"
import { ComputedTypeId } from "@typed/fx/TypeId"
import * as Versioned from "@typed/fx/Versioned"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as Option from "effect/Option"

/**
 * A Computed is a Subject that has a current value that can be read and observed
 * @since 1.18.0
 * @category models
 */
export interface Computed<out R, out E, out A> extends Versioned.Versioned<R, R, E, A, R, E, A> {
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
  input: Versioned.Versioned<R, R, E, A, R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Computed<R | R2, E | E2, B> {
  return new ComputedImpl(input, f) as any
}

class ComputedImpl<R, E, A, R2, E2, B>
  extends VersionedTransform<R, R, E, A, R, E, A, R | R2, E | E2, B, R | R2, E | E2, B>
  implements Computed<R | R2, E | E2, B>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId

  constructor(
    readonly input: Versioned.Versioned<R, R, E, A, R, E, A>,
    readonly f: (a: A) => Effect.Effect<R2, E2, B>
  ) {
    super(
      input,
      (fx) => {
        const computed = core.skipRepeats(core.mapEffect(fx, f))

        return core.suspend(() => {
          if (Option.isSome(this._currentValue)) {
            return core.startWith(computed, this._currentValue.value)
          } else {
            return computed
          }
        })
      },
      Effect.flatMap(f)
    )
  }

  mapEffect: Computed<R | R2, E | E2, B>["mapEffect"] = (f) => Computed(this as any, f)

  map: Computed<R | R2, E | E2, B>["map"] = (f) => this.mapEffect((a) => Effect.sync(() => f(a)))

  filterMapEffect: Computed<R | R2, E | E2, B>["filterMapEffect"] = (f) => Filtered(this as any, f)

  filterMap: Computed<R | R2, E | E2, B>["filterMap"] = (f) => this.filterMapEffect((a) => Effect.sync(() => f(a)))

  filterEffect: Computed<R | R2, E | E2, B>["filterEffect"] = (f) =>
    this.filterMapEffect((a) => Effect.map(f(a), (b) => (b ? Option.some(a) : Option.none())))

  filter: Computed<R | R2, E | E2, B>["filter"] = (f) => this.filterEffect((a) => Effect.sync(() => f(a)))
}

export function combine<const Computeds extends ReadonlyArray<Computed<any, any, any>>>(computeds: Computeds): Computed<
  Fx.Context<Computeds[number]>,
  Fx.Error<Computeds[number]>,
  { readonly [K in keyof Computeds]: Fx.Success<Computeds[number]> }
> {
  return Computed(
    Versioned.combine(computeds) as Versioned.Versioned<
      Fx.Context<Computeds[number]>,
      Fx.Context<Computeds[number]>,
      Fx.Error<Computeds[number]>,
      { readonly [K in keyof Computeds]: Fx.Success<Computeds[number]> },
      Fx.Context<Computeds[number]>,
      Fx.Error<Computeds[number]>,
      { readonly [K in keyof Computeds]: Fx.Success<Computeds[number]> }
    >,
    Effect.succeed
  )
}

export function struct<const Computeds extends Readonly<Record<string, Computed<any, any, any>>>>(
  computeds: Computeds
): Computed<
  Fx.Context<Computeds[string]>,
  Fx.Error<Computeds[string]>,
  { readonly [K in keyof Computeds]: Fx.Success<Computeds[string]> }
> {
  return Computed(
    Versioned.struct(computeds) as Versioned.Versioned<
      Fx.Context<Computeds[string]>,
      Fx.Context<Computeds[string]>,
      Fx.Error<Computeds[string]>,
      { readonly [K in keyof Computeds]: Fx.Success<Computeds[string]> },
      Fx.Context<Computeds[string]>,
      Fx.Error<Computeds[string]>,
      { readonly [K in keyof Computeds]: Fx.Success<Computeds[string]> }
    >,
    Effect.succeed
  )
}

export const fromTag: {
  <S, R2, E2, B>(f: (s: S) => Computed<R2, E2, B>): <I>(tag: Tag<I, S>) => Computed<I | R2, E2, B>
  <I, S, R2, E2, B>(tag: Tag<I, S>, f: (s: S) => Computed<R2, E2, B>): Computed<I | R2, E2, B>
} = dual(
  2,
  function fromTag<I, S, R2, E2, B>(tag: Tag<I, S>, f: (s: S) => Computed<R2, E2, B>): Computed<I | R2, E2, B> {
    const get = new OnceEffect(Effect.map(tag, f))

    return Computed(
      Versioned.make({
        fx: fromFxEffect(get),
        effect: Effect.flatten(get),
        version: Effect.flatMap(get, (c) => c.version)
      }),
      Effect.succeed
    )
  }
)
