import type { Effect, Scope } from "effect"
import { Effectable, identity, Unify } from "effect"
import { TypeId } from "../../TypeId"
import type { Fusable } from "../Fusion"
import { FusableTypeId } from "../Fusion"
import type { Fx } from "../Fx"
import type { Sink } from "../Sink"

const Variance: Fx.Variance<never, never, never> = {
  _R: identity,
  _E: identity,
  _A: identity
}

export abstract class FxBase<R, E, A> implements Fx<R, E, A> {
  readonly [TypeId]: Fx.Variance<R, E, A> = Variance

  abstract run<R2>(sink: Sink<R2, E, A>, scope: Scope.Scope): Effect.Effect<R | R2, never, unknown>

  /**
   * @since 1.0.0
   */
  readonly [Unify.typeSymbol]!: unknown
  /**
   * @since 1.0.0
   */
  readonly [Unify.unifySymbol]!: Fx.Unify<this>
  /**
   * @since 1.0.0
   */
  readonly [Unify.ignoreSymbol]!: Fx.IgnoreList
}

export abstract class FxEffectBase<R, E, A, R2, E2, B> extends Effectable.StructuralClass<R2, E2, B> {
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

export abstract class FusableFx<R, E, A> extends FxBase<R, E, A> implements Fusable {
  readonly [FusableTypeId]: PropertyKey

  constructor(name: PropertyKey) {
    super()
    this[FusableTypeId] = name
  }
}
