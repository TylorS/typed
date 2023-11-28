import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import type { Fx } from "../Fx.js"
import type { Versioned } from "../Versioned.js"
import { MulticastEffect } from "./helpers.js"
import { FxEffectBase } from "./protos.js"

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
    // Use MulticastEffect to ensure at most 1 effect is running at a time
    const update = new MulticastEffect(Effect.gen(this, function*(_) {
      const x = yield* _(this._transformGet(this.input as any as Effect.Effect<R2, E2, B>))

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
