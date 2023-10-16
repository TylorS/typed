/**
 * This module provides a data type which is both an Fx and an Effect. This is a more advanced types, and is the basis
 * for creating Computed + Filtered types from a RefSubject which is the canonical implementation of
 * an at type which is both Fx + Effect.
 * @since 1.18.0
 */

import type * as Fx from "@typed/fx/Fx"
import * as core from "@typed/fx/internal/core"
import * as fxEffectProto from "@typed/fx/internal/fx-effect-proto"
import { VersionedTransform } from "@typed/fx/internal/versioned-transform"
import { Effect, identity } from "effect"
import { dual } from "effect/Function"

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
export interface Versioned<R0, R, E, A, R2, E2, B> extends Fx.Fx<R, E, A>, Effect.Effect<R2, E2, B> {
  /**
   * The current version of this FxEffect. This is used to determine if the current value
   * is up to date to allow localized caching of value.
   */
  readonly version: Effect.Effect<R0, never, number>
}

/**
 * Construct a Versioned type.
 * @since 1.18.0
 * @category constructors
 */
export const make: <R0, R, E, A, R2, E2, B>(
  { effect, fx, version }: {
    version: Effect.Effect<R0, never, number>
    fx: Fx.Fx<R, E, A>
    effect: Effect.Effect<R2, E2, B>
  }
) => Versioned<R0, R, E, A, R2, E2, B> = fxEffectProto.makeVersioned

/**
 * Construct a Versioned type from a static value.
 * @since 1.18.0
 * @category constructors
 */
export const of: <A>(value: A) => Versioned<never, never, never, A, never, never, A> = fxEffectProto.versionedOf

/**
 * Transform a Versioned as an Fx and as an Effect separately.
 * @since 1.18.0
 * @category combinators
 */
export const transform: {
  <R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
    transformFx: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>,
    transformGet: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R4, E4, D>
  ): <R0>(versioned: Versioned<R0, R, E, A, R2, E2, B>) => Versioned<R0, R3, E3, C, R4, E4, D>
  <R0, R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
    versioned: Versioned<R0, R, E, A, R2, E2, B>,
    transformFx: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>,
    transformGet: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R4, E4, D>
  ): Versioned<R0, R3, E3, C, R4, E4, D>
} = dual(3, function transform<R0, R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
  versioned: Versioned<R0, R, E, A, R2, E2, B>,
  transformFx: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>,
  transformGet: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R4, E4, D>
): Versioned<R0, R3, E3, C, R4, E4, D> {
  return new VersionedTransform(versioned, transformFx, transformGet) as any
})

/**
 * Transform a Versioned as an Fx separately from its Effect interface.
 * @since 1.18.0
 * @category combinators
 */
export const transformFx: {
  <R, E, A, R3, E3, C>(
    f: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>
  ): <R0, R2, E2, B>(versioned: Versioned<R0, R, E, A, R2, E2, B>) => Versioned<R0, R3, E3, C, R2, E2, B>

  <R0, R, E, A, R2, E2, B, R3, E3, C>(
    versioned: Versioned<R0, R, E, A, R2, E2, B>,
    f: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>
  ): Versioned<R0, R3, E3, C, R2, E2, B>
} = dual(2, function transformFx<R0, R, E, A, R2, E2, B, R3, E3, C>(
  versioned: Versioned<R0, R, E, A, R2, E2, B>,
  f: (fx: Fx.Fx<R, E, A>) => Fx.Fx<R3, E3, C>
): Versioned<R0, R3, E3, C, R2, E2, B> {
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
  ): <R0, R, E, A>(versioned: Versioned<R0, R, E, A, R2, E2, B>) => Versioned<R0, R, E, A, R3, E3, C>

  <R0, R, E, A, R2, E2, B, R3, E3, C>(
    versioned: Versioned<R0, R, E, A, R2, E2, B>,
    f: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R3, E3, C>
  ): Versioned<R0, R, E, A, R3, E3, C>
} = dual(2, function transformEffect<R0, R, E, A, R2, E2, B, R3, E3, C>(
  versioned: Versioned<R0, R, E, A, R2, E2, B>,
  f: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R3, E3, C>
): Versioned<R0, R, E, A, R3, E3, C> {
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
  ): <R0, R2, E2>(versioned: Versioned<R0, R, E, A, R2, E2, B>) => Versioned<R0, R, E, C, R2, E2, D>

  <R0, R, E, A, R2, E2, B, C, D>(
    versioned: Versioned<R0, R, E, A, R2, E2, B>,
    options: {
      onFx: (a: A) => C
      onEffect: (b: B) => D
    }
  ): Versioned<R0, R, E, C, R2, E2, D>
} = dual(2, function map<R0, R, E, A, R2, E2, B, C, D>(
  versioned: Versioned<R0, R, E, A, R2, E2, B>,
  options: {
    onFx: (a: A) => C
    onEffect: (b: B) => D
  }
): Versioned<R0, R, E, C, R2, E2, D> {
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
  ): <R0, R, E, R2, E2>(
    versioned: Versioned<R0, R, E, A, R2, E2, B>
  ) => Versioned<R0, R | R3, E | E3, C, R2 | R4, E2 | E4, D>

  <R0, R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
    versioned: Versioned<R0, R, E, A, R2, E2, B>,
    options: { onFx: (a: A) => Effect.Effect<R3, E3, C>; onEffect: (b: B) => Effect.Effect<R4, E4, D> }
  ): Versioned<R0, R | R3, E | E3, C, R2 | R4, E2 | E4, D>
} = dual(2, function mapEffect<R0, R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
  versioned: Versioned<R0, R, E, A, R2, E2, B>,
  options: {
    onFx: (a: A) => Effect.Effect<R3, E3, C>
    onEffect: (b: B) => Effect.Effect<R4, E4, D>
  }
): Versioned<R0, R | R3, E | E3, C, R2 | R4, E2 | E4, D> {
  return transform(versioned, core.mapEffect(options.onFx), Effect.flatMap(options.onEffect))
})
