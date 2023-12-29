import type { Effect } from "effect"
import * as Effectable from "effect/Effectable"
import { identity } from "effect/Function"
import { pipeArguments } from "effect/Pipeable"
import type { Fx } from "../Fx.js"
import type { Sink } from "../Sink.js"
import { TypeId } from "../TypeId.js"

const Variance: Fx.Variance<never, never, never> = {
  _R: identity,
  _E: identity,
  _A: identity
}

export abstract class FxBase<R, E, A> implements Fx<R, E, A> {
  readonly [TypeId]: Fx.Variance<R, E, A> = Variance

  abstract run<R2>(sink: Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown>

  pipe() {
    return pipeArguments(this, arguments)
  }
}

export abstract class FxEffectBase<R, E, A, R2, E2, B> extends Effectable.StructuralClass<R2, E2, B>
  implements Fx<R, E, A>, Effect.Effect<R2, E2, B>
{
  readonly [TypeId]: Fx.Variance<R, E, A> = Variance

  abstract run<R3>(sink: Sink<R3, E, A>): Effect.Effect<R | R3, never, unknown>

  abstract toEffect(): Effect.Effect<R2, E2, B>

  private _effect: Effect.Effect<R2, E2, B> | undefined
  commit(): Effect.Effect<R2, E2, B> {
    if (this._effect === undefined) {
      return (this._effect = this.toEffect())
    } else {
      return this._effect
    }
  }
}

export abstract class EffectBase<R, E, A> extends Effectable.StructuralClass<R, E, A>
  implements Effect.Effect<R, E, A>
{
  abstract toEffect(): Effect.Effect<R, E, A>

  private _effect: Effect.Effect<R, E, A> | undefined
  commit(): Effect.Effect<R, E, A> {
    if (this._effect === undefined) {
      return (this._effect = this.toEffect())
    } else {
      return this._effect
    }
  }
}
