import { Effect, flow, Option } from "effect"
import { dual } from "effect/Function"
import { sum } from "effect/Number"
import { MulticastEffect } from "../internal/helpers"
import type { Fx } from "./Fx"
import * as core from "./internal/core"
import { FxEffectBase } from "./internal/protos"
import type { Sink } from "./Sink"

// TODO: dualize
// TODO: context abstraction
// TODO: More operators

export interface Versioned<R1, E1, R2, E2, A2, R3, E3, A3> extends Fx<R2, E2, A2>, Effect.Effect<R3, E3, A3> {
  readonly version: Effect.Effect<R1, E1, number>
}

export namespace Versioned {
  /**
   * @category models
   * @since 1.0.0
   */
  export type Unify<T> = T extends
    Versioned<infer R1, infer E1, infer R2, infer E2, infer A2, infer R3, infer E3, infer A3> | infer _
    ? Versioned<R1, E1, R2, E2, A2, R3, E3, A3>
    : never

  export type VersionContext<T> = T extends Versioned<infer R, any, any, any, any, any, any, any> ? R : never

  export type VersionError<T> = T extends Versioned<any, infer E, any, any, any, any, any, any> ? E : never
}

export function make<R1, E1, R2, E2, A2, R3, E3, A3>(
  version: Effect.Effect<R1, E1, number>,
  fx: Fx<R2, E2, A2>,
  effect: Effect.Effect<R3, E3, A3>
): Versioned<R1, E1, R2, E2, A2, R3, E3, A3> {
  return new VersionedImpl(version, fx, effect)
}

class VersionedImpl<R1, E1, R2, E2, A2, R3, E3, A3> extends FxEffectBase<R2, E2, A2, R3, E3, A3>
  implements Versioned<R1, E1, R2, E2, A2, R3, E3, A3>
{
  constructor(
    readonly version: Effect.Effect<R1, E1, number>,
    readonly fx: Fx<R2, E2, A2>,
    readonly effect: Effect.Effect<R3, E3, A3>
  ) {
    super()
  }

  run<R3>(sink: Sink<R3, E2, A2>): Effect.Effect<R2 | R3, never, unknown> {
    return this.fx.run(sink)
  }

  toEffect(): Effect.Effect<R3, E3, A3> {
    return this.effect
  }
}

export function transform<R0, E0, R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(
  input: Versioned<R0, E0, R, E, A, R2, E2, B>,
  transformFx: (fx: Fx<R, E, A>) => Fx<R3, E3, C>,
  transformGet: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R4, E4, D>
): Versioned<never, never, R3, E3, C, R0 | R4, E0 | E4, D> {
  if (isVersionedTransform(input)) {
    return new VersionedTransform(
      input.input,
      flow(input._transformFx, transformFx),
      flow(input._transformEffect, transformGet)
    )
  } else {
    return new VersionedTransform(input, transformFx, transformGet)
  }
}

/**
 * @internal
 */
export class VersionedTransform<R0, E0, R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>
  extends FxEffectBase<R3, E3, C, R0 | R4, E0 | E4, D>
  implements Versioned<never, never, R3, E3, C, R0 | R4, E0 | E4, D>
{
  protected _version = 0
  protected _currentValue: Option.Option<D> = Option.none()
  private _fx: Fx<R3, E3, C>

  constructor(
    readonly input: Versioned<R0, E0, R, E, A, R2, E2, B>,
    readonly _transformFx: (fx: Fx<R, E, A>) => Fx<R3, E3, C>,
    readonly _transformEffect: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R4, E4, D>
  ) {
    super()

    this._fx = _transformFx(this.input)
  }

  readonly version = Effect.sync(() => this._version)

  run<R5>(sink: Sink<R5, E3, C>): Effect.Effect<R3 | R5, never, unknown> {
    return this._fx.run(sink)
  }

  toEffect(): Effect.Effect<R0 | R4, E0 | E4, D> {
    const update = Effect.tap(
      this._transformEffect(this.input as any as Effect.Effect<R2, E2, B>),
      (value) =>
        Effect.sync(() => {
          this._currentValue = Option.some(value)
          this._version++
        })
    )

    return new MulticastEffect(Effect.flatMap(this.input.version, (version) => {
      if (version === this._version && Option.isSome(this._currentValue)) {
        return Effect.succeed(this._currentValue.value)
      }

      return update
    }))
  }
}

function isVersionedTransform(
  u: unknown
): u is VersionedTransform<any, any, any, any, any, any, any, any, any, any, any, any, any, any> {
  return u instanceof VersionedTransform
}

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
  return transform(versioned, (fx) => core.map(fx, options.onFx), Effect.map(options.onEffect))
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
  return transform(versioned, (fx) => core.mapEffect(fx, options.onFx), Effect.flatMap(options.onEffect))
})

/**
 * @since 1.0.0
 */
export function tuple<const VS extends ReadonlyArray<Versioned<any, any, any, any, any, any, any, any>>>(
  versioneds: VS
): Versioned<
  Versioned.VersionContext<VS[number]>,
  Versioned.VersionError<VS[number]>,
  Fx.Context<VS[number]>,
  Fx.Error<VS[number]>,
  { readonly [K in keyof VS]: Fx.Success<VS[K]> },
  Effect.Effect.Context<VS[number]>,
  Effect.Effect.Error<VS[number]>,
  { readonly [K in keyof VS]: Effect.Effect.Success<VS[K]> }
> {
  return make(
    Effect.map(Effect.all(versioneds.map((v) => v.version)), (versions) => versions.reduce(sum, 0)),
    core.tuple(versioneds),
    Effect.all(versioneds, { concurrency: "unbounded" }) as any
  )
}

/**
 * @since 1.0.0
 */
export function struct<const VS extends Readonly<Record<string, Versioned<any, any, any, any, any, any, any, any>>>>(
  versioneds: VS
): Versioned<
  Versioned.VersionContext<VS[keyof VS]>,
  Versioned.VersionError<VS[keyof VS]>,
  Fx.Context<VS[keyof VS]>,
  Fx.Error<VS[keyof VS]>,
  { readonly [K in keyof VS]: Fx.Success<VS[K]> },
  Effect.Effect.Context<VS[keyof VS]>,
  Effect.Effect.Error<VS[keyof VS]>,
  { readonly [K in keyof VS]: Effect.Effect.Success<VS[K]> }
> {
  return map(
    tuple(
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
