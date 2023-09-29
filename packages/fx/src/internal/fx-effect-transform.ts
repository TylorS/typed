import * as Option from "effect/Option"
import * as Effect from "effect/Effect"
import type { Fx } from "@typed/fx/Fx"
import type { VersionedFxEffect } from "@typed/fx/FxEffect"
import { FxEffectProto } from "@typed/fx/internal/fx-effect-proto"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"

export class FxEffectTransform<R0, R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>
  extends FxEffectProto<R3, E3, C, R0 | R4, E4, D>
  implements Omit<VersionedFxEffect<R0, R3, E3, C, R4, E4, D>, ModuleAgumentedEffectKeysToOmit>
{
  #version = 0
  #currentValue: Option.Option<D> = Option.none()

  constructor(
    readonly input: VersionedFxEffect<R0, R, E, A, R2, E2, B>,
    private _transformFx: (fx: Fx<R, E, A>) => Fx<R3, E3, C>,
    private _transformGet: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R4, E4, D>
  ) {
    super()
  }

  readonly version = Effect.sync(() => this.#version)

  toFx() {
    return this._transformFx(this.input)
  }

  toEffect(): Effect.Effect<R0 | R4, E4, D> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this

    const effect = that._transformGet(that.input as any as Effect.Effect<R2, E2, B>)

    return Effect.gen(function*(_) {
      if (Option.isSome(that.#currentValue)) {
        const version = yield* _(that.input.version)

        if (version === that.#version) {
          return that.#currentValue.value
        }
      }

      const x = yield* _(effect)

      that.#currentValue = Option.some(x)
      that.#version = yield* _(that.input.version)

      return x
    })
  }

  readonly get = Effect.suspend(() => this as any as Effect.Effect<R4, E4, D>)
}
