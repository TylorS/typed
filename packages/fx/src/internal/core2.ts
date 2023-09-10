import * as Chunk from "@effect/data/Chunk"
import * as Equal from "@effect/data/Equal"
import { identity } from "@effect/data/Function"
import * as Hash from "@effect/data/Hash"
import { type Pipeable, pipeArguments } from "@effect/data/Pipeable"
import * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import type * as Exit from "@effect/io/Exit"
import type * as Schedule from "@effect/io/Schedule"
import { type EffectOperator, fuseEffectOperators, liftSyncOperator } from "@typed/fx/internal/effect-operator"
import { applyFusionDecision } from "@typed/fx/internal/fusion"
import * as provide from "@typed/fx/internal/provide"
import * as Sink from "@typed/fx/internal/sink"
import type * as strategies from "@typed/fx/internal/strategies"
import { fuseSyncOperators, type SyncOperator } from "@typed/fx/internal/sync-operator"

export const TypeId = Symbol.for("@typed/Fx/TypeId")
export type TypeId = typeof TypeId

export const ConstructorTypeId = Symbol.for("@typed/Fx/ConstructorTypeId")
export type ConstructorTypeId = typeof ConstructorTypeId

export const ControlFlowTypeId = Symbol.for("@typed/Fx/ControlFlowTypeId")
export type ControlFlowTypeId = typeof ControlFlowTypeId

export const OperatorTypeId = Symbol.for("@typed/Fx/OperatorTypeId")
export type OperatorTypeId = typeof OperatorTypeId

export const ProvideTypeId = Symbol.for("@typed/Fx/ProvideTypeId")
export type ProvideTypeId = typeof ProvideTypeId

// TODO: FilterMapLoop + FilterMapLoopEffect
// TODO:

export interface Fx<R, E, A> extends Fx.Variance<R, E, A>, Pipeable {}

export interface Subject<E, A> extends Fx<never, E, A>, Sink.Sink<E, A> {}

const Variance: Fx<any, any, any>[TypeId] = {
  _R: identity,
  _E: identity,
  _A: identity
}

export abstract class FxProto<R, E, A> implements Fx<R, E, A> {
  abstract readonly _tag: string
  readonly [TypeId]: Fx<R, E, A>[TypeId] = Variance

  constructor(
    readonly i0?: unknown,
    readonly i1?: unknown,
    readonly i2?: unknown
  ) {
  }

  [Equal.symbol](that: unknown) {
    return this === that
  }
  [Hash.symbol]() {
    return Hash.random(this)
  }

  pipe() {
    return pipeArguments(this, arguments)
  }
}

export abstract class FxConstructorProto<R, E, A> extends FxProto<R, E, A> {
  readonly [ConstructorTypeId]: ConstructorTypeId = ConstructorTypeId
}

export abstract class FxControlFlowProto<R, E, A> extends FxProto<R, E, A> {
  readonly [ControlFlowTypeId]: ControlFlowTypeId = ControlFlowTypeId
}

export abstract class FxOperatorProto<R, E, A> extends FxProto<R, E, A> {
  readonly [OperatorTypeId]: OperatorTypeId = OperatorTypeId
}

export namespace Fx {
  export interface Variance<R, E, A> {
    readonly [TypeId]: {
      readonly _R: (_: never) => R
      readonly _E: (_: never) => E
      readonly _A: (_: never) => A
    }
  }
}

export type Primitive = Constructor | ControlFlow | Operator | FxProvide<any, any, any, any, any, any>

export type Constructor =
  | AcquireUseRelease<unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown>
  | Combine<unknown, unknown, unknown>
  | Commit<unknown, unknown, unknown>
  | Empty
  | Fail<unknown>
  | FromIterable<unknown>
  | FromEffect<unknown, unknown, unknown>
  | FromScheduled<unknown, unknown, unknown, unknown>
  | FromSink<unknown, unknown, unknown>
  | Merge<unknown, unknown, unknown>
  | Never
  | Race<unknown, unknown, unknown>
  | Succeed<unknown>
  | Suspend<unknown, unknown, unknown>
  | Sync<unknown>

export type ControlFlow =
  | FlatMap<unknown, unknown, unknown, unknown, unknown, unknown>
  | FlatMapCause<unknown, unknown, unknown, unknown, unknown, unknown>
  | MatchCause<unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown>
  | ContinueWith<unknown, unknown, unknown, unknown, unknown, unknown>
  | RecoverWith<unknown, unknown, unknown, unknown, unknown, unknown>
  | Share<unknown, unknown, unknown, unknown>
  | During<unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown>
  | TakeWhile<unknown, unknown, unknown, unknown, unknown>
  | DropWhile<unknown, unknown, unknown, unknown, unknown>
  | DropAfter<unknown, unknown, unknown, unknown, unknown>

export type Operator =
  | Transformer<unknown, unknown, unknown>
  | TransformerEffect<unknown, unknown, unknown>
  | Loop<unknown, unknown, unknown, unknown, unknown>
  | LoopEffect<unknown, unknown, unknown, unknown, unknown, unknown, unknown>
  | Snapshot<unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown>
  | Middleware<unknown, unknown, unknown, unknown>

export class AcquireUseRelease<R, E, A, R1, E1, A1, R2, E2> extends FxConstructorProto<R | R1 | R2, E | E1 | E2, A1> {
  readonly _tag = "Fx/AcquireUseRelease"

  constructor(
    readonly i0: Effect.Effect<R, E, A>,
    readonly i1: (a: A) => Fx<R1, E1, A1>,
    readonly i2: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R2, E2, unknown>
  ) {
    super(i0, i1, i2)
  }
}

export class Combine<R, E, A> extends FxConstructorProto<R, E, A> {
  readonly _tag = "Fx/Combine"

  constructor(readonly i0: Array<Fx<R, E, A>>) {
    super(i0)
  }
}

export abstract class Commit<R, E, A> extends FxConstructorProto<R, E, A> {
  readonly _tag = "Fx/Commit"

  abstract commit(): Fx<R, E, A>
}

export class Empty extends FxConstructorProto<never, never, never> {
  readonly _tag = "Fx/Empty"
}

export class Fail<E> extends FxConstructorProto<never, E, never> {
  readonly _tag = "Fx/Fail"

  constructor(readonly i0: Cause.Cause<E>) {
    super(i0)
  }
}

export class FromIterable<A> extends FxConstructorProto<never, never, A> {
  readonly _tag = "Fx/FromIterable"

  constructor(readonly i0: Iterable<A>) {
    super(i0)
  }
}

export class FromEffect<R, E, A> extends FxConstructorProto<R, E, A> {
  readonly _tag = "Fx/FromEffect"

  constructor(readonly i0: Effect.Effect<R, E, A>) {
    super(i0)
  }
}

export class FromScheduled<R, E, A, R1> extends FxConstructorProto<R | R1, E, A> {
  readonly _tag = "Fx/FromScheduled"

  constructor(
    readonly i0: Effect.Effect<R, E, A>,
    readonly i1: Schedule.Schedule<R1, unknown, unknown>
  ) {
    super(i0, i1)
  }
}

export class FromSink<R, E, A> extends FxConstructorProto<R, E, A> {
  readonly _tag = "Fx/FromSink"

  constructor(readonly i0: (sink: Sink.Sink<E, A>) => Effect.Effect<R, never, unknown>) {
    super(i0)
  }
}

export class Merge<R, E, A> extends FxConstructorProto<R, E, A> {
  readonly _tag = "Fx/Merge"

  constructor(readonly i0: Array<Fx<R, E, A>>, readonly i1: strategies.MergeStrategy) {
    super(i0, i1)
  }
}

export class Never extends FxConstructorProto<never, never, never> {
  readonly _tag = "Fx/Never"
}

export class Race<R, E, A> extends FxConstructorProto<R, E, A> {
  readonly _tag = "Fx/Race"

  constructor(readonly i0: Array<Fx<R, E, A>>) {
    super(i0)
  }
}

export class Succeed<A> extends FxConstructorProto<never, never, A> {
  readonly _tag = "Fx/Succeed"

  constructor(readonly i0: A) {
    super(i0)
  }
}

export class Sync<A> extends FxConstructorProto<never, never, A> {
  readonly _tag = "Fx/Sync"

  constructor(readonly i0: () => A) {
    super(i0)
  }
}

export class Suspend<R, E, A> extends FxConstructorProto<R, E, A> {
  readonly _tag = "Fx/Suspend"

  constructor(readonly i0: () => Fx<R, E, A>) {
    super(i0)
  }
}

export class FlatMap<R, E, A, R1, E1, A1> extends FxControlFlowProto<R | R1, E | E1, A1> {
  readonly _tag = "Fx/FlatMap"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (a: A) => Fx<R1, E1, A1>,
    readonly i2: strategies.FlattenStrategy
  ) {
    super(i0, i1, i2)
  }
}

export class FlatMapCause<R, E, A, R1, E1, A1> extends FxControlFlowProto<R | R1, E1, A | A1> {
  readonly _tag = "Fx/FlatMapCause"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (cause: Cause.Cause<E>) => Fx<R1, E1, A1>,
    readonly i2: strategies.FlattenStrategy
  ) {
    super(i0, i1, i2)
  }
}

export class MatchCause<R, E, A, R1, E1, A1, R2, E2, A2> extends FxControlFlowProto<R | R1 | R2, E1 | E2, A1 | A2> {
  readonly _tag = "Fx/MatchCause"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (cause: Cause.Cause<E>) => Fx<R1, E1, A1>,
    readonly i2: (a: A) => Fx<R2, E2, A2>
  ) {
    super(i0, i1, i2)
  }
}

export class ContinueWith<R, E, A, R1, E1, A1> extends FxControlFlowProto<R | R1, E | E1, A1> {
  readonly _tag = "Fx/ContinueWith"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: () => Fx<R1, E1, A1>
  ) {
    super(i0, i1)
  }
}

export class RecoverWith<R, E, A, R1, E1, A1> extends FxControlFlowProto<R | R1, E1, A | A1> {
  readonly _tag = "Fx/RecoverWith"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (cause: Cause.Cause<E>) => Fx<R1, E1, A1>
  ) {
    super(i0, i1)
  }
}

export class Share<R, E, A, R2> extends FxControlFlowProto<R | R2, E, A> {
  readonly _tag = "Fx/Share"

  // All sharing is backed by a Subject which handles all behaviors for
  // downstream consumers
  constructor(readonly i0: Fx<R, E, A>, readonly i1: Effect.Effect<R2, never, Subject<E, A>>) {
    super(i0, i1)
  }
}

export class During<R, E, A, R1, E1, R2, E2, A2> extends FxControlFlowProto<R | R1 | R2, E | E1 | E2, A> {
  readonly _tag = "Fx/During"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: Fx<R1, E1, Fx<R2, E2, A2>>
  ) {
    super(i0, i1)
  }
}

export class TakeWhile<R, E, A, R1, E1> extends FxControlFlowProto<R | R1, E | E1, A> {
  readonly _tag = "Fx/TakeWhile"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (a: A) => Effect.Effect<R1, E1, boolean>
  ) {
    super(i0, i1)
  }
}

export class DropWhile<R, E, A, R1, E1> extends FxControlFlowProto<R | R1, E | E1, A> {
  readonly _tag = "Fx/DropWhile"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (a: A) => Effect.Effect<R1, E1, boolean>
  ) {
    super(i0, i1)
  }
}

export class DropAfter<R, E, A, R1, E1> extends FxControlFlowProto<R | R1, E | E1, A> {
  readonly _tag = "Fx/DropAfter"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (a: A) => Effect.Effect<R1, E1, boolean>
  ) {
    super(i0, i1)
  }
}

export class Transformer<R, E, A> extends FxOperatorProto<R, E, A> {
  readonly _tag = "Fx/Transformer"

  constructor(
    readonly i0: Fx<unknown, unknown, unknown>,
    readonly i1: Chunk.NonEmptyChunk<SyncOperator>
  ) {
    super(i0, i1)
  }

  static make<R, E, A>(fx: Fx<unknown, unknown, unknown>, operator: SyncOperator): Fx<R, E, A> {
    if (fx instanceof Transformer) {
      return new Transformer(fx.i0, applyFusionDecision(fx.i1, operator, fuseSyncOperators))
    } else {
      return new Transformer<R, E, A>(fx, Chunk.of(operator))
    }
  }
}

export class TransformerEffect<R, E, A> extends FxOperatorProto<R, E, A> {
  readonly _tag = "Fx/TransformerEffect"

  constructor(
    readonly i0: Fx<unknown, unknown, unknown>,
    readonly i1: EffectOperator
  ) {
    super(i0, i1)
  }

  static make<R, E, A>(fx: Fx<unknown, unknown, unknown>, operator: EffectOperator): Fx<R, E, A> {
    if (fx instanceof Transformer) {
      const size = Chunk.size(fx.i1)

      // All operators besides slice can be fused into a single operator and will get lifted safely
      if (size === 1) {
        const syncOperator = Chunk.unsafeLast(fx.i1)

        // Slice does not convert to an EffectOperator
        if (syncOperator._tag !== "Slice") {
          return new TransformerEffect(fx.i0, fuseEffectOperators(liftSyncOperator(syncOperator), operator))
        }
      }

      return new TransformerEffect<R, E, A>(fx, operator)
    } else if (fx instanceof TransformerEffect) {
      // All EffectOperators can be fused together
      return new TransformerEffect(fx.i0, fuseEffectOperators(fx.i1, operator))
    } else {
      return new TransformerEffect<R, E, A>(fx, operator)
    }
  }
}

export class Loop<R, E, A, B, C> extends FxOperatorProto<R, E, C> {
  readonly _tag = "Fx/Loop"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (a: A) => readonly [C, B],
    readonly i2: B
  ) {
    super(i0, i1, i2)
  }
}

export class LoopEffect<R, E, A, R2, E2, B, C> extends FxOperatorProto<R | R2, E | E2, C> {
  readonly _tag = "Fx/LoopEffect"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (b: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>,
    readonly i2: B
  ) {
    super(i0, i1, i2)
  }
}

export class FxProvide<R, E, A, R2, E2, B> extends FxProto<Exclude<R, B> | R2, E | E2, A> {
  readonly _tag = "Fx/Provide"
  readonly [ProvideTypeId]: ProvideTypeId = ProvideTypeId

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: provide.Provide<R2, E2, B>
  ) {
    super(i0, i1)
  }
}

export class Snapshot<R, E, A, R2, E2, B, R3, E3, C> extends FxOperatorProto<R | R2 | R2, E | E2 | E3, C> {
  readonly _tag = "Fx/Snapshot"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: Fx<R2, E2, B>,
    readonly i2: (a: A, b: B) => Effect.Effect<R3, E3, C>
  ) {
    super(i0, i1, i2)
  }
}

export class Middleware<R, R2, E, A> extends FxOperatorProto<R2, E, A> {
  readonly _tag = "Fx/Middleware"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (effect: Effect.Effect<R, never, unknown>) => Effect.Effect<R2, never, unknown>
  ) {
    super(i0, i1)
  }
}

export function matchFxPrimitive<R, E, A, B>(
  fx: Fx<R, E, A>,
  matchers: {
    readonly Constructor: (fx: Fx<R, E, A> & Constructor) => B
    readonly ControlFlow: (fx: Fx<R, E, A> & ControlFlow) => B
    readonly Operator: (fx: Fx<R, E, A> & Operator) => B
    readonly Provide: (fx: Fx<R, E, A> & FxProvide<unknown, unknown, unknown, unknown, unknown, unknown>) => B
    readonly Effect: (effect: Effect.Effect<R, E, A>) => B
    readonly Cause: (cause: Cause.Cause<E>) => B
    readonly Iterable: (iterable: Iterable<A>) => B
  }
): B {
  if (TypeId in fx) {
    if (ConstructorTypeId in fx) {
      return matchers.Constructor(fx as Fx<R, E, A> & Constructor)
    } else if (ControlFlowTypeId in fx) {
      return matchers.ControlFlow(fx as Fx<R, E, A> & ControlFlow)
    } else if (OperatorTypeId in fx) {
      return matchers.Operator(fx as Fx<R, E, A> & Operator)
    } else {
      return matchers.Provide(fx as Fx<R, E, A> & FxProvide<unknown, unknown, unknown, unknown, unknown, unknown>)
    }
  } else if (Effect.EffectTypeId in fx) {
    return matchers.Effect(fx as any)
  } else if (Cause.CauseTypeId in fx) {
    return matchers.Cause(fx as any)
  } else {
    return matchers.Iterable(fx as any)
  }
}

export function matchFxConstructor<R, E, A>(
  fx: Fx<R, E, A> & Constructor
) {
  return <B, C, D, F, G, H, I, J, K, L, M, N, O, P, Q>(
    matchers: {
      readonly AcquireUseRelease: (
        fx: AcquireUseRelease<R, E, any, R, E, A, R, E>
      ) => B
      readonly Combine: (fx: Combine<R, E, A>) => C
      readonly Commit: (fx: Commit<R, E, A>) => D
      readonly Empty: (fx: Empty) => F
      readonly Fail: (fx: Fail<E>) => G
      readonly FromEffect: (fx: FromEffect<R, E, A>) => H
      readonly FromScheduled: (fx: FromScheduled<R, E, A, R>) => I
      readonly FromSink: (fx: FromSink<R, E, A>) => J
      readonly Merge: (fx: Merge<R, E, A>) => K
      readonly Never: (fx: Never) => L
      readonly Race: (fx: Race<R, E, A>) => M
      readonly Succeed: (fx: Succeed<A>) => N
      readonly Suspend: (fx: Suspend<R, E, A>) => O
      readonly Sync: (fx: Sync<A>) => P
      readonly FromIterable: (fx: FromIterable<A>) => Q
    }
  ): B | C | D | F | G | H | I | J | K | L | M | N | O | P | Q => {
    switch (fx._tag) {
      case "Fx/AcquireUseRelease":
        return matchers.AcquireUseRelease(fx as AcquireUseRelease<R, E, any, R, E, A, R, E>)
      case "Fx/Combine":
        return matchers.Combine(fx as Combine<R, E, A>)
      case "Fx/Commit":
        return matchers.Commit(fx as Commit<R, E, A>)
      case "Fx/Empty":
        return matchers.Empty(fx)
      case "Fx/Fail":
        return matchers.Fail(fx as Fail<E>)
      case "Fx/FromEffect":
        return matchers.FromEffect(fx as FromEffect<R, E, A>)
      case "Fx/FromScheduled":
        return matchers.FromScheduled(fx as FromScheduled<R, E, A, R>)
      case "Fx/FromSink":
        return matchers.FromSink(fx as FromSink<R, E, A>)
      case "Fx/Merge":
        return matchers.Merge(fx as Merge<R, E, A>)
      case "Fx/Never":
        return matchers.Never(fx as Never)
      case "Fx/Race":
        return matchers.Race(fx as Race<R, E, A>)
      case "Fx/Succeed":
        return matchers.Succeed(fx as Succeed<A>)
      case "Fx/Suspend":
        return matchers.Suspend(fx as Suspend<R, E, A>)
      case "Fx/Sync":
        return matchers.Sync(fx as Sync<A>)
      case "Fx/FromIterable":
        return matchers.FromIterable(fx as FromIterable<A>)
    }
  }
}

export function matchFxControlFlow<R, E, A>(fx: Fx<R, E, A> & ControlFlow) {
  return <B, C, D, F, G, H, I, J, K, L>(
    matchers: {
      readonly FlatMap: (fx: FlatMap<R, E, any, R, E, A>) => B
      readonly FlatMapCause: (fx: FlatMapCause<R, any, A, R, E, A>) => C
      readonly MatchCause: (
        fx: MatchCause<R, any, any, R, E, A, R, E, A>
      ) => D
      readonly ContinueWith: (fx: ContinueWith<R, E, A, R, E, A>) => F
      readonly RecoverWith: (fx: RecoverWith<R, any, A, R, E, A>) => G
      readonly Share: (fx: Share<R, E, A, R>) => H
      readonly During: (fx: During<R, E, A, R, E, R, E, any>) => I
      readonly TakeWhile: (fx: TakeWhile<R, E, A, R, E>) => J
      readonly DropWhile: (fx: DropWhile<R, E, A, R, E>) => K
      readonly DropAfter: (fx: DropAfter<R, E, A, R, E>) => L
    }
  ): B | C | D | F | G | H | I | J | K | L => {
    switch (fx._tag) {
      case "Fx/FlatMap":
        return matchers.FlatMap(fx as FlatMap<R, E, any, R, E, A>)
      case "Fx/FlatMapCause":
        return matchers.FlatMapCause(fx as FlatMapCause<R, any, A, R, E, A>)
      case "Fx/MatchCause":
        return matchers.MatchCause(fx as MatchCause<R, any, any, R, E, A, R, E, A>)
      case "Fx/ContinueWith":
        return matchers.ContinueWith(fx as ContinueWith<R, E, A, R, E, A>)
      case "Fx/RecoverWith":
        return matchers.RecoverWith(fx as RecoverWith<R, any, A, R, E, A>)
      case "Fx/Share":
        return matchers.Share(fx as Share<R, E, A, R>)
      case "Fx/During":
        return matchers.During(fx as During<R, E, A, R, E, R, E, any>)
      case "Fx/TakeWhile":
        return matchers.TakeWhile(fx as TakeWhile<R, E, A, R, E>)
      case "Fx/DropWhile":
        return matchers.DropWhile(fx as DropWhile<R, E, A, R, E>)
      case "Fx/DropAfter":
        return matchers.DropAfter(fx as DropAfter<R, E, A, R, E>)
    }
  }
}

export function matchFxOperator<R, E, A>(fx: Fx<R, E, A> & Operator) {
  return <B, C, D, F, G, H>(
    matchers: {
      readonly Transformer: (fx: Fx<R, E, A> & Transformer<R, E, A>) => B
      readonly TransfomerEffect: (fx: Fx<R, E, A> & TransformerEffect<R, E, A>) => C
      readonly Loop: (fx: Fx<R, E, A> & Loop<unknown, unknown, unknown, unknown, unknown>) => D
      readonly LoopEffect: (
        fx: Fx<R, E, A> & LoopEffect<unknown, unknown, unknown, unknown, unknown, unknown, unknown>
      ) => F
      readonly Snapshot: (
        fx: Fx<R, E, A> & Snapshot<unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown>
      ) => G
      readonly Middleware: (
        fx: Fx<R, E, A> & Middleware<unknown, unknown, unknown, unknown>
      ) => H
    }
  ): B | C | D | F | G | H => {
    switch (fx._tag) {
      case "Fx/Transformer":
        return matchers.Transformer(fx)
      case "Fx/TransformerEffect":
        return matchers.TransfomerEffect(fx)
      case "Fx/Loop":
        return matchers.Loop(fx)
      case "Fx/LoopEffect":
        return matchers.LoopEffect(fx)
      case "Fx/Snapshot":
        return matchers.Snapshot(fx)
      case "Fx/Middleware":
        return matchers.Middleware(fx)
    }
  }
}
export function run<R, E, A, R2>(
  fx: Fx<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, E, unknown> {
  return matchFxPrimitive(fx, {
    Constructor: (fx) => runConstructor<R, E, A, R2>(fx, sink),
    ControlFlow: (fx) => runControlFlow<R, E, A, R2>(fx, sink),
    Operator: (fx) => runOperator<R, E, A, R2>(fx, sink),
    Provide: (fx) => runProvide<R, E, A, R2>(fx, sink),
    Effect: (effect) => runEffect<R, E, A, R2>(effect, sink),
    Cause: (cause) => sink.onFailure(cause),
    Iterable: (iterable) => Effect.forEach(iterable, sink.onSuccess)
  })
}

const notImplementedYet = Effect.fail("Not Implemented" as never)

export function runConstructor<R, E, A, R2>(
  fx: Fx<R, E, A> & Constructor,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, E, unknown> {
  return matchFxConstructor<R, E, A>(fx)({
    AcquireUseRelease: (fx) =>
      Effect.acquireUseRelease(
        fx.i0,
        (a) => run(fx.i1(a), sink),
        (a, exit) => Effect.catchAllCause(fx.i2(a, exit), sink.onFailure)
      ),
    Combine: () => notImplementedYet,
    Commit: (fx) => run(fx.commit(), sink),
    Empty: () => Effect.unit,
    Fail: (fx) => sink.onFailure(fx.i0),
    FromEffect: (fx) => fx.i0,
    FromScheduled: (fx) => Effect.repeat(Effect.matchCauseEffect(fx.i0, sink), fx.i1),
    FromSink: (fx) => Effect.contextWithEffect((ctx) => fx.i0(Sink.provide(sink, ctx))),
    Merge: (fx) => {
      // TODO: Manage strategies properly
      switch (fx.i1._tag) {
        case "Ordered":
        case "Switch":
        default:
          return Effect.all(fx.i0.map((fx) => run(fx, sink)), { concurrency: "unbounded" })
      }
    },
    Never: () => Effect.never,
    Race: () => notImplementedYet,
    Succeed: (fx) => sink.onSuccess(fx.i0),
    Suspend: (fx) => run(fx.i0(), sink),
    Sync: (fx) => sink.onSuccess(fx.i0()),
    FromIterable: (fx) => Effect.forEach(fx.i0, sink.onSuccess)
  })
}

export function runControlFlow<R, E, A, R2>(
  fx: Fx<R, E, A> & ControlFlow,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, E, unknown> {
  return matchFxControlFlow<R, E, A>(fx)({
    FlatMap: () => notImplementedYet,
    FlatMapCause: () => notImplementedYet,
    MatchCause: () => notImplementedYet,
    ContinueWith: () => notImplementedYet,
    RecoverWith: () => notImplementedYet,
    Share: () => notImplementedYet,
    During: () => notImplementedYet,
    TakeWhile: () => notImplementedYet,
    DropWhile: () => notImplementedYet,
    DropAfter: () => notImplementedYet
  })
}

export function runOperator<R, E, A, R2>(
  fx: Fx<R, E, A> & Operator,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, E, unknown> {
  return matchFxOperator<R, E, A>(fx)({
    Transformer: (transformer) => runTransformer(transformer, sink),
    TransfomerEffect: () => notImplementedYet,
    Loop: () => notImplementedYet,
    LoopEffect: () => notImplementedYet,
    Snapshot: () => notImplementedYet,
    Middleware: () => notImplementedYet
  })
}

export function runTransformer<R, E, A, R2>(
  fx: Fx<R, E, A> & Transformer<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, E, unknown> {
  return Effect.gen(function*(_) {
    // TODO: Implement
  })
}

export function runProvide<R, E, A, R2>(
  fx: Fx<R, E, A> & FxProvide<any, any, any, any, any, any>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, E, unknown> {
  return provide.provideToEffect(run(fx.i0, sink), fx.i1)
}

export function runEffect<R, E, A, R2>(
  effect: Effect.Effect<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, E, unknown> {
  return Effect.matchCauseEffect(effect, sink)
}
