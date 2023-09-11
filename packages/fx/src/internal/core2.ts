import "./module-agumentation"

import * as Equal from "@effect/data/Equal"
import { dual, identity } from "@effect/data/Function"
import * as Hash from "@effect/data/Hash"
import * as Option from "@effect/data/Option"
import { type Pipeable, pipeArguments } from "@effect/data/Pipeable"
import * as Cause from "@effect/io/Cause"
import * as Deferred from "@effect/io/Deferred"
import * as Effect from "@effect/io/Effect"
import type * as Exit from "@effect/io/Exit"
import type * as Layer from "@effect/io/Layer"
import * as Ref from "@effect/io/Ref"
import * as SynchronizedRef from "@effect/io/SynchronizedRef"

import * as Schedule from "@effect/io/Schedule"
import { type Context } from "@typed/context"
import {
  compileEffectLoop,
  compileEffectOperatorSink,
  type EffectOperator,
  FilterEffect,
  FilterMapEffect,
  fuseEffectOperators,
  liftSyncOperator,
  MapEffect,
  TapEffect
} from "@typed/fx/internal/effect-operator"
import { withFlattenStrategy, withScopedFork } from "@typed/fx/internal/helpers"
import * as Provide from "@typed/fx/internal/provide"
import * as Sink from "@typed/fx/internal/sink"
import * as strategies from "@typed/fx/internal/strategies"
import {
  compileSyncLoop,
  compileSyncOperatorSink,
  fuseSyncOperators,
  Map,
  type SyncOperator
} from "@typed/fx/internal/sync-operator"

import type { DurationInput } from "@effect/data/Duration"
import { type Bounds, boundsFrom, mergeBounds } from "@typed/fx/internal/bounds"

export const TypeId = Symbol.for("@typed/Fx/TypeId")
export type TypeId = typeof TypeId

const ConstructorTypeId = Symbol.for("@typed/Fx/ConstructorTypeId")
type ConstructorTypeId = typeof ConstructorTypeId

const ControlFlowTypeId = Symbol.for("@typed/Fx/ControlFlowTypeId")
type ControlFlowTypeId = typeof ControlFlowTypeId

const OperatorTypeId = Symbol.for("@typed/Fx/OperatorTypeId")
type OperatorTypeId = typeof OperatorTypeId

const ProvideTypeId = Symbol.for("@typed/Fx/ProvideTypeId")
type ProvideTypeId = typeof ProvideTypeId

// TODO: TransformerCause + TransformerCauseEffect

export interface Fx<R, E, A> extends Fx.Variance<R, E, A>, Pipeable {}

export interface Subject<R, E, A> extends Fx<R, E, A>, Sink.Sink<E, A> {}

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

abstract class FxConstructorProto<R, E, A> extends FxProto<R, E, A> {
  readonly [ConstructorTypeId]: ConstructorTypeId = ConstructorTypeId
}

abstract class FxControlFlowProto<R, E, A> extends FxProto<R, E, A> {
  readonly [ControlFlowTypeId]: ControlFlowTypeId = ControlFlowTypeId
}

abstract class FxOperatorProto<R, E, A> extends FxProto<R, E, A> {
  readonly [OperatorTypeId]: OperatorTypeId = OperatorTypeId
}

export namespace Fx {
  export type Context<T> = T extends Fx<infer R, infer _E, infer _A> ? R : never
  export type Error<T> = T extends Fx<infer _R, infer E, infer _A> ? E : never
  export type Success<T> = T extends Fx<infer _R, infer _E, infer A> ? A : never

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
  | During<unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown>
  | TakeWhile<unknown, unknown, unknown, unknown, unknown>
  | DropWhile<unknown, unknown, unknown, unknown, unknown>
  | DropAfter<unknown, unknown, unknown, unknown, unknown>

export type Operator =
  | Transformer<unknown, unknown, unknown>
  | TransformerEffect<unknown, unknown, unknown>
  | Slice<unknown, unknown, unknown>
  | Loop<unknown, unknown, unknown, unknown, unknown>
  | FilterMapLoop<unknown, unknown, unknown, unknown, unknown>
  | LoopEffect<unknown, unknown, unknown, unknown, unknown, unknown, unknown>
  | FilterMapLoopEffect<unknown, unknown, unknown, unknown, unknown, unknown, unknown>
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

  constructor(readonly i0: ReadonlyArray<Fx<R, E, A[keyof A]>>) {
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

  constructor(readonly i0: ReadonlyArray<Fx<R, E, A>>, readonly i1: strategies.MergeStrategy) {
    super(i0, i1)
  }

  static make<R, E, A>(fx: ReadonlyArray<Fx<R, E, A>>, strategy: strategies.MergeStrategy): Fx<R, E, A> {
    if (fx.length === 0) return new Empty()

    const nonEmptyFx = fx.filter((fx) => !(fx instanceof Empty))

    if (nonEmptyFx.length === 0) return new Empty()
    if (nonEmptyFx.length === 1) return nonEmptyFx[0]

    const neverIndex = nonEmptyFx.findIndex((fx) => fx instanceof Never)

    if (neverIndex === -1) return new Merge(nonEmptyFx, strategy)

    switch (strategy._tag) {
      case "Switch":
      case "Ordered":
        // Will only emit up to the first Never
        return new Merge(nonEmptyFx.slice(0, neverIndex + 1), strategy)
      // No use creating fibers for Fx that don't emit
      case "Unordered":
        return new Merge(nonEmptyFx.filter((fx) => !(fx instanceof Never)), strategy)
    }
  }
}

export class Never extends FxConstructorProto<never, never, never> {
  readonly _tag = "Fx/Never"
}

export class Race<R, E, A> extends FxConstructorProto<R, E, A> {
  readonly _tag = "Fx/Race"

  constructor(readonly i0: ReadonlyArray<Fx<R, E, A>>) {
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
    readonly i2: (a: A) => Fx<R2, E2, A2>,
    readonly i3: strategies.FlattenStrategy
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
    readonly i1: SyncOperator
  ) {
    super(i0, i1)
  }

  static make<R, E, A>(fx: Fx<unknown, unknown, unknown>, operator: SyncOperator): Fx<R, E, A> {
    if (fx instanceof Transformer) {
      return new Transformer(fx.i0, fuseSyncOperators(fx.i1, operator))
    } else {
      return new Transformer<R, E, A>(fx, operator)
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
      return new TransformerEffect(fx.i0, fuseEffectOperators(liftSyncOperator(fx.i1), operator))
    } else if (fx instanceof TransformerEffect) {
      // All EffectOperators can be fused together
      return new TransformerEffect(fx.i0, fuseEffectOperators(fx.i1, operator))
    } else {
      return new TransformerEffect<R, E, A>(fx, operator)
    }
  }
}

export class Slice<R, E, A> extends FxOperatorProto<R, E, A> {
  readonly _tag = "Fx/Slice"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: Bounds
  ) {
    super(i0, i1)
  }

  static make<R, E, A>(fx: Fx<R, E, A>, bounds: Bounds): Fx<R, E, A> {
    if (fx instanceof Slice) {
      return new Slice(fx.i0, mergeBounds(fx.i1, bounds))
    } else if (fx instanceof Transformer && fx.i1._tag === "Map") {
      return new Transformer(Slice.make(fx.i0, bounds), fx.i1)
    } else {
      return new Slice(fx, bounds)
    }
  }
}

export class Loop<R, E, A, B, C> extends FxOperatorProto<R, E, C> {
  readonly _tag = "Fx/Loop"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (b: B, a: A) => readonly [C, B],
    readonly i2: B
  ) {
    super(i0, i1, i2)
  }

  static make<R, E, A, B, C>(fx: Fx<R, E, A>, f: (b: B, a: A) => readonly [C, B], b: B): Fx<R, E, C> {
    if (fx instanceof Transformer) {
      return new FilterMapLoop(fx.i0 as Fx<R, E, any>, compileSyncLoop(fx.i1, f), b)
    } else {
      return new Loop(fx, f, b)
    }
  }
}

export class FilterMapLoop<R, E, A, B, C> extends FxOperatorProto<R, E, C> {
  readonly _tag = "Fx/FilterMapLoop"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (b: B, a: A) => Option.Option<readonly [C, B]>,
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

  static make<R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, A>,
    f: (b: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>,
    b: B
  ): Fx<R | R2, E | E2, C> {
    if (fx instanceof TransformerEffect) {
      return new FilterMapLoopEffect(fx.i0 as Fx<R, E, any>, compileEffectLoop(fx.i1, f), b)
    } else {
      return new LoopEffect(fx, f, b)
    }
  }
}

export class FilterMapLoopEffect<R, E, A, R2, E2, B, C> extends FxOperatorProto<R | R2, E | E2, C> {
  readonly _tag = "Fx/FilterMapLoopEffect"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (b: B, a: A) => Effect.Effect<R2, E2, Option.Option<readonly [C, B]>>,
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
    readonly i1: Provide.Provide<R2, E2, B>
  ) {
    super(i0, i1)
  }

  static make<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    provide: Provide.Provide<R2, E2, B>
  ): Fx<Exclude<R, B> | R2, E | E2, A> {
    if (fx instanceof FxProvide) {
      return new FxProvide(fx.i0, Provide.merge(fx.i1, provide))
    } else {
      return new FxProvide(fx, provide)
    }
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
    readonly i1: (effect: Effect.Effect<R, never, unknown>, sink: Sink.Sink<E, A>) => Effect.Effect<R2, never, unknown>
  ) {
    super(i0, i1)
  }

  static make<R, R2, E, A>(
    fx: Fx<R, E, A>,
    middleware: (effect: Effect.Effect<R, never, unknown>, sink: Sink.Sink<E, A>) => Effect.Effect<R2, never, unknown>
  ): Fx<R2, E, A> {
    if (fx instanceof Middleware) {
      return new Middleware(fx.i0 as Fx<R, E, any>, (effect, sink) => middleware(fx.i1(effect, sink), sink))
    } else {
      return new Middleware(fx, middleware)
    }
  }
}

export function matchFxPrimitive<R, E, A, B>(
  fx: Fx<R, E, A>,
  matchers: {
    readonly Constructor: (fx: Fx<R, E, A> & Constructor) => B
    readonly ControlFlow: (fx: Fx<R, E, A> & ControlFlow) => B
    readonly Operator: (fx: Fx<R, E, A> & Operator) => B
    readonly Provide: (fx: Fx<R, E, A> & FxProvide<any, any, any, any, any, any>) => B
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
  return <B>(
    matchers: {
      readonly AcquireUseRelease: (
        fx: AcquireUseRelease<R, E, any, R, E, A, R, E>
      ) => B
      readonly Combine: (fx: Combine<R, E, A>) => B
      readonly Commit: (fx: Commit<R, E, A>) => B
      readonly Empty: (fx: Empty) => B
      readonly Fail: (fx: Fail<E>) => B
      readonly FromEffect: (fx: FromEffect<R, E, A>) => B
      readonly FromScheduled: (fx: FromScheduled<R, E, A, R>) => B
      readonly FromSink: (fx: FromSink<R, E, A>) => B
      readonly Merge: (fx: Merge<R, E, A>) => B
      readonly Never: (fx: Never) => B
      readonly Race: (fx: Race<R, E, A>) => B
      readonly Succeed: (fx: Succeed<A>) => B
      readonly Suspend: (fx: Suspend<R, E, A>) => B
      readonly Sync: (fx: Sync<A>) => B
      readonly FromIterable: (fx: FromIterable<A>) => B
    }
  ): B => {
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
  return <B>(
    matchers: {
      readonly FlatMap: (fx: FlatMap<R, E, any, R, E, A>) => B
      readonly FlatMapCause: (fx: FlatMapCause<R, any, A, R, E, A>) => B
      readonly MatchCause: (fx: MatchCause<R, any, any, R, E, A, R, E, A>) => B
      readonly ContinueWith: (fx: ContinueWith<R, E, A, R, E, A>) => B
      readonly RecoverWith: (fx: RecoverWith<R, any, A, R, E, A>) => B
      readonly During: (fx: During<R, E, A, R, E, R, E, any>) => B
      readonly TakeWhile: (fx: TakeWhile<R, E, A, R, E>) => B
      readonly DropWhile: (fx: DropWhile<R, E, A, R, E>) => B
      readonly DropAfter: (fx: DropAfter<R, E, A, R, E>) => B
    }
  ): B => {
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
  return <B>(
    matchers: {
      readonly Transformer: (fx: Transformer<R, E, A>) => B
      readonly TransfomerEffect: (fx: TransformerEffect<R, E, A>) => B
      readonly Loop: (fx: Loop<R, E, any, any, A>) => B
      readonly LoopEffect: (fx: LoopEffect<R, E, any, R, E, any, A>) => B
      readonly FilterMapLoop: (fx: FilterMapLoop<R, E, any, any, A>) => B
      readonly FilterMapLoopEffect: (fx: FilterMapLoopEffect<R, E, any, R, E, any, A>) => B
      readonly Snapshot: (fx: Snapshot<R, E, any, R, E, any, R, E, A>) => B
      readonly Middleware: (fx: Middleware<any, R, E, A>) => B
      readonly Slice: (fx: Slice<R, E, A>) => B
    }
  ): B => {
    switch (fx._tag) {
      case "Fx/Transformer":
        return matchers.Transformer(fx)
      case "Fx/TransformerEffect":
        return matchers.TransfomerEffect(fx)
      case "Fx/Loop":
        return matchers.Loop(fx as Loop<R, E, any, any, A>)
      case "Fx/LoopEffect":
        return matchers.LoopEffect(fx as LoopEffect<R, E, any, R, E, any, A>)
      case "Fx/FilterMapLoop":
        return matchers.FilterMapLoop(fx as FilterMapLoop<R, E, any, any, A>)
      case "Fx/FilterMapLoopEffect":
        return matchers.FilterMapLoopEffect(fx as FilterMapLoopEffect<R, E, any, R, E, any, A>)
      case "Fx/Snapshot":
        return matchers.Snapshot(fx as Snapshot<R, E, any, R, E, any, R, E, A>)
      case "Fx/Middleware":
        return matchers.Middleware(fx as Middleware<any, R, E, A>)
      case "Fx/Slice":
        return matchers.Slice(fx as Slice<R, E, A>)
    }
  }
}
export function run<R, E, A, R2>(
  fx: Fx<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return matchFxPrimitive(fx, {
    Constructor: (fx) => runConstructor<R, E, A, R2>(fx, sink),
    ControlFlow: (fx) => runControlFlow<R, E, A, R2>(fx, sink),
    Operator: (fx) => runOperator<R, E, A, R2>(fx, sink),
    Provide: (fx) => runProvide(fx, sink),
    Effect: (effect) => runEffect<R, E, A, R2>(effect, sink),
    Cause: (cause) => sink.onFailure(cause),
    Iterable: (iterable) => Effect.forEach(iterable, sink.onSuccess)
  })
}

const notImplementedYet = Effect.fail("Not Implemented" as never)

export function runConstructor<R, E, A, R2>(
  fx: Fx<R, E, A> & Constructor,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return matchFxConstructor<R, E, A>(fx)<Effect.Effect<R | R2, never, unknown>>({
    AcquireUseRelease: (fx) =>
      Effect.catchAllCause(
        Effect.acquireUseRelease(
          fx.i0,
          (a) => run(fx.i1(a), sink),
          (a, exit) => Effect.catchAllCause(fx.i2(a, exit), sink.onFailure)
        ),
        sink.onFailure
      ),
    Combine: () => notImplementedYet,
    Commit: (fx) => Effect.suspend(() => run(fx.commit(), sink)),
    Empty: () => Effect.unit,
    Fail: (fx) => sink.onFailure(fx.i0),
    FromEffect: (fx) => Effect.matchCauseEffect(fx.i0, sink),
    FromScheduled: (fx) =>
      Effect.catchAllCause(Effect.repeat(Effect.matchCauseEffect(fx.i0, sink), fx.i1), sink.onFailure),
    FromSink: (fx) => Effect.contextWithEffect((ctx: Context<R | R2>) => fx.i0(Sink.provide(sink, ctx))),
    Merge: (fx) => {
      switch (fx.i1._tag) {
        case "Ordered":
          return notImplementedYet
        case "Switch":
          return Effect.all(fx.i0.map((fx) => run(take(fx, 1), sink)), { concurrency: 1 })
        case "Unordered":
          return Effect.all(fx.i0.map((fx) => run(fx, sink)), {
            concurrency: fx.i1.concurrency === Infinity ? "unbounded" : fx.i1.concurrency
          })
      }
    },
    Never: () => Effect.never,
    Race: () => notImplementedYet,
    Succeed: (fx) => sink.onSuccess(fx.i0),
    Suspend: (fx) => Effect.suspend(() => run(fx.i0(), sink)),
    Sync: (fx) => Effect.suspend(() => sink.onSuccess(fx.i0())),
    FromIterable: (fx) => Effect.forEach(fx.i0, sink.onSuccess)
  })
}

export function runControlFlow<R, E, A, R2>(
  fx: Fx<R, E, A> & ControlFlow,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return matchFxControlFlow<R, E, A>(fx)({
    FlatMap: (flatMap) =>
      withFlattenStrategy(flatMap.i2)((fork) =>
        run(flatMap.i0, Sink.WithContext(sink.onFailure, (a) => fork(run(flatMap.i1(a), sink))))
      ),
    FlatMapCause: (flatMapCause) =>
      withFlattenStrategy(flatMapCause.i2)((fork) =>
        run(flatMapCause.i0, Sink.WithContext((cause) => fork(run(flatMapCause.i1(cause), sink)), sink.onSuccess))
      ),
    MatchCause: (matchCause) =>
      withFlattenStrategy(matchCause.i3)((fork) =>
        run(
          matchCause.i0,
          Sink.WithContext(
            (cause) => fork(run(matchCause.i1(cause), sink)),
            (a) => fork(run(matchCause.i2(a), sink))
          )
        )
      ),
    ContinueWith: (continueWith) =>
      Effect.flatMap(run<R, E, A, R2>(continueWith.i0, sink), () => run(continueWith.i1(), sink)),
    RecoverWith: (recoverWith) =>
      Effect.catchAllCause(observe(recoverWith.i0, sink.onSuccess), (cause) => run(recoverWith.i1(cause), sink)),
    During: () => notImplementedYet,
    TakeWhile: () => notImplementedYet,
    DropWhile: () => notImplementedYet,
    DropAfter: () => notImplementedYet
  })
}

export function runOperator<R, E, A, R2>(
  fx: Fx<R, E, A> & Operator,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return matchFxOperator<R, E, A>(fx)({
    Transformer: (transformer) => runTransformer(transformer, sink),
    TransfomerEffect: (transformer) => runTransformerEffect(transformer, sink),
    Loop: (loop) =>
      Effect.suspend(() => {
        let acc = loop.i2

        return run(
          loop.i0,
          Sink.WithContext(
            sink.onFailure,
            (a) => {
              const [c, b] = loop.i1(acc, a)

              acc = b

              return sink.onSuccess(c)
            }
          )
        )
      }),
    LoopEffect: (loop) =>
      SynchronizedRef.make(loop.i2).pipe(
        Effect.flatMap((ref) =>
          run(
            loop.i0,
            Sink.WithContext(sink.onFailure, (a) =>
              SynchronizedRef.updateEffect(ref, (b) =>
                loop.i1(b, a).pipe(
                  Effect.matchCauseEffect({
                    onFailure: sink.onFailure,
                    onSuccess: ([c, b]) => sink.onSuccess(c).pipe(Effect.as(b))
                  })
                )))
          )
        )
      ),
    FilterMapLoop: (loop) =>
      Effect.suspend(() => {
        let acc = loop.i2

        return run(
          loop.i0,
          Sink.WithContext(
            sink.onFailure,
            (a) => {
              const optionCB = loop.i1(acc, a)

              if (Option.isNone(optionCB)) return Effect.unit

              const [c, b] = optionCB.value
              acc = b

              return sink.onSuccess(c)
            }
          )
        )
      }),
    FilterMapLoopEffect: (loop) =>
      Effect.suspend(() => {
        let acc = loop.i2

        return run(
          loop.i0,
          Sink.WithContext(
            sink.onFailure,
            (a) =>
              loop.i1(acc, a).pipe(
                Effect.matchCauseEffect({
                  onFailure: sink.onFailure,
                  onSuccess: (optionCB) => {
                    if (Option.isNone(optionCB)) return Effect.unit

                    const [c, b] = optionCB.value
                    acc = b

                    return sink.onSuccess(c)
                  }
                })
              )
          )
        )
      }),
    Snapshot: (snapshot) =>
      withScopedFork((fork) =>
        Ref.make(Option.none<any>()).pipe(
          Effect.flatMap((ref) =>
            fork(run(
              snapshot.i1,
              Sink.WithContext(
                sink.onFailure,
                (b) => Ref.set(ref, b)
              )
            )).pipe(
              Effect.flatMap(() =>
                run(
                  snapshot.i0,
                  Sink.WithContext(
                    sink.onFailure,
                    (a) =>
                      Ref.get(ref).pipe(
                        Effect.flatten,
                        Effect.flatMap((b) => Effect.matchCauseEffect(snapshot.i2(a, b), sink)),
                        Effect.optionFromOptional
                      )
                  )
                )
              )
            )
          )
        )
      ),
    Middleware: (middleware) =>
      Effect.contextWithEffect((ctx: Context<R | R2>) => {
        const provided = Sink.provide(sink, ctx)
        return middleware.i1(run(middleware.i0, provided), provided)
      }),
    Slice: (slice) =>
      Effect.asyncEffect((resume) =>
        Effect.suspend(() => {
          let toSkip = slice.i1.min
          let toTake = slice.i1.max

          return run(
            slice.i0,
            Sink.WithContext(sink.onFailure, (a) => {
              if (toSkip > 0) {
                toSkip -= 1
                return Effect.unit
              } else if (toTake > 0) {
                toTake -= 1
                return sink.onSuccess(a).pipe(
                  Effect.flatMap(() => toTake <= 0 ? Effect.sync(() => resume(Effect.unit)) : Effect.unit)
                )
              } else {
                return Effect.sync(() => resume(Effect.unit))
              }
            })
          ).pipe(
            Effect.matchCauseEffect({
              onFailure: sink.onFailure,
              onSuccess: () => Effect.sync(() => resume(Effect.unit))
            })
          )
        })
      )
  })
}

export function runTransformer<R, E, A, R2>(
  fx: Transformer<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return run(fx.i0 as Fx<R, E, A>, compileSyncOperatorSink(fx.i1, sink))
}

export function runTransformerEffect<R, E, A, R2>(
  fx: TransformerEffect<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return run(fx.i0 as Fx<R, E, A>, compileEffectOperatorSink(fx.i1, sink))
}

export function runProvide<R, R2, E, A>(
  fx: FxProvide<any, any, any, any, any, any>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return Effect.catchAllCause(Provide.provideToEffect(run(fx.i0, sink), fx.i1), sink.onFailure)
}

export function runEffect<R, E, A, R2>(
  effect: Effect.Effect<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return Effect.matchCauseEffect(effect, sink)
}

export function succeed<A>(value: A): Fx<never, never, A> {
  return new Succeed(value)
}

export function fromIterable<A>(iterable: Iterable<A>): Fx<never, never, A> {
  return new FromIterable(iterable)
}

export const map: {
  <A, B>(f: (a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B>
} = dual(2, function map<R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B) {
  return Transformer.make<R, E, B>(fx, Map(f))
})

export function observe<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  onSuccees: (a: A) => Effect.Effect<R2, E2, unknown>
): Effect.Effect<R | R2, E | E2, void> {
  return withScopedFork((fork) =>
    Effect.flatMap(Deferred.make<E | E2, void>(), (deferred) =>
      run(
        fx,
        Sink.WithContext(
          (cause) => Deferred.failCause(deferred, cause),
          (a) => Effect.catchAllCause(onSuccees(a), (cause) => Deferred.failCause(deferred, cause))
        )
      ).pipe(
        Effect.flatMap(() => Deferred.succeed(deferred, undefined)),
        fork,
        Effect.flatMap(() => Deferred.await(deferred))
      ))
  )
}

export function drain<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, void> {
  return observe(fx, () => Effect.unit)
}

export function toArray<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, Array<A>> {
  return Effect.suspend(() => {
    const array: Array<A> = []

    return observe(fx, (a) => Effect.sync(() => array.push(a))).pipe(
      Effect.as(array)
    )
  })
}

export function toReadonlyArray<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, ReadonlyArray<A>> {
  return toArray(fx)
}

export const switchMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function switchMap<R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B> {
    return new FlatMap(fx, f, strategies.Switch)
  }
)

export const exhaustMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function exhaustmap<R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B> {
    return new FlatMap(fx, f, strategies.Exhaust)
  }
)

export const exhaust = <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => exhaustMap(fx, identity)

export const exhaustMapLatest: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function exhaustMapLatest<R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B> {
    return new FlatMap(fx, f, strategies.ExhaustLatest)
  }
)

export const exhaustLatest = <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => exhaustMapLatest(fx, identity)

export const flatMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function flatMap<R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B> {
    return new FlatMap(fx, f, strategies.Unbounded)
  }
)

export const flatten = <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => flatMap(fx, identity)

export const flatMapConcurrently: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>, concurrency: number): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>, concurrency: number): Fx<R | R2, E | E2, B>
} = dual(
  3,
  function flatMapConcurrently<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    concurrency: number
  ): Fx<R | R2, E | E2, B> {
    return new FlatMap(fx, f, strategies.Bounded(concurrency))
  }
)

export const concatMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function concatMap<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>
  ): Fx<R | R2, E | E2, B> {
    return new FlatMap(fx, f, strategies.Bounded(1))
  }
)

export const acquireUseRelease: {
  <A, R2, E2, B, R3, E3>(
    use: (a: A) => Fx<R2, E2, B>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, unknown>
  ): <R, E>(acquire: Effect.Effect<R, E, A>) => Fx<R | R2 | R3, E | E2 | E3, B>

  <R, E, A, R2, E2, B, R3, E3>(
    acquire: Effect.Effect<R, E, A>,
    use: (a: A) => Fx<R2, E2, B>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, unknown>
  ): Fx<R | R2 | R3, E | E2 | E3, B>
} = dual(3, function acquireUseRelease<R, E, A, R2, E2, B, R3, E3>(
  acquire: Effect.Effect<R, E, A>,
  use: (a: A) => Fx<R2, E2, B>,
  release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, unknown>
): Fx<R | R2 | R3, E | E2 | E3, B> {
  return new AcquireUseRelease(acquire, use, release)
})

export function combine<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  {
    readonly [K in keyof FX]: Fx.Success<FX[K]>
  }
> {
  return new Combine(fxs)
}

export function merge<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  return Merge.make(fxs, strategies.Unordered(Infinity))
}

export const mergeConcurrently: {
  (concurrency: number): <FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX
  ) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
  <FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX,
    concurrency: number
  ): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
} = dual(2, function mergeConcurrently<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX,
  concurrency: number
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  return Merge.make(fxs, strategies.Unordered(concurrency))
})

export function mergeBuffer<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  return Merge.make(fxs, strategies.Ordered(Infinity))
}

export const mergeBufferConcurrently: {
  (concurrency: number): <FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX
  ) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
  <FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX,
    concurrency: number
  ): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
} = dual(2, function mergeConcurrently<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX,
  concurrency: number
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  return Merge.make(fxs, strategies.Ordered(concurrency))
})

export const mergeSwitch = <FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> => Merge.make(fxs, strategies.Switch)

export function race<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  return new Race(fxs)
}

export const empty: Fx<never, never, never> = new Empty()

export const never: Fx<never, never, never> = new Never()

export const failCause = <E>(cause: Cause.Cause<E>): Fx<never, E, never> => new Fail(cause)

export const fail = <E>(e: E): Fx<never, E, never> => failCause(Cause.fail(e))

export const fromSink = <R, E, A>(
  f: (sink: Sink.Sink<E, A>) => Effect.Effect<R, E, unknown>
): Fx<R, E, A> => new FromSink((sink) => Effect.catchAllCause(f(sink), sink.onFailure))

export const suspend = <R, E, A>(f: () => Fx<R, E, A>): Fx<R, E, A> => new Suspend(f)

export const sync = <A>(f: () => A): Fx<never, never, A> => new Sync(f)

export const slice: {
  (skip: number, take: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, skip: number, take: number): Fx<R, E, A>
} = dual(3, function slice<R, E, A>(fx: Fx<R, E, A>, skip: number, take: number): Fx<R, E, A> {
  return Slice.make(fx, boundsFrom(skip, take))
})

export const take: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
} = dual(2, function take<R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A> {
  return slice(fx, 0, n)
})

export const drop: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
} = dual(2, function drop<R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A> {
  return slice(fx, n, Infinity)
})

export const takeWhile: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(
  2,
  function takeWhile<R, E, A, R2, E2>(
    fx: Fx<R, E, A>,
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Fx<R | R2, E | E2, A> {
    return new TakeWhile(fx, predicate)
  }
)

export const takeUntil: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(
  2,
  function takeUntil<R, E, A, R2, E2>(
    fx: Fx<R, E, A>,
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Fx<R | R2, E | E2, A> {
    return new TakeWhile(fx, (a) => Effect.map(predicate(a), (x) => !x))
  }
)

export const dropWhile: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(
  2,
  function dropWhile<R, E, A, R2, E2>(
    fx: Fx<R, E, A>,
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Fx<R | R2, E | E2, A> {
    return new DropWhile(fx, predicate)
  }
)

export const dropUntil: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(
  2,
  function dropUntil<R, E, A, R2, E2>(
    fx: Fx<R, E, A>,
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Fx<R | R2, E | E2, A> {
    return new DropWhile(fx, (a) => Effect.map(predicate(a), (x) => !x))
  }
)

export const dropAfter: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(
  2,
  function dropAfter<R, E, A, R2, E2>(
    fx: Fx<R, E, A>,
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Fx<R | R2, E | E2, A> {
    return new DropAfter(fx, predicate)
  }
)

export const continueWith: {
  <R2, E2, A>(f: () => Fx<R2, E2, A>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, R2, E2, A>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, A>): Fx<R | R2, E | E2, A>
} = dual(
  2,
  function continueWith<R, E, R2, E2, A>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, A>): Fx<R | R2, E | E2, A> {
    return new ContinueWith(fx, f)
  }
)

export const recoverWith: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, A>): Fx<R | R2, E2, A | B>
} = dual(
  2,
  function recoverWith<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
  ): Fx<R | R2, E2, A | B> {
    return new RecoverWith(fx, f)
  }
)

export const mapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function mapEffect<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>
  ): Fx<R | R2, E | E2, B> {
    return TransformerEffect.make(fx, MapEffect(f))
  }
)

export const tap: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function tap<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>
  ): Fx<R | R2, E | E2, B> {
    return TransformerEffect.make(fx, TapEffect(f))
  }
)

export const filterEffect: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(2, function filterEffect<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  predicate: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R | R2, E | E2, A> {
  return TransformerEffect.make(fx, FilterEffect(predicate))
})

export const filterMapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): Fx<R | R2, E | E2, B>
} = dual(2, function filterEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
): Fx<R | R2, E | E2, A> {
  return TransformerEffect.make(fx, FilterMapEffect(f))
})

export const middleware: {
  <R, E, A, R2>(
    f: (effect: Effect.Effect<R, never, unknown>, sink: Sink.Sink<E, A>) => Effect.Effect<R2, never, unknown>
  ): (fx: Fx<R, E, A>) => Fx<R | R2, E, A>

  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (effect: Effect.Effect<R, never, unknown>, sink: Sink.Sink<E, A>) => Effect.Effect<R2, never, unknown>
  ): Fx<R | R2, E, A>
} = dual(2, function middleware<R, E, A, R2>(
  fx: Fx<R, E, A>,
  f: (effect: Effect.Effect<R, never, unknown>, sink: Sink.Sink<E, A>) => Effect.Effect<R2, never, unknown>
): Fx<R | R2, E, A> {
  return Middleware.make(fx, (effect, sink) => Effect.catchAllCause(f(effect, sink), sink.onFailure))
})

export const loop: {
  <A, B, C>(seed: B, f: (acc: B, a: A) => readonly [C, B]): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, C>
  <R, E, A, B, C>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Fx<R, E, C>
} = dual(3, function loop<R, E, A, B, C>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (acc: B, a: A) => readonly [C, B]
): Fx<R, E, C> {
  return Loop.make(fx, f, seed)
})

export const loopEffect: {
  <B, A, R2, E2, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, C>

  <R, E, A, B, R2, E2, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>
  ): Fx<R | R2, E | E2, C>
} = dual(3, function loopEffect<R, E, A, B, R2, E2, C>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>
): Fx<R | R2, E | E2, C> {
  return LoopEffect.make(fx, f, seed)
})

export const scan: {
  <A, B>(seed: B, f: (acc: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B): Fx<R, E, B>
} = dual(3, function loop<R, E, A, B>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (acc: B, a: A) => B
): Fx<R, E, B> {
  return new ContinueWith(
    new Succeed(seed),
    () =>
      Loop.make(fx, (b, a) => {
        const b2 = f(b, a)

        return [b2, b2]
      }, seed)
  )
})

export const scanEffect: {
  <A, B, R2, E2>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, B>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, B, R2, E2>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(3, function loopEffect<R, E, A, B, R2, E2>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (acc: B, a: A) => Effect.Effect<R2, E2, B>
): Fx<R | R2, E | E2, B> {
  return new ContinueWith(
    new Succeed(seed),
    () => LoopEffect.make(fx, (b, a) => Effect.map(f(b, a), (b2) => [b2, b2]), seed)
  )
})

export const flatMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, function flatMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
): Fx<R | R2, E2, A | B> {
  return new FlatMapCause(fx, f, strategies.Unbounded)
})

export const flatMapCauseConcurrently: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    concurrency: number
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    concurrency: number
  ): Fx<R | R2, E2, A | B>
} = dual(3, function flatMapCauseConcurrently<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  concurrency: number
): Fx<R | R2, E2, A | B> {
  return new FlatMapCause(fx, f, strategies.Bounded(concurrency))
})

export const switchMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, function switchMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
): Fx<R | R2, E2, A | B> {
  return new FlatMapCause(fx, f, strategies.Switch)
})

export const exhaustMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, function exhaustMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
): Fx<R | R2, E2, A | B> {
  return new FlatMapCause(fx, f, strategies.Exhaust)
})

export const exhaustMapLatestCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, function exhaustMapLatestCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
): Fx<R | R2, E2, A | B> {
  return new FlatMapCause(fx, f, strategies.ExhaustLatest)
})

export const matchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(3, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return new MatchCause(fx, f, g, strategies.Unbounded)
})

export const matchCauseConcurrently: {
  <E, R2, E2, B, A, R3, E3, C>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>,
    concurrency: number
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>,
    concurrency: number
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(4, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>,
  concurrency: number
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return new MatchCause(fx, f, g, strategies.Bounded(concurrency))
})

export const switchMatchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(3, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return new MatchCause(fx, f, g, strategies.Switch)
})

export const exhaustMatchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(3, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return new MatchCause(fx, f, g, strategies.Exhaust)
})

export const exhaustLatestMatchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(3, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return new MatchCause(fx, f, g, strategies.ExhaustLatest)
})

export const during: {
  <R2, E2, R3, E3>(
    window: Fx<R2, E2, Fx<R3, E3, unknown>>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E | E2 | E3, A>

  <R, E, A, R2, E2, R3, E3>(
    fx: Fx<R, E, A>,
    window: Fx<R2, E2, Fx<R3, E3, unknown>>
  ): Fx<R | R2 | R3, E | E2 | E3, A>
} = dual(2, function during<R, E, A, R2, E2, R3, E3>(
  fx: Fx<R, E, A>,
  window: Fx<R2, E2, Fx<R3, E3, unknown>>
) {
  return new During(fx, window)
})

export const since: {
  <R2, E2>(window: Fx<R2, E2, unknown>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, window: Fx<R2, E2, unknown>): Fx<R | R2, E | E2, A>
} = dual(2, function since<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  window: Fx<R2, E2, unknown>
): Fx<R | R2, E | E2, A> {
  return new During(fx, switchMap(take(window, 1), () => never))
})

export const until: {
  <R2, E2>(window: Fx<R2, E2, unknown>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, window: Fx<R2, E2, unknown>): Fx<R | R2, E | E2, A>
} = dual(2, function until<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  window: Fx<R2, E2, unknown>
): Fx<R | R2, E | E2, A> {
  return new During(fx, succeed(window))
})

export const fromScheduled: {
  <R2>(scheduled: Schedule.Schedule<R2, unknown, unknown>): <R, E, A>(fx: Effect.Effect<R, E, A>) => Fx<R | R2, E, A>
  <R, E, A, R2>(fx: Effect.Effect<R, E, A>, scheduled: Schedule.Schedule<R2, unknown, unknown>): Fx<R | R2, E, A>
} = dual(2, function fromScheduled<R, E, A, R2>(
  fx: Effect.Effect<R, E, A>,
  scheduled: Schedule.Schedule<R2, unknown, unknown>
): Fx<R | R2, E, A> {
  return new FromScheduled(fx, scheduled)
})

export const periodic: {
  (duration: DurationInput): <R, E, A>(fx: Effect.Effect<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Effect.Effect<R, E, A>, duration: DurationInput): Fx<R, E, A>
} = dual(2, function periodic<R, E, A>(
  fx: Effect.Effect<R, E, A>,
  duration: DurationInput
): Fx<R, E, A> {
  return fromScheduled(fx, Schedule.spaced(duration))
})

export const provideContext: {
  <R>(context: Context<R>): <E, A>(fx: Fx<R, E, A>) => Fx<never, E, A>
  <R, E, A>(fx: Fx<R, E, A>, context: Context<R>): Fx<never, E, A>
} = dual(2, function provideContext<R, E, A>(
  fx: Fx<R, E, A>,
  context: Context<R>
): Fx<never, E, A> {
  return FxProvide.make(fx, Provide.ProvideContext(context))
})

export const provideSomeContext: {
  <R2>(context: Context<R2>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, R2>, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, context: Context<R2>): Fx<Exclude<R, R2>, E, A>
} = dual(2, function provideSomeContext<R, E, A, R2>(
  fx: Fx<R, E, A>,
  context: Context<R2>
): Fx<Exclude<R, R2>, E, A> {
  return FxProvide.make(fx, Provide.ProvideSomeContext(context))
})

export const provideLayer: {
  <R2, E2, R>(layer: Layer.Layer<R2, E2, R>): <E, A>(fx: Fx<R, E, A>) => Fx<R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, R>): Fx<R2, E | E2, A>
} = dual(2, function provideLayer<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  layer: Layer.Layer<R2, E2, R>
): Fx<R2, E | E2, A> {
  return FxProvide.make(fx, Provide.ProvideLayer(layer))
})

export const provideSomeLayer: {
  <R2, E2, S>(layer: Layer.Layer<R2, E2, S>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | Exclude<R, S>, E | E2, A>
  <R, E, A, R2, E2, S>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, S>): Fx<R2 | Exclude<R, S>, E | E2, A>
} = dual(2, function provideSomeLayer<R, E, A, R2, E2, S>(
  fx: Fx<R, E, A>,
  layer: Layer.Layer<R2, E2, R>
): Fx<Exclude<R, S> | R2, E | E2, A> {
  return FxProvide.make(fx, Provide.ProvideSomeLayer(layer))
})
