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

  abstract run<R2>(sink: Sink<R2, E, A>): Effect.Effect<unknown, never, R | R2>

  pipe() {
    return pipeArguments(this, arguments)
  }
}

export abstract class FxEffectBase<R, E, A, R2, E2, B> extends Effectable.StructuralClass<B, E2, R2>
  implements Fx<R, E, A>, Effect.Effect<B, E2, R2>
{
  readonly [TypeId]: Fx.Variance<R, E, A> = Variance

  abstract run<R3>(sink: Sink<R3, E, A>): Effect.Effect<unknown, never, R | R3>

  abstract toEffect(): Effect.Effect<B, E2, R2>

  protected _effect: Effect.Effect<B, E2, R2> | undefined
  commit(): Effect.Effect<B, E2, R2> {
    if (this._effect === undefined) {
      return (this._effect = this.toEffect())
    } else {
      return this._effect
    }
  }
}

export abstract class EffectBase<R, E, A> extends Effectable.StructuralClass<A, E, R>
  implements Effect.Effect<A, E, R>
{
  abstract toEffect(): Effect.Effect<A, E, R>

  private _effect: Effect.Effect<A, E, R> | undefined
  commit(): Effect.Effect<A, E, R> {
    if (this._effect === undefined) {
      return (this._effect = this.toEffect())
    } else {
      return this._effect
    }
  }
}
