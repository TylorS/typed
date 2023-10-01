import type { Fx } from "@typed/fx/Fx"
import type { VersionedFxEffect } from "@typed/fx/FxEffect"
import { FxEffectProto } from "@typed/fx/internal/fx-effect-proto"
import { MulticastEffect } from "@typed/fx/internal/helpers"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"

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

    // Use MulticastEffect to ensure at most 1 effect is running at a time
    const update = new MulticastEffect(Effect.gen(function*(_) {
      const x = yield* _(that._transformGet(that.input as any as Effect.Effect<R2, E2, B>))

      that.#currentValue = Option.some(x)
      that.#version = yield* _(that.input.version)

      return x
    }))

    return Effect.gen(function*(_) {
      if (Option.isSome(that.#currentValue) && (yield* _(that.input.version)) === that.#version) {
        return that.#currentValue.value
      }

      return yield* _(update)
    })
  }

  readonly get = Effect.suspend(() => this as any as Effect.Effect<R4, E4, D>)
}
