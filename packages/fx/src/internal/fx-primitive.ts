import type * as Cause from "effect/Cause"
import type * as Effect from "effect/Effect"
import type * as Scope from "effect/Scope"

import type * as Sink from "../Sink"
import { type EffectOperator, fuseEffectOperators, liftSyncOperator } from "./effect-operator"
import * as syncOperator from "./sync-operator"

import type { FlattenStrategy, Fx, FxFork, WithEarlyExitParams, WithScopedForkParams } from "../Fx"
import { FxProto } from "./protos"

export type Primitive =
  | Empty
  | Fail<unknown>
  | FromIterable<unknown>
  | FromSink<unknown, unknown, unknown>
  | Never
  | Succeed<unknown>
  | Suspend<unknown, unknown, unknown>
  | Sync<unknown>
  | ToFx<unknown, unknown, unknown>
  | Transformer<unknown, unknown, unknown>
  | TransformerCause<unknown, unknown, unknown>
  | TransformerCauseEffect<unknown, unknown, unknown>
  | TransformerEffect<unknown, unknown, unknown>
  | WithEarlyExit<unknown, unknown, unknown>
  | WithFlattenStrategy<unknown, unknown, unknown>
  | WithScopedFork<unknown, unknown, unknown>

export class Empty extends FxProto<never, never, never> {
  readonly _fxTag = "Empty"
}

export class Fail<E> extends FxProto<never, E, never> {
  readonly _fxTag = "Fail"

  constructor(readonly i0: Cause.Cause<E>) {
    super(i0)
  }
}

export class FromIterable<A> extends FxProto<never, never, A> {
  readonly _fxTag = "FromIterable"

  constructor(readonly i0: Iterable<A>) {
    super(i0)
  }
}

export class FromSink<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "FromSink"

  constructor(readonly i0: (sink: Sink.Sink<E, A>) => Effect.Effect<R, never, unknown>) {
    super(i0)
  }
}

export class Never extends FxProto<never, never, never> {
  readonly _fxTag = "Never"
}

export class Succeed<A> extends FxProto<never, never, A> {
  readonly _fxTag = "Succeed"

  constructor(readonly i0: A) {
    super(i0)
  }
}

export class Sync<A> extends FxProto<never, never, A> {
  readonly _fxTag = "Sync"

  constructor(readonly i0: () => A) {
    super(i0)
  }
}

export class Suspend<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "Suspend"

  constructor(readonly i0: () => Fx<R, E, A>) {
    super(i0)
  }
}

export type WithFlattenStrategyParams<E, A> = {
  readonly sink: Sink.Sink<E, A>
  readonly fork: FxFork
  readonly scope: Scope.Scope
}

export class WithFlattenStrategy<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "WithFlattenStrategy"

  constructor(
    readonly i0: (options: WithFlattenStrategyParams<E, A>) => Effect.Effect<R, never, unknown>,
    readonly i1: FlattenStrategy
  ) {
    super(i0, i1)
  }
}

export class WithEarlyExit<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "WithEarlyExit"

  constructor(
    readonly i0: (options: WithEarlyExitParams<E, A>) => Effect.Effect<R, never, unknown>
  ) {
    super(i0)
  }
}

export class WithScopedFork<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "WithScopedFork"

  constructor(
    readonly i0: (options: WithScopedForkParams<E, A>) => Effect.Effect<R, never, unknown>
  ) {
    super(i0)
  }
}

export class Transformer<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "Transformer"

  constructor(
    readonly i0: Fx<unknown, unknown, unknown>,
    readonly i1: syncOperator.SyncOperator
  ) {
    super(i0, i1)
  }

  static make<R, E, A>(fx: Fx<unknown, unknown, unknown>, operator: syncOperator.SyncOperator): Fx<R, E, A> {
    if (fx instanceof Transformer) {
      return new Transformer(fx.i0, syncOperator.fuseSyncOperators(fx.i1, operator))
    } else {
      return new Transformer<R, E, A>(fx, operator)
    }
  }
}

export class TransformerCause<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "TransformerCause"

  constructor(
    readonly i0: Fx<unknown, unknown, unknown>,
    readonly i1: syncOperator.SyncOperator
  ) {
    super(i0, i1)
  }

  static make<R, E, A>(fx: Fx<unknown, unknown, unknown>, operator: syncOperator.SyncOperator): Fx<R, E, A> {
    if (fx instanceof TransformerCause) {
      return new TransformerCause(fx.i0, syncOperator.fuseSyncOperators(fx.i1, operator))
    } else {
      return new TransformerCause<R, E, A>(fx, operator)
    }
  }
}

export class TransformerEffect<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "TransformerEffect"

  constructor(
    readonly i0: Fx<unknown, unknown, unknown>,
    readonly i1: EffectOperator
  ) {
    super(i0, i1)
  }

  static make<R, E, A>(fx: Fx<unknown, unknown, unknown>, operator: EffectOperator): Fx<R, E, A> {
    if (fx instanceof Transformer) {
      return new TransformerEffect(fx.i0, fuseEffectOperators(liftSyncOperator(fx.i1), operator))
    } else if (fx instanceof TransformerEffect) {
      // All EffectOperators can be fused together
      return new TransformerEffect(fx.i0, fuseEffectOperators(fx.i1, operator))
    } else {
      return new TransformerEffect<R, E, A>(fx, operator)
    }
  }
}

export class TransformerCauseEffect<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "TransformerCauseEffect"

  constructor(
    readonly i0: Fx<unknown, unknown, unknown>,
    readonly i1: EffectOperator
  ) {
    super(i0, i1)
  }

  static make<R, E, A>(fx: Fx<unknown, unknown, unknown>, operator: EffectOperator): Fx<R, E, A> {
    if (fx instanceof TransformerCause) {
      return new TransformerCauseEffect(fx.i0, fuseEffectOperators(liftSyncOperator(fx.i1), operator))
    } else if (fx instanceof TransformerCauseEffect) {
      // All EffectOperators can be fused together
      return new TransformerCauseEffect(fx.i0, fuseEffectOperators(fx.i1, operator))
    } else {
      return new TransformerCauseEffect<R, E, A>(fx, operator)
    }
  }
}

export abstract class ToFx<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "ToFx"

  /**
   * Convert this primitive to an Fx
   * @since 1.18.0
   */
  protected abstract toFx(): Fx<R, E, A>

  private _fx: Fx<R, E, A> | undefined

  /**
   * Get the Fx that this primitive represents.
   * @since 1.18.0
   */
  get fx(): Fx<R, E, A> {
    return (this._fx ||= this.toFx())
  }
}
