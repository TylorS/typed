import { identity } from "@effect/data/Function"
import * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import type { Fx } from "@typed/fx/Fx"
import type { FxEffect } from "@typed/fx/FxEffect"
import { FxEffectProto } from "@typed/fx/internal/fx-effect-proto"

export class FxEffectTransform<R, E, A, R2, E2, B, R3, E3, C, R4, E4, D> extends FxEffectProto<R3, E3, C, R4, E4, D> {
  #version = 0
  #currentValue: Option.Option<D> = Option.none()

  constructor(
    readonly input: FxEffect<R, E, A, R2, E2, B>,
    private _transformFx: (fx: Fx<R, E, A>) => Fx<R3, E3, C>,
    private _transformGet: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R4, E4, D>
  ) {
    super()
  }

  readonly version = () => this.#version

  toFx() {
    return this._transformFx(this.input)
  }

  toEffect(): Effect.Effect<R4, E4, D> {
    const effect = this._transformGet(this.input as any as Effect.Effect<R2, E2, B>)

    return Effect.suspend(() => {
      if (Option.isSome(this.#currentValue)) {
        const version = this.input.version()

        if (version === this.#version) {
          return Effect.succeed(this.#currentValue.value)
        }
      }

      return Effect.tap(effect, (x) =>
        Effect.sync(() => {
          this.#currentValue = Option.some(x)
          this.#version = this.input.version()
        }))
    })
  }

  transform<R5, E5, F>(
    f: (fx: Fx<R3, E3, C>) => Fx<R5, E5, F>
  ): FxEffectTransform<R3, E3, C, R4, E4, D, R5, E5, F, R4, E4, D> {
    return new FxEffectTransform(this as any, f, identity)
  }

  transformGet: <R5, E5, F>(
    f: (effect: Effect.Effect<R4, E4, D>) => Effect.Effect<R5, E5, F>
  ) => FxEffectTransform<R3, E3, C, R4, E4, D, R3, E3, C, R5, E5, F> = (f) => {
    return new FxEffectTransform(this as any, identity, f)
  }
}
