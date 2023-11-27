/**
 * This module provides a data type which is both an Fx and an Effect. This is a more advanced types, and is the basis
 * for creating Computed + Filtered types from a RefSubject which is the canonical implementation of
 * an at type which is both Fx + Effect.
 * @since 1.18.0
 */

import type { Context, Layer, Runtime } from "effect"
import { Effect, identity } from "effect"
import { dual } from "effect/Function"
import { sum } from "effect/Number"
import type * as Fx from "./Fx"
import * as core from "./internal/core"
import * as fxEffectProto from "./internal/fx-effect-proto"
import { VersionedTransform } from "./internal/versioned-transform"

/**
 * A data type which is both an Fx and an Effect. This is a more advanced type, and is the basis
 * for creating Computed + Filtered types from a RefSubject which is the canonical implementation of
 * an at type which is both an Fx and an Effect.
 *
 * The Fx portion naturally has representations for dealing with keeping things up-to-date and
 * avoiding doing any work that is not necessary. The Effect, or "pull", portion utilizes the
 * version to determine if the current value is up to date. If it is not, then the Fx portion
 * will be run to update the value. This allows for derived types to cache values locally and
 * avoid doing any work if the value is up to date.
 * @since 1.18.0
 * @category models
 */
export interface Versioned<R0, E0, R, E, A, R2, E2, B> extends Fx.Fx<R, E, A>, Effect.Effect<R2, E2, B> {
  /**
   * The current version of this FxEffect. This is used to determine if the current value
   * is up to date to allow localized caching of value.
   */
  readonly version: Effect.Effect<R0, E0, number>
}

/**
 * @since 1.18.0
 */
export namespace Versioned {
  /**
   * @since 1.18.0
   */
  export type VersionContext<T> = T extends
    Versioned<infer R0, infer _E0, infer _R, infer _E, infer _A, infer _R2, infer _E2, infer _B> ? R0 : never

  /**
   * @since 1.18.0
   */
  export type VersionError<T> = T extends
    Versioned<infer _R0, infer E0, infer _R, infer _E, infer _A, infer _R2, infer _E2, infer _B> ? E0 : never
}

/**
 * Construct a Versioned type.
 * @since 1.18.0
 * @category constructors
 */
export const make: <R0, E0, R, E, A, R2, E2, B>(
  { effect, fx, version }: {
    version: Effect.Effect<R0, E0, number>
    fx: Fx.Fx<R, E, A>
    effect: Effect.Effect<R2, E2, B>
  }
) => Versioned<R0, E0, R, E, A, R2, E2, B> = fxEffectProto.makeVersioned

/**
 * Construct a Versioned type from a static value.
 * @since 1.18.0
 * @category constructors
 */
export const of: <A>(value: A) => Versioned<never, never, never, never, A, never, never, A> = fxEffectProto.versionedOf

/**
 * Transform a Versioned as an Fx and as an Effect separately.
 * @since 1.18.0
 * @category combinators
 */
export const transform: {
  <R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
    transformFx: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>,
    transformGet: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R4, E4, D>
  ): <R0, E0>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>
  ) => Versioned<never, never, R3, E3, C, R0 | R4, E0 | E4, D>
  <R0, E0, R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
    transformFx: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>,
    transformGet: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R4, E4, D>
  ): Versioned<never, never, R3, E3, C, R0 | R4, E0 | E4, D>
} = dual(3, function transform<R0, E0, R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
  versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
  transformFx: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>,
  transformGet: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R4, E4, D>
): Versioned<never, never, R3, E3, C, R0 | R4, E0 | E4, D> {
  return new VersionedTransform(versioned, transformFx, transformGet)
})

/**
 * Transform a Versioned as an Fx separately from its Effect interface.
 * @since 1.18.0
 * @category combinators
 */
export const transformFx: {
  <R, E, A, R3, E3, C>(
    f: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>
  ): <R0, E0, R2, E2, B>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>
  ) => Versioned<never, never, R3, E3, C, R0 | R2, E0 | E2, B>

  <R0, E0, R, E, A, R2, E2, B, R3, E3, C>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
    f: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>
  ): Versioned<never, never, R3, E3, C, R0 | R2, E0 | E2, B>
} = dual(2, function transformFx<R0, E0, R, E, A, R2, E2, B, R3, E3, C>(
  versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
  f: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>
): Versioned<never, never, R3, E3, C, R0 | R2, E0 | E2, B> {
  return transform(versioned, f, identity)
})

/**
 * Transform a Versioned as an Effect separately from its Fx interface.
 * @since 1.18.0
 * @category combinators
 */
export const transformEffect: {
  <R2, E2, B, R3, E3, C>(
    f: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R3, E3, C>
  ): <R0, E0, R, E, A>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>
  ) => Versioned<never, never, R, E, A, R0 | R3, E0 | E3, C>

  <R0, E0, R, E, A, R2, E2, B, R3, E3, C>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
    f: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R3, E3, C>
  ): Versioned<never, never, R, E, A, R0 | R3, E0 | E3, C>
} = dual(2, function transformEffect<R0, E0, R, E, A, R2, E2, B, R3, E3, C>(
  versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
  f: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R3, E3, C>
): Versioned<never, never, R, E, A, R0 | R3, E0 | E3, C> {
  return transform(versioned, identity, f)
})

/**
 * Transform a Versioned's output value as both an Fx and Effect.
 * @since 1.18.0
 * @category combinators
 */
export const map: {
  <R, E, A, C, B, D>(
    options: {
      onFx: (a: A) => C
      onEffect: (b: B) => D
    }
  ): <R0, E0, R2, E2>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>
  ) => Versioned<never, never, R, E, C, R0 | R2, E0 | E2, D>

  <R0, E0, R, E, A, R2, E2, B, C, D>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
    options: {
      onFx: (a: A) => C
      onEffect: (b: B) => D
    }
  ): Versioned<never, never, R, E, C, R0 | R2, E0 | E2, D>
} = dual(2, function map<R0, E0, R, E, A, R2, E2, B, C, D>(
  versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
  options: {
    onFx: (a: A) => C
    onEffect: (b: B) => D
  }
): Versioned<never, never, R, E, C, R0 | R2, E0 | E2, D> {
  return transform(versioned, core.map(options.onFx), Effect.map(options.onEffect))
})

/**
 * Transform a Versioned's output value as both an Fx and Effect using an Effect.
 * @since 1.18.0
 * @category combinators
 */
export const mapEffect: {
  <A, R3, E3, C, B, R4, E4, D>(
    options: { onFx: (a: A) => Effect.Effect<R3, E3, C>; onEffect: (b: B) => Effect.Effect<R4, E4, D> }
  ): <R0, E0, R, E, R2, E2>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>
  ) => Versioned<never, never, R | R3, E | E3, C, R0 | R2 | R4, E0 | E2 | E4, D>

  <R0, E0, R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
    versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
    options: { onFx: (a: A) => Effect.Effect<R3, E3, C>; onEffect: (b: B) => Effect.Effect<R4, E4, D> }
  ): Versioned<never, never, R | R3, E | E3, C, R0 | R2 | R4, E0 | E2 | E4, D>
} = dual(2, function mapEffect<R0, E0, R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
  versioned: Versioned<R0, E0, R, E, A, R2, E2, B>,
  options: {
    onFx: (a: A) => Effect.Effect<R3, E3, C>
    onEffect: (b: B) => Effect.Effect<R4, E4, D>
  }
): Versioned<never, never, R | R3, E | E3, C, R0 | R2 | R4, E0 | E2 | E4, D> {
  return transform(versioned, core.mapEffect(options.onFx), Effect.flatMap(options.onEffect))
})

/**
 * @since 1.0.0
 */
export function combine<const VS extends ReadonlyArray<Versioned<any, any, any, any, any, any, any, any>>>(
  versioneds: VS
): Versioned<
  Versioned.VersionContext<VS[number]>,
  Versioned.VersionError<VS[number]>,
  Fx.Fx.Context<VS[number]>,
  Fx.Fx.Error<VS[number]>,
  { readonly [K in keyof VS]: Fx.Fx.Success<VS[K]> },
  Effect.Effect.Context<VS[number]>,
  Effect.Effect.Error<VS[number]>,
  { readonly [K in keyof VS]: Effect.Effect.Success<VS[K]> }
> {
  return make({
    fx: core.combine(versioneds),
    effect: Effect.all(versioneds, { concurrency: "unbounded" }) as any,
    version: Effect.map(Effect.all(versioneds.map((v) => v.version)), (versions) => versions.reduce(sum, 0))
  })
}

/**
 * @since 1.0.0
 */
export function struct<const VS extends Readonly<Record<string, Versioned<any, any, any, any, any, any, any, any>>>>(
  versioneds: VS
): Versioned<
  Versioned.VersionContext<VS[keyof VS]>,
  Versioned.VersionError<VS[keyof VS]>,
  Fx.Fx.Context<VS[keyof VS]>,
  Fx.Fx.Error<VS[keyof VS]>,
  { readonly [K in keyof VS]: Fx.Fx.Success<VS[K]> },
  Effect.Effect.Context<VS[keyof VS]>,
  Effect.Effect.Error<VS[keyof VS]>,
  { readonly [K in keyof VS]: Effect.Effect.Success<VS[K]> }
> {
  return map(
    combine(
      Object.entries(versioneds).map(([k, v]) =>
        map(v, { onFx: (x) => [k, x] as const, onEffect: (x) => [k, x] as const })
      )
    ),
    {
      onFx: Object.fromEntries,
      onEffect: Object.fromEntries
    }
  )
}

/**
 * @since 1.0.0
 */
export const provide: {
  <R3, E3, C3>(
    layer: Layer.Layer<R3, E3, C3>
  ): <R0, E0, R1, E1, A1, R2, E2, B2>(
    versioned: Versioned<R0, E0, R1, E1, A1, R2, E2, B2>
  ) => Versioned<never, never, R3 | Exclude<R1, C3>, E1 | E3, A1, R3 | Exclude<R0 | R2, C3>, E0 | E2 | E3, B2>
  <C3>(
    runtime: Runtime.Runtime<C3>
  ): <R0, E0, R1, E1, A1, R2, E2, B2>(
    versioned: Versioned<R0, E0, R1, E1, A1, R2, E2, B2>
  ) => Versioned<never, never, Exclude<R1, C3>, E1, A1, Exclude<R0 | R2, C3>, E0 | E2, B2>

  <C3>(
    context: Context.Context<C3>
  ): <R0, E0, R1, E1, A1, R2, E2, B2>(
    versioned: Versioned<R0, E0, R1, E1, A1, R2, E2, B2>
  ) => Versioned<never, never, Exclude<R1, C3>, E1, A1, Exclude<R0 | R2, C3>, E0 | E2, B2>

  <R0, E0, R1, E1, A1, R2, E2, B2, R3, E3, C3>(
    versioned: Versioned<R0, E0, R1, E1, A1, R2, E2, B2>,
    layer: Layer.Layer<R3, E3, C3>
  ): Versioned<never, never, R3 | Exclude<R1, C3>, E1 | E3, A1, R3 | Exclude<R0 | R2, C3>, E0 | E2 | E3, B2>

  <R0, E0, R1, E1, A1, R2, E2, B2, C3>(
    versioned: Versioned<R0, E0, R1, E1, A1, R2, E2, B2>,
    runtime: Runtime.Runtime<C3>
  ): Versioned<never, never, Exclude<R1, C3>, E1, A1, Exclude<R0 | R2, C3>, E0 | E2, B2>

  <R0, E0, R1, E1, A1, R2, E2, B2, C3>(
    versioned: Versioned<R0, E0, R1, E1, A1, R2, E2, B2>,
    context: Context.Context<C3>
  ): Versioned<never, never, Exclude<R1, C3>, E1, A1, Exclude<R0 | R2, C3>, E0 | E2, B2>
} = dual(2, function provide<R0, E0, R1, E1, A1, R2, E2, B2, R3, E3, C3>(
  versioned: Versioned<R0, E0, R1, E1, A1, R2, E2, B2>,
  layer: Layer.Layer<R3, E3, C3>
): Versioned<never, never, R3 | Exclude<R1, C3>, E1 | E3, A1, R3 | Exclude<R0 | R2, C3>, E0 | E2 | E3, B2> {
  return transform(
    make({
      effect: versioned,
      fx: versioned,
      version: Effect.provide(versioned.version, layer)
    }),
    core.provide(layer),
    Effect.provide(layer)
  )
})
