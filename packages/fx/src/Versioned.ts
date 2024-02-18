/**
 * Versioned is a special Fx which is also an Effect, and keeps track of a version number of the
 * current value it holds. The Fx portion is used to subscribe to changes, the Effect portion to
 * sample the current value. The version can be utilized to avoid computing work related to this value.
 * @since 1.0.0
 */

import type * as Context from "@typed/context"
import type { Layer, Runtime, Scope } from "effect"
import * as Effect from "effect/Effect"
import { dual, flow } from "effect/Function"
import { sum } from "effect/Number"
import * as Option from "effect/Option"
import type { Fx } from "./Fx.js"
import * as core from "./internal/core.js"
import { MulticastEffect } from "./internal/helpers.js"
import { FxEffectBase } from "./internal/protos.js"
import * as coreShare from "./internal/share.js"
import type { Sink } from "./Sink.js"

// TODO: dualize
// TODO: context abstraction
// TODO: More operators

/**
 * @since 1.0.0
 */
export interface Versioned<out R1, out E1, out A2, out E2, out R2, out A3, out E3, out R3>
  extends Fx<A2, E2, R2>, Effect.Effect<A3, E3, R3>
{
  readonly version: Effect.Effect<number, E1, R1>
}

/**
 * @since 1.0.0
 */
export namespace Versioned {
  /**
   * @category models
   * @since 1.0.0
   */
  export type Unify<T> = T extends
    Versioned<infer R1, infer E1, infer R2, infer E2, infer A2, infer R3, infer E3, infer A3> | infer _
    ? Versioned<R1, E1, A2, E2, R2, A3, E3, R3>
    : never

  /**
   * @since 1.0.0
   */
  export type VersionContext<T> = T extends Versioned<infer R, any, any, any, any, any, any, any> ? R : never

  /**
   * @since 1.0.0
   */
  export type VersionError<T> = T extends Versioned<any, infer E, any, any, any, any, any, any> ? E : never
}

/**
 * @since 1.0.0
 */
export function make<R1, E1, A2, E2, R2, A3, E3, R3>(
  version: Effect.Effect<number, E1, R1>,
  fx: Fx<A2, E2, R2>,
  effect: Effect.Effect<A3, E3, R3>
): Versioned<R1, E1, A2, E2, R2, A3, E3, R3> {
  return new VersionedImpl(version, fx, effect)
}

class VersionedImpl<R1, E1, A2, E2, R2, A3, E3, R3> extends FxEffectBase<A2, E2, R2, A3, E3, R3>
  implements Versioned<R1, E1, A2, E2, R2, A3, E3, R3>
{
  constructor(
    readonly version: Effect.Effect<number, E1, R1>,
    readonly fx: Fx<A2, E2, R2>,
    readonly effect: Effect.Effect<A3, E3, R3>
  ) {
    super()
  }

  run<R3>(sink: Sink<A2, E2, R3>): Effect.Effect<unknown, never, R2 | R3> {
    return this.fx.run(sink)
  }

  toEffect(): Effect.Effect<A3, E3, R3> {
    return this.effect
  }
}

/**
 * @since 1.0.0
 */
export function transform<R0, E0, A, E, R, B, E2, R2, C, E3, R3, D, E4, R4>(
  input: Versioned<R0, E0, A, E, R, B, E2, R2>,
  transformFx: (fx: Fx<A, E, R>) => Fx<C, E3, R3>,
  transformGet: (effect: Effect.Effect<B, E2, R2>) => Effect.Effect<D, E4, R4>
): Versioned<never, never, C, E3, R3, D, E0 | E4, R0 | R4> {
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
export class VersionedTransform<R0, E0, A, E, R, B, E2, R2, C, E3, R3, D, E4, R4>
  extends FxEffectBase<C, E3, R3, D, E0 | E4, R0 | R4>
  implements Versioned<never, never, C, E3, R3, D, E0 | E4, R0 | R4>
{
  protected _version = -1
  protected _currentValue: Option.Option<D> = Option.none()
  protected _fx: Fx<C, E3, R3>

  constructor(
    readonly input: Versioned<R0, E0, A, E, R, B, E2, R2>,
    readonly _transformFx: (fx: Fx<A, E, R>) => Fx<C, E3, R3>,
    readonly _transformEffect: (effect: Effect.Effect<B, E2, R2>) => Effect.Effect<D, E4, R4>
  ) {
    super()

    this._fx = _transformFx(this.input)
  }

  readonly version = Effect.sync(() => this._version)

  run<R5>(sink: Sink<C, E3, R5>): Effect.Effect<unknown, never, R3 | R5> {
    return this._fx.run(sink)
  }

  toEffect(): Effect.Effect<D, E0 | E4, R0 | R4> {
    const transformed = this._transformEffect(this.input as any as Effect.Effect<B, E2, R2>)
    const update = (v: number) =>
      Effect.tap(
        transformed,
        (value) =>
          Effect.sync(() => {
            this._currentValue = Option.some(value)
            this._version = v
          })
      )

    return new MulticastEffect(Effect.flatMap(this.input.version, (version) => {
      if (version === this._version && Option.isSome(this._currentValue)) {
        return Effect.succeed(this._currentValue.value)
      }

      return update(version)
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
  <A, E, R, C, B, D>(
    options: {
      onFx: (a: A) => C
      onEffect: (b: B) => D
    }
  ): <R0, E0, R2, E2>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>
  ) => Versioned<never, never, C, E, R, D, E0 | E2, R0 | R2>

  <R0, E0, A, E, R, B, E2, R2, C, D>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    options: {
      onFx: (a: A) => C
      onEffect: (b: B) => D
    }
  ): Versioned<never, never, C, E, R, D, E0 | E2, R0 | R2>
} = dual(2, function map<R0, E0, A, E, R, B, E2, R2, C, D>(
  versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
  options: {
    onFx: (a: A) => C
    onEffect: (b: B) => D
  }
): Versioned<never, never, C, E, R, D, E0 | E2, R0 | R2> {
  return transform(versioned, (fx) => core.map(fx, options.onFx), Effect.map(options.onEffect))
})

/**
 * Transform a Versioned's output value as both an Fx and Effect using an Effect.
 * @since 1.18.0
 * @category combinators
 */
export const mapEffect: {
  <A, C, E3, R3, B, D, E4, R4>(
    options: { onFx: (a: A) => Effect.Effect<C, E3, R3>; onEffect: (b: B) => Effect.Effect<D, E4, R4> }
  ): <R0, E0, R, E, R2, E2>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>
  ) => Versioned<never, never, C, E | E3, R | R3, D, E0 | E2 | E4, R0 | R2 | R4>

  <R0, E0, A, E, R, B, E2, R2, C, E3, R3, D, E4, R4>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    options: { onFx: (a: A) => Effect.Effect<C, E3, R3>; onEffect: (b: B) => Effect.Effect<D, E4, R4> }
  ): Versioned<never, never, C, E | E3, R | R3, D, E0 | E2 | E4, R0 | R2 | R4>
} = dual(2, function mapEffect<R0, E0, A, E, R, B, E2, R2, C, E3, R3, D, E4, R4>(
  versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
  options: {
    onFx: (a: A) => Effect.Effect<C, E3, R3>
    onEffect: (b: B) => Effect.Effect<D, E4, R4>
  }
): Versioned<never, never, C, E | E3, R | R3, D, E0 | E2 | E4, R0 | R2 | R4> {
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
  { readonly [K in keyof VS]: Effect.Effect.Success<VS[K]> },
  Fx.Error<VS[number]>,
  Fx.Context<VS[number]>,
  { readonly [K in keyof VS]: Fx.Success<VS[K]> },
  Effect.Effect.Error<VS[number]>,
  Effect.Effect.Context<VS[number]>
> {
  return make(
    Effect.map(Effect.all(versioneds.map((v) => v.version)), (versions) => versions.reduce(sum, 0)),
    core.tuple(versioneds),
    Effect.all(versioneds, { concurrency: "unbounded" }) as any
  ) as any
}

/**
 * @since 1.0.0
 */
export function struct<const VS extends Readonly<Record<string, Versioned<any, any, any, any, any, any, any, any>>>>(
  versioneds: VS
): Versioned<
  Versioned.VersionContext<VS[keyof VS]>,
  Versioned.VersionError<VS[keyof VS]>,
  { readonly [K in keyof VS]: Fx.Success<VS[K]> },
  Fx.Error<VS[keyof VS]>,
  Fx.Context<VS[keyof VS]>,
  { readonly [K in keyof VS]: Effect.Effect.Success<VS[K]> },
  Effect.Effect.Error<VS[keyof VS]>,
  Effect.Effect.Context<VS[keyof VS]>
> {
  return make(
    Effect.map(Effect.all(Object.values(versioneds).map((v) => v.version)), (versions) => versions.reduce(sum, 0)),
    core.struct(versioneds),
    Effect.all(versioneds, { concurrency: "unbounded" }) as any
  )
}

/**
 * @since 1.0.0
 */
export const provide: {
  <S>(ctx: Context.Context<S> | Runtime.Runtime<S>): <R0, E0, A, E, R, B, E2, R2>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>
  ) => Versioned<Exclude<R0, S>, E0, A, E, Exclude<R, S>, B, E2, Exclude<R2, S>>

  <R3, S>(layer: Layer.Layer<S, never, R3>): <R0, E0, A, E, R, B, E2, R2>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>
  ) => Versioned<R3 | Exclude<R0, S>, E0, A, E, R3 | Exclude<R, S>, B, E2, R3 | Exclude<R2, S>>

  <R0, E0, A, E, R, B, E2, R2, S>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    context: Context.Context<S> | Runtime.Runtime<S>
  ): Versioned<Exclude<R0, S>, E0, A, E, Exclude<R, S>, B, E2, Exclude<R2, S>>

  <R0, E0, A, E, R, B, E2, R2, R3 = never, S = never>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    context: Layer.Layer<S, never, R3>
  ): Versioned<R3 | Exclude<R0, S>, E0, A, E, R3 | Exclude<R, S>, B, E2, R3 | Exclude<R2, S>>

  <R0, E0, A, E, R, B, E2, R2, R3 = never, S = never>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    context: Context.Context<S> | Runtime.Runtime<S> | Layer.Layer<S, never, R3>
  ): Versioned<R3 | Exclude<R0, S>, E0, A, E, R3 | Exclude<R, S>, B, E2, R3 | Exclude<R2, S>>
} = dual(2, function provide<R0, E0, A, E, R, B, E2, R2, R3 = never, S = never>(
  versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
  context: Context.Context<S> | Runtime.Runtime<S> | Layer.Layer<S, never, R3>
): Versioned<R3 | Exclude<R0, S>, E0, A, E, R3 | Exclude<R, S>, B, E2, R3 | Exclude<R2, S>> {
  return make(
    Effect.provide(versioned.version, context as Layer.Layer<S, never, R3>),
    core.provide(versioned, context),
    Effect.provide(versioned, context as Layer.Layer<S, never, R3>)
  )
})

/**
 * @since 1.0.0
 */
export function of<A>(value: A): Versioned<never, never, A, never, never, A, never, never> {
  return make(Effect.succeed(1), core.succeed(value), Effect.succeed(value))
}

/**
 * @since 1.0.0
 */
export function hold<R0, E0, A, E, R, B, E2, R2>(
  versioned: Versioned<R0, E0, A, E, R, B, E2, R2>
): Versioned<R0, E0, A, E, R | Scope.Scope, B, E2, R2> {
  return make(
    versioned.version,
    coreShare.hold(versioned),
    versioned
  )
}

/**
 * @since 1.0.0
 */
export function multicast<R0, E0, A, E, R, B, E2, R2>(
  versioned: Versioned<R0, E0, A, E, R, B, E2, R2>
): Versioned<R0, E0, A, E, R | Scope.Scope, B, E2, R2> {
  return make(
    versioned.version,
    coreShare.multicast(versioned),
    versioned
  )
}

/**
 * @since 1.0.0
 */
export function replay<R0, E0, A, E, R, B, E2, R2>(
  versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
  bufferSize: number
): Versioned<R0, E0, A, E, R | Scope.Scope, B, E2, R2> {
  return make(
    versioned.version,
    coreShare.replay(versioned, bufferSize),
    versioned
  )
}
