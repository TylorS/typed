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
import type { Provide } from "@typed/fx/internal/provide"
import type * as Sink from "@typed/fx/internal/sink"
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
  | AcquireUseRelease<any, any, any, any, any, any, any, any>
  | Combine<any, any, any>
  | Commit<any, any, any>
  | Empty
  | Fail<any>
  | FromIterable<any>
  | FromEffect<any, any, any>
  | FromScheduled<any, any, any, any>
  | FromSink<any, any, any>
  | Merge<any, any, any>
  | Never
  | Race<any, any, any>
  | Succeed<any>
  | Suspend<any, any, any>
  | Sync<any>

export type ControlFlow =
  | FlatMap<any, any, any, any, any, any>
  | FlatMapCause<any, any, any, any, any, any>
  | MatchCause<any, any, any, any, any, any, any, any, any>
  | ContinueWith<any, any, any, any, any, any>
  | RecoverWith<any, any, any, any, any, any>
  | Share<any, any, any, any>
  | During<any, any, any, any, any, any, any, any>
  | TakeWhile<any, any, any, any, any>
  | DropWhile<any, any, any, any, any>
  | DropAfter<any, any, any, any, any>

export type Operator =
  | Transformer<any, any, any>
  | TransformerEffect<any, any, any>
  | Loop<any, any, any, any, any>
  | LoopEffect<any, any, any, any, any, any, any>
  | Snapshot<any, any, any, any, any, any, any, any, any>
  | Middleware<any, any, any, any>

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
    readonly i1: Provide<R2, E2, B>
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

export function matchFxPrimitive<R, E, A, B, C, D, F, G, H, I>(
  fx: Fx<R, E, A>,
  matchers: {
    readonly Constructor: (fx: Fx<R, E, A> & Constructor) => B
    readonly ControlFlow: (fx: Fx<R, E, A> & ControlFlow) => C
    readonly Operator: (fx: Fx<R, E, A> & Operator) => D
    readonly Provide: (fx: Fx<R, E, A> & FxProvide<any, any, any, any, any, any>) => F
    readonly Effect: (effect: Effect.Effect<R, E, A>) => G
    readonly Cause: (cause: Cause.Cause<E>) => H
    readonly Iterable: (iterable: Iterable<A>) => I
  }
): B | C | D | F | G | H | I {
  if (TypeId in fx) {
    if (ConstructorTypeId in fx) {
      return matchers.Constructor(fx as Fx<R, E, A> & Constructor)
    } else if (ControlFlowTypeId in fx) {
      return matchers.ControlFlow(fx as Fx<R, E, A> & ControlFlow)
    } else if (OperatorTypeId in fx) {
      return matchers.Operator(fx as Fx<R, E, A> & Operator)
    } else {
      return matchers.Provide(fx as Fx<R, E, A> & FxProvide<any, any, any, any, any, any>)
    }
  } else if (Effect.EffectTypeId in fx) {
    return matchers.Effect(fx as any)
  } else if (Cause.CauseTypeId in fx) {
    return matchers.Cause(fx as any)
  } else {
    return matchers.Iterable(fx as any)
  }
}

export function matchFxConstructor<R, E, A, B, C, D, F, G, H, I, J, K, L, M, N, O, P, Q>(
  fx: Fx<R, E, A> & Constructor,
  matchers: {
    readonly AcquireUseRelease: (
      fx: AcquireUseRelease<any, any, any, any, any, any, any, any>
    ) => B
    readonly Combine: (fx: Combine<any, any, any>) => C
    readonly Commit: (fx: Commit<any, any, any>) => D
    readonly Empty: (fx: Empty) => F
    readonly Fail: (fx: Fail<any>) => G
    readonly FromEffect: (fx: FromEffect<any, any, any>) => H
    readonly FromScheduled: (fx: FromScheduled<any, any, any, any>) => I
    readonly FromSink: (fx: FromSink<any, any, any>) => J
    readonly Merge: (fx: Merge<any, any, any>) => K
    readonly Never: (fx: Never) => L
    readonly Race: (fx: Race<any, any, any>) => M
    readonly Succeed: (fx: Succeed<any>) => N
    readonly Suspend: (fx: Suspend<any, any, any>) => O
    readonly Sync: (fx: Sync<any>) => P
    readonly FromIterable: (fx: FromIterable<any>) => Q
  }
): B | C | D | F | G | H | I | J | K | L | M | N | O | P | Q {
  switch (fx._tag) {
    case "Fx/AcquireUseRelease":
      return matchers.AcquireUseRelease(fx)
    case "Fx/Combine":
      return matchers.Combine(fx)
    case "Fx/Commit":
      return matchers.Commit(fx)
    case "Fx/Empty":
      return matchers.Empty(fx)
    case "Fx/Fail":
      return matchers.Fail(fx)
    case "Fx/FromEffect":
      return matchers.FromEffect(fx)
    case "Fx/FromScheduled":
      return matchers.FromScheduled(fx)
    case "Fx/FromSink":
      return matchers.FromSink(fx)
    case "Fx/Merge":
      return matchers.Merge(fx)
    case "Fx/Never":
      return matchers.Never(fx)
    case "Fx/Race":
      return matchers.Race(fx)
    case "Fx/Succeed":
      return matchers.Succeed(fx)
    case "Fx/Suspend":
      return matchers.Suspend(fx)
    case "Fx/Sync":
      return matchers.Sync(fx)
    case "Fx/FromIterable":
      return matchers.FromIterable(fx)
  }
}

export function matchFxControlFlow<R, E, A, B, C, D, F, G, H, I, J, K, L>(
  fx: Fx<R, E, A> & ControlFlow,
  matchers: {
    readonly FlatMap: (fx: FlatMap<any, any, any, any, any, any>) => B
    readonly FlatMapCause: (fx: FlatMapCause<any, any, any, any, any, any>) => C
    readonly MatchCause: (fx: MatchCause<any, any, any, any, any, any, any, any, any>) => D
    readonly ContinueWith: (fx: ContinueWith<any, any, any, any, any, any>) => F
    readonly RecoverWith: (fx: RecoverWith<any, any, any, any, any, any>) => G
    readonly Share: (fx: Share<any, any, any, any>) => H
    readonly During: (fx: During<any, any, any, any, any, any, any, any>) => I
    readonly TakeWhile: (fx: TakeWhile<any, any, any, any, any>) => J
    readonly DropWhile: (fx: DropWhile<any, any, any, any, any>) => K
    readonly DropAfter: (fx: DropAfter<any, any, any, any, any>) => L
  }
): B | C | D | F | G | H | I | J | K | L {
  switch (fx._tag) {
    case "Fx/FlatMap":
      return matchers.FlatMap(fx)
    case "Fx/FlatMapCause":
      return matchers.FlatMapCause(fx)
    case "Fx/MatchCause":
      return matchers.MatchCause(fx)
    case "Fx/ContinueWith":
      return matchers.ContinueWith(fx)
    case "Fx/RecoverWith":
      return matchers.RecoverWith(fx)
    case "Fx/Share":
      return matchers.Share(fx)
    case "Fx/During":
      return matchers.During(fx)
    case "Fx/TakeWhile":
      return matchers.TakeWhile(fx)
    case "Fx/DropWhile":
      return matchers.DropWhile(fx)
    case "Fx/DropAfter":
      return matchers.DropAfter(fx)
  }
}

export function matchFxOperator<R, E, A, B, C, D, F, G, H>(
  fx: Fx<R, E, A> & Operator,
  matchers: {
    readonly Transformer: (fx: Transformer<any, any, any>) => B
    readonly TransfomerEffect: (fx: TransformerEffect<any, any, any>) => C
    readonly Loop: (fx: Loop<any, any, any, any, any>) => D
    readonly LoopEffect: (fx: LoopEffect<any, any, any, any, any, any, any>) => F
    readonly Snapshot: (fx: Snapshot<any, any, any, any, any, any, any, any, any>) => G
    readonly Middleware: (fx: Middleware<any, any, any, any>) => H
  }
): B | C | D | F | G | H {
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
