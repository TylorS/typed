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
import type { Context, Equivalence, Layer, Runtime } from "effect"
import * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import { dual } from "effect/Function"
import * as Option from "effect/Option"

/**
 * A Computed is a Subject that has a current value that can be read and observed
 * @since 1.18.0
 * @category models
 */
export interface Computed<out R, out E, out A> extends Versioned.Versioned<R, never, R, E, A, R, E, A> {
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

  /**
   * Skip values that match the provided Equivalence instance
   */
  readonly skipRepeats: (eq?: Equivalence.Equivalence<A>) => Computed<R, E, A>
}

/**
 * Create a Computed from a data type which is an Fx and an Effect.
 * @since 1.18.0
 */
export function Computed<R, E, A, R2, E2, B>(
  input: Versioned.Versioned<R, never, R, E, A, R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Computed<R | R2, E | E2, B> {
  return new ComputedImpl(input, f) as any
}

export namespace Computed {
  export type Context<T> = [T] extends [Computed<infer R, infer _E, infer _A>] ? R : never
  export type Error<T> = [T] extends [Computed<infer _R, infer E, infer _A>] ? E : never
  export type Success<T> = [T] extends [Computed<infer _R, infer _E, infer A>] ? A : never
}

class ComputedImpl<R, E, A, R2, E2, B>
  extends VersionedTransform<R, never, R, E, A, R, E, A, R | R2, E | E2, B, R | R2, E | E2, B>
  implements Computed<R | R2, E | E2, B>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId

  constructor(
    readonly input: Versioned.Versioned<R, never, R, E, A, R, E, A>,
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

  mapEffect: Computed<R | R2, E | E2, B>["mapEffect"] = (f) => Computed(this, f)

  map: Computed<R | R2, E | E2, B>["map"] = (f) => this.mapEffect((a) => Effect.sync(() => f(a)))

  filterMapEffect: Computed<R | R2, E | E2, B>["filterMapEffect"] = (f) => Filtered(this, f)

  filterMap: Computed<R | R2, E | E2, B>["filterMap"] = (f) => this.filterMapEffect((a) => Effect.sync(() => f(a)))

  filterEffect: Computed<R | R2, E | E2, B>["filterEffect"] = (f) =>
    this.filterMapEffect((a) => Effect.map(f(a), (b) => (b ? Option.some(a) : Option.none())))

  filter: Computed<R | R2, E | E2, B>["filter"] = (f) => this.filterEffect((a) => Effect.sync(() => f(a)))

  skipRepeats: (eq?: Equivalence.Equivalence<B> | undefined) => Computed<R | R2, E | E2, B> = (eq = equals) =>
    Computed<R | R2, E | E2, B, never, never, B>(
      Versioned.transformFx<R | R2, never, R | R2, E | E2, B, R | R2, E | E2, B, R | R2, E | E2, B>(
        this,
        core.skipRepeatsWith(eq)
      ),
      Effect.succeed
    )
}

export function combine<const Computeds extends ReadonlyArray<Computed<any, any, any>>>(computeds: Computeds): Computed<
  Fx.Context<Computeds[keyof Computeds]>,
  Fx.Error<Computeds[keyof Computeds]>,
  { readonly [K in keyof Computeds]: Fx.Success<Computeds[keyof Computeds]> }
> {
  return Computed(
    Versioned.combine(computeds) as Versioned.Versioned<
      Fx.Context<Computeds[keyof Computeds]>,
      never,
      Fx.Context<Computeds[keyof Computeds]>,
      Fx.Error<Computeds[keyof Computeds]>,
      { readonly [K in keyof Computeds]: Fx.Success<Computeds[keyof Computeds]> },
      Fx.Context<Computeds[keyof Computeds]>,
      Fx.Error<Computeds[keyof Computeds]>,
      { readonly [K in keyof Computeds]: Fx.Success<Computeds[keyof Computeds]> }
    >,
    Effect.succeed
  )
}

export function struct<const Computeds extends Readonly<Record<string, Computed<any, any, any>>>>(
  computeds: Computeds
): Computed<
  Computed.Context<Computeds[keyof Computeds]>,
  Computed.Error<Computeds[keyof Computeds]>,
  { readonly [K in keyof Computeds]: Computed.Success<Computeds[K]> }
> {
  return Computed(
    Versioned.struct(computeds) as Versioned.Versioned<
      Computed.Context<Computeds[keyof Computeds]>,
      never,
      Computed.Context<Computeds[keyof Computeds]>,
      Computed.Error<Computeds[keyof Computeds]>,
      { readonly [K in keyof Computeds]: Computed.Success<Computeds[K]> },
      Computed.Context<Computeds[keyof Computeds]>,
      Computed.Error<Computeds[keyof Computeds]>,
      { readonly [K in keyof Computeds]: Computed.Success<Computeds[K]> }
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

export const provide: {
  <R2, E2, S>(
    layer: Layer.Layer<R2, E2, S>
  ): <R, E, A>(computed: Computed<R, E, A>) => Computed<R2 | Exclude<R, S>, E | E2, A>

  <S>(
    runtime: Runtime.Runtime<S>
  ): <R, E, A>(computed: Computed<R, E, A>) => Computed<Exclude<R, S>, E, A>

  <S>(
    context: Context.Context<S>
  ): <R, E, A>(computed: Computed<R, E, A>) => Computed<Exclude<R, S>, E, A>

  <R2, E2, S>(
    layer: Layer.Layer<R2, E2, S>
  ): <R, E, A>(computed: Computed<R, E, A>) => Computed<R2 | Exclude<R, S>, E | E2, A>

  <R, E, A, R2, E2, S>(
    computed: Computed<R, E, A>,
    layer: Layer.Layer<R2, E2, S>
  ): Computed<R2 | Exclude<R, S>, E | E2, A>

  <R, E, A, S>(computed: Computed<R, E, A>, runtime: Runtime.Runtime<S>): Computed<Exclude<R, S>, E, A>
  <R, E, A, S>(computed: Computed<R, E, A>, context: Context.Context<S>): Computed<Exclude<R, S>, E, A>
} = dual(2, function provide<R, E, A, R2, E2, S>(
  computed: Computed<R, E, A>,
  layer: Layer.Layer<R2, E2, S>
): Computed<R2 | Exclude<R, S>, E | E2, A> {
  return Computed(
    Versioned.provide(computed, layer),
    Effect.succeed
  )
})
