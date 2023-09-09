// TODO:
// Apply Effect transformations to an Fx
// StartWith + EndWith

import type * as Chunk from "@effect/data/Chunk"
import * as Equal from "@effect/data/Equal"
import { identity } from "@effect/data/Function"
import * as Hash from "@effect/data/Hash"
import { type Pipeable, pipeArguments } from "@effect/data/Pipeable"
import type * as Cause from "@effect/io/Cause"
import type * as Effect from "@effect/io/Effect"
import type * as Exit from "@effect/io/Exit"
import type * as Schedule from "@effect/io/Schedule"
import type { EffectOperator } from "@typed/fx/internal/effect-operator"
import type { Provide } from "@typed/fx/internal/provide"
import type * as Sink from "@typed/fx/internal/sink"
import type * as strategies from "@typed/fx/internal/strategies"
import type { SyncOperator } from "@typed/fx/internal/sync-operator"

export const TypeId = Symbol.for("@typed/Fx/TypeId")
export type TypeId = typeof TypeId

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
  | TransfomerEffect<any, any, any>
  | Loop<any, any, any, any, any>
  | LoopEffect<any, any, any, any, any, any, any>
  | Snapshot<any, any, any, any, any, any, any, any, any>

export class AcquireUseRelease<R, E, A, R1, E1, A1, R2, E2> extends FxProto<R | R1 | R2, E | E1 | E2, A1> {
  readonly _tag = "Fx/AcquireUseRelease"

  constructor(
    readonly i0: Effect.Effect<R, E, A>,
    readonly i1: (a: A) => Fx<R1, E1, A1>,
    readonly i2: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R2, E2, unknown>
  ) {
    super(i0, i1, i2)
  }
}

export class Combine<R, E, A> extends FxProto<R, E, A> {
  readonly _tag = "Fx/Combine"

  constructor(readonly i0: Array<Fx<R, E, A>>) {
    super(i0)
  }
}

export abstract class Commit<R, E, A> extends FxProto<R, E, A> {
  readonly _tag = "Fx/Commit"

  abstract commit(): Fx<R, E, A>
}

export class Empty extends FxProto<never, never, never> {
  readonly _tag = "Fx/Empty"
}

export class Fail<E> extends FxProto<never, E, never> {
  readonly _tag = "Fx/Fail"

  constructor(readonly i0: Cause.Cause<E>) {
    super(i0)
  }
}

export class FromEffect<R, E, A> extends FxProto<R, E, A> {
  readonly _tag = "Fx/FromEffect"

  constructor(readonly i0: Effect.Effect<R, E, A>) {
    super(i0)
  }
}

export class FromScheduled<R, E, A, R1> extends FxProto<R | R1, E, A> {
  readonly _tag = "Fx/FromScheduled"

  constructor(
    readonly i0: Effect.Effect<R, E, A>,
    readonly i1: Schedule.Schedule<R1, unknown, unknown>
  ) {
    super(i0, i1)
  }
}

export class FromSink<R, E, A> extends FxProto<R, E, A> {
  readonly _tag = "Fx/FromSink"

  constructor(readonly i0: (sink: Sink.Sink<E, A>) => Effect.Effect<R, never, unknown>) {
    super(i0)
  }
}

export class Merge<R, E, A> extends FxProto<R, E, A> {
  readonly _tag = "Fx/Merge"

  constructor(readonly i0: Array<Fx<R, E, A>>, readonly i1: strategies.MergeStrategy) {
    super(i0, i1)
  }
}

export class Never extends FxProto<never, never, never> {
  readonly _tag = "Fx/Never"
}

export class Race<R, E, A> extends FxProto<R, E, A> {
  readonly _tag = "Fx/Race"

  constructor(readonly i0: Array<Fx<R, E, A>>) {
    super(i0)
  }
}

export class Succeed<A> extends FxProto<never, never, A> {
  readonly _tag = "Fx/Succeed"

  constructor(readonly i0: A) {
    super(i0)
  }
}

export class Sync<A> extends FxProto<never, never, A> {
  readonly _tag = "Fx/Sync"

  constructor(readonly i0: () => A) {
    super(i0)
  }
}

export class Suspend<R, E, A> extends FxProto<R, E, A> {
  readonly _tag = "Fx/Suspend"

  constructor(readonly i0: () => Fx<R, E, A>) {
    super(i0)
  }
}

export class FlatMap<R, E, A, R1, E1, A1> extends FxProto<R | R1, E | E1, A1> {
  readonly _tag = "Fx/FlatMap"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (a: A) => Fx<R1, E1, A1>,
    readonly i2: strategies.FlattenStrategy
  ) {
    super(i0, i1, i2)
  }
}

export class FlatMapCause<R, E, A, R1, E1, A1> extends FxProto<R | R1, E1, A | A1> {
  readonly _tag = "Fx/FlatMapCause"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (cause: Cause.Cause<E>) => Fx<R1, E1, A1>,
    readonly i2: strategies.FlattenStrategy
  ) {
    super(i0, i1, i2)
  }
}

export class MatchCause<R, E, A, R1, E1, A1, R2, E2, A2> extends FxProto<R | R1 | R2, E1 | E2, A1 | A2> {
  readonly _tag = "Fx/MatchCause"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (cause: Cause.Cause<E>) => Fx<R1, E1, A1>,
    readonly i2: (a: A) => Fx<R2, E2, A2>
  ) {
    super(i0, i1, i2)
  }
}

export class ContinueWith<R, E, A, R1, E1, A1> extends FxProto<R | R1, E | E1, A1> {
  readonly _tag = "Fx/ContinueWith"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: () => Fx<R1, E1, A1>
  ) {
    super(i0, i1)
  }
}

export class RecoverWith<R, E, A, R1, E1, A1> extends FxProto<R | R1, E1, A | A1> {
  readonly _tag = "Fx/RecoverWith"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (cause: Cause.Cause<E>) => Fx<R1, E1, A1>
  ) {
    super(i0, i1)
  }
}

export class Share<R, E, A, R2> extends FxProto<R | R2, E, A> {
  readonly _tag = "Fx/Share"

  // All sharing is backed by a Subject which handles all behaviors for
  // downstream consumers
  constructor(readonly i0: Fx<R, E, A>, readonly i1: Effect.Effect<R2, never, Subject<E, A>>) {
    super(i0, i1)
  }
}

export class During<R, E, A, R1, E1, R2, E2, A2> extends FxProto<R | R1 | R2, E | E1 | E2, A> {
  readonly _tag = "Fx/During"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: Fx<R1, E1, Fx<R2, E2, A2>>
  ) {
    super(i0, i1)
  }
}

export class TakeWhile<R, E, A, R1, E1> extends FxProto<R | R1, E | E1, A> {
  readonly _tag = "Fx/TakeWhile"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (a: A) => Effect.Effect<R1, E1, boolean>
  ) {
    super(i0, i1)
  }
}

export class DropWhile<R, E, A, R1, E1> extends FxProto<R | R1, E | E1, A> {
  readonly _tag = "Fx/DropWhile"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (a: A) => Effect.Effect<R1, E1, boolean>
  ) {
    super(i0, i1)
  }
}

export class DropAfter<R, E, A, R1, E1> extends FxProto<R | R1, E | E1, A> {
  readonly _tag = "Fx/DropAfter"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (a: A) => Effect.Effect<R1, E1, boolean>
  ) {
    super(i0, i1)
  }
}

export class Transformer<R, E, A> extends FxProto<R, E, A> {
  readonly _tag = "Fx/Transformer"

  constructor(
    readonly i0: Fx<unknown, unknown, unknown>,
    readonly i1: Chunk.Chunk<SyncOperator>
  ) {
    super(i0, i1)
  }
}

export class TransfomerEffect<R, E, A> extends FxProto<R, E, A> {
  readonly _tag = "Fx/TransformerEffect"

  constructor(
    readonly i0: Fx<unknown, unknown, unknown>,
    readonly i1: Chunk.Chunk<EffectOperator>
  ) {
    super(i0, i1)
  }
}

export class Loop<R, E, A, B, C> extends FxProto<R, E, C> {
  readonly _tag = "Fx/Loop"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (a: A) => readonly [C, B],
    readonly i2: B
  ) {
    super(i0, i1, i2)
  }
}

export class LoopEffect<R, E, A, R2, E2, B, C> extends FxProto<R | R2, E | E2, C> {
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

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: Provide<R2, E2, B>
  ) {
    super(i0, i1)
  }
}

export class Snapshot<R, E, A, R2, E2, B, R3, E3, C> extends FxProto<R | R2 | R2, E | E2 | E3, C> {
  readonly _tag = "Fx/Snapshot"

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: Fx<R2, E2, B>,
    readonly i2: (a: A, b: B) => Effect.Effect<R3, E3, C>
  ) {
    super(i0, i1, i2)
  }
}
