import { Effect, flow, Option } from "effect"
import { MulticastEffect } from "../internal/helpers"
import type { Fx } from "./Fx"
import { FxEffectBase } from "./internal/protos"
import type { Sink } from "./Sink"

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
  private _version = 0
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
    const transformed = this._transformEffect(this.input as any as Effect.Effect<R2, E2, B>)
    // Use MulticastEffect to ensure at most 1 effect is running at a time
    const update = new MulticastEffect(Effect.gen(this, function*(_) {
      const x = yield* _(transformed)

      this._currentValue = Option.some(x)
      this._version = yield* _(this.input.version)

      return x
    }))

    return Effect.gen(this, function*(_) {
      if (Option.isSome(this._currentValue) && (yield* _(this.input.version)) === this._version) {
        return this._currentValue.value
      }

      return yield* _(update)
    })
  }
}

function isVersionedTransform(
  u: unknown
): u is VersionedTransform<any, any, any, any, any, any, any, any, any, any, any, any, any, any> {
  return u instanceof VersionedTransform
}
