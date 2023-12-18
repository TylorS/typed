/**
 * A Computed is a Subject that has a current value that can be read and observed
 * @since 1.18.0
 */

import type { Tag } from "@typed/context"
import type { Context, Equivalence, Layer, Runtime } from "effect"
import * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import { dual } from "effect/Function"
import * as Option from "effect/Option"
// eslint-disable-next-line import/no-cycle
import { Filtered } from "./Filtered.js"
import { type Fx } from "./Fx.js"
import * as core from "./internal/core.js"
import { fromFxEffect } from "./internal/fx.js"
import { FxEffectBase } from "./internal/protos.js"
import { hold } from "./internal/share.js"
import { VersionedTransform } from "./internal/versioned-transform.js"
import { ComputedTypeId } from "./TypeId.js"
import * as Versioned from "./Versioned.js"

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

/**
 * @since 1.18.0
 */
export namespace Computed {
  /**
   * @since 1.18.0
   */
  export type Context<T> = [T] extends [Computed<infer R, infer _E, infer _A>] ? R : never
  /**
   * @since 1.18.0
   */
  export type Error<T> = [T] extends [Computed<infer _R, infer E, infer _A>] ? E : never
  /**
   * @since 1.18.0
   */
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

/**
 * @since 1.18.0
 */
export function combine<const Computeds extends ReadonlyArray<Computed<any, any, any>>>(computeds: Computeds): Computed<
  Fx.Context<Computeds[keyof Computeds]>,
  Fx.Error<Computeds[keyof Computeds]>,
  { readonly [K in keyof Computeds]: Fx.Success<Computeds[K]> }
> {
  return Computed(
    Versioned.tuple(computeds) as Versioned.Versioned<
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

/**
 * @since 1.18.0
 */
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

/**
 * @since 1.18.0
 */
export const fromTag: {
  <S, R2, E2, B>(f: (s: S) => Computed<R2, E2, B>): <I>(tag: Tag<I, S>) => Computed<I | R2, E2, B>
  <I, S, R2, E2, B>(tag: Tag<I, S>, f: (s: S) => Computed<R2, E2, B>): Computed<I | R2, E2, B>
} = dual(
  2,
  function fromTag<I, S, R2, E2, B>(tag: Tag<I, S>, f: (s: S) => Computed<R2, E2, B>): Computed<I | R2, E2, B> {
    return new ContextImpl(tag, f)
  }
)

class ContextImpl<I, S, R2, E2, B> extends FxEffectBase<I | R2, E2, B, I | R2, E2, B>
  implements Computed<I | R2, E2, B>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  private _computed: Effect.Effect<I, never, Computed<R2, E2, B>>
  readonly version: Effect.Effect<I | R2, never, number>

  constructor(readonly tag: Tag<I, S>, readonly f: (s: S) => Computed<R2, E2, B>) {
    super()

    this._computed = Effect.map(this.tag, this.f)
    this.version = Effect.flatMap(this._computed, (c) => c.version)
  }

  protected toFx(): Fx<I | R2, E2, B> {
    return hold(fromFxEffect(this._computed))
  }

  protected toEffect(): Effect.Effect<I | R2, E2, B> {
    return Effect.flatten(this._computed)
  }

  mapEffect: Computed<I | R2, E2, B>["mapEffect"] = (f) => Computed(this, f)

  map: Computed<I | R2, E2, B>["map"] = (f) => this.mapEffect((a) => Effect.sync(() => f(a)))

  filterMapEffect: Computed<I | R2, E2, B>["filterMapEffect"] = (f) => Filtered(this, f)

  filterMap: Computed<I | R2, E2, B>["filterMap"] = (f) => this.filterMapEffect((a) => Effect.sync(() => f(a)))

  filterEffect: Computed<I | R2, E2, B>["filterEffect"] = (f) =>
    this.filterMapEffect((a) => Effect.map(f(a), (b) => (b ? Option.some(a) : Option.none())))

  filter: Computed<I | R2, E2, B>["filter"] = (f) => this.filterEffect((a) => Effect.sync(() => f(a)))

  skipRepeats: (eq?: Equivalence.Equivalence<B> | undefined) => Computed<I | R2, E2, B> = (eq = equals) =>
    new ContextImpl(this.tag, (s) => this.f(s).skipRepeats(eq))
}

/**
 * @since 1.18.0
 */
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
