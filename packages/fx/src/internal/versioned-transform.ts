import type { Fx } from "@typed/fx/Fx"
import { MulticastEffect } from "@typed/fx/internal/helpers"
import { FxEffectBase } from "@typed/fx/internal/protos"
import type { Versioned } from "@typed/fx/Versioned"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"

export class VersionedTransform<R0, E0, R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>
  extends FxEffectBase<R3, E3, C, R0 | R4, E0 | E4, D>
  implements Versioned<never, never, R3, E3, C, R0 | R4, E0 | E4, D>
{
  private _version = 0
  protected _currentValue: Option.Option<D> = Option.none()

  constructor(
    readonly input: Versioned<R0, E0, R, E, A, R2, E2, B>,
    private _transformFx: (fx: Fx<R, E, A>) => Fx<R3, E3, C>,
    private _transformGet: (effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R4, E4, D>
  ) {
    super()
  }

  readonly version = Effect.sync(() => this._version)

  toFx() {
    return this._transformFx(this.input)
  }

  toEffect(): Effect.Effect<R0 | R4, E0 | E4, D> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this

    // Use MulticastEffect to ensure at most 1 effect is running at a time
    const update = new MulticastEffect(Effect.gen(function*(_) {
      const x = yield* _(that._transformGet(that.input as any as Effect.Effect<R2, E2, B>))

      that._currentValue = Option.some(x)
      that._version = yield* _(that.input.version)

      return x
    }))

    return Effect.gen(function*(_) {
      if (Option.isSome(that._currentValue) && (yield* _(that.input.version)) === that._version) {
        return that._currentValue.value
      }

      return yield* _(update)
    })
  }
}
