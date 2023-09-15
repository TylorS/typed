import type * as Chunk from "@effect/data/Chunk"
import type { Context } from "@effect/data/Context"
import type { DurationInput } from "@effect/data/Duration"
import type { Equivalence } from "@effect/data/Equivalence"
import { dual, identity } from "@effect/data/Function"
import type { Inspectable } from "@effect/data/Inspectable"
import type * as Option from "@effect/data/Option"
import type { Pipeable } from "@effect/data/Pipeable"
import * as Cause from "@effect/io/Cause"
import type * as Effect from "@effect/io/Effect"
import type * as Exit from "@effect/io/Exit"
import type * as Fiber from "@effect/io/Fiber"
import type { FiberId } from "@effect/io/FiberId"
import type * as Layer from "@effect/io/Layer"
import type * as Schedule from "@effect/io/Schedule"
import type * as Scope from "@effect/io/Scope"
import * as core from "@typed/fx/internal/core"
import * as primitive from "@typed/fx/internal/fx-primitive"
import * as internalRun from "@typed/fx/internal/run"
import * as Share from "@typed/fx/internal/share"
import * as strategies from "@typed/fx/internal/strategies"
import type * as Sink from "@typed/fx/Sink"
import type { Subject } from "@typed/fx/Subject"
import type { TypeId } from "@typed/fx/TypeId"

/* #region Model */
export interface Fx<R, E, A> extends Fx.Variance<R, E, A>, Pipeable, Inspectable {}

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

export type FlattenStrategy = Unbounded | Bounded | Switch | Exhaust | ExhaustLatest

export interface Unbounded {
  readonly _tag: "Unbounded"
}

export const Unbounded: Unbounded = strategies.Unbounded

export interface Bounded {
  readonly _tag: "Bounded"
  readonly capacity: number
}

export const Bounded: (capacity: number) => Bounded = strategies.Bounded

export interface Switch {
  readonly _tag: "Switch"
}

export const Switch: Switch = strategies.Switch

export interface Exhaust {
  readonly _tag: "Exhaust"
}

export const Exhaust: Exhaust = strategies.Exhaust

export interface ExhaustLatest {
  readonly _tag: "ExhaustLatest"
}

export const ExhaustLatest: ExhaustLatest = strategies.ExhaustLatest

export type MergeStrategy = Unordered | Ordered | Switch

export interface Unordered {
  readonly _tag: "Unordered"
  readonly concurrency: number
}

export const Unordered: (concurrency: number) => Unordered = strategies.Unordered

export interface Ordered {
  readonly _tag: "Ordered"
  readonly concurrency: number
}

export const Ordered: (concurrency: number) => Ordered = strategies.Ordered

/* #endregion */

/* #region Constructor */

/* #region Core */
export const empty: Fx<never, never, never> = core.empty

export const failCause: <E>(cause: Cause.Cause<E>) => Fx<never, E, never> = core.failCause

export const die = (defect: unknown): Fx<never, never, never> => failCause(Cause.die(defect))

export const interrupt = (id: FiberId): Fx<never, never, never> => failCause(Cause.interrupt(id))

export const fail: <E>(error: E) => Fx<never, E, never> = core.fail

export const fromEffect: <R, E, A>(effect: Effect.Effect<R, E, A>) => Fx<R, E, A> = identity

export const fromIterable: {
  <A extends ReadonlyArray<any>>(array: A): Fx<never, never, A[number]>
  <A>(iterable: Iterable<A>): Fx<never, never, A>
} = core.fromIterable

export const fromSink: <R, E, A>(f: (sink: Sink.Sink<E, A>) => Effect.Effect<R, E, unknown>) => Fx<R, E, A> =
  core.fromSink

export const never: Fx<never, never, never> = core.never

export const succeed: <A>(value: A) => Fx<never, never, A> = core.succeed

export const sync: <A>(f: () => A) => Fx<never, never, A> = core.sync

export const suspend: <R, E, A>(f: () => Fx<R, E, A>) => Fx<R, E, A> = core.suspend

export abstract class ToFx<R, E, A> extends primitive.ToFx<R, E, A> implements Fx<R, E, A> {
  abstract toFx(): Fx<R, E, A>
}

export type ScopedFork = <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<R, never, Fiber.Fiber.Runtime<E, A>>

export type FxFork = <R>(
  effect: Effect.Effect<R, never, void>
) => Effect.Effect<R, never, void>

export type WithScopedForkParams<E, A> = {
  readonly sink: Sink.Sink<E, A>
  readonly fork: ScopedFork
  readonly scope: Scope.Scope
}

export const withScopedFork: <R, E, A>(
  f: (params: WithScopedForkParams<E, A>) => Effect.Effect<R, never, unknown>
) => Fx<R, E, A> = core.withScopedFork

export type WithEarlyExitParams<E, A> = {
  readonly sink: Sink.WithEarlyExit<E, A>
  readonly fork: ScopedFork
  readonly scope: Scope.Scope
}

export const withEarlyExit: <R, E, A>(
  f: (params: WithEarlyExitParams<E, A>) => Effect.Effect<R, never, unknown>
) => Fx<R, E, A> = core.withEarlyExit

export type WithFlattenStrategyParams<E, A> = {
  readonly sink: Sink.Sink<E, A>
  readonly fork: FxFork
  readonly scope: Scope.Scope
}

export const withFlattenStrategy: <R, E, A>(
  f: (params: WithFlattenStrategyParams<E, A>) => Effect.Effect<R, never, unknown>,
  strategy: FlattenStrategy
) => Fx<R, E, A> = core.withFlattenStrategy

/* #endregion */

/* #region Additions */

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
} = core.acquireUseRelease

export const combine: <const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, { readonly [K in keyof FX]: Fx.Success<FX[K]> }> = core.combine

export const merge: <const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> = core.merge

export const mergeConcurrently: {
  (concurrency: number): <const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX
  ) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
  <const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX,
    concurrency: number
  ): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
} = core.mergeConcurrently

export const mergeBuffer: <const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> = core.mergeBuffer

export const mergeBufferConcurrently: {
  (concurrency: number): <const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX
  ) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
  <const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX,
    concurrency: number
  ): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
} = core.mergeBufferConcurrently

export const mergeSwitch = <const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> => core.mergeSwitch(fxs)

export const race: <const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> = core.race

export const fromScheduled: {
  <R2>(scheduled: Schedule.Schedule<R2, unknown, unknown>): <R, E, A>(fx: Effect.Effect<R, E, A>) => Fx<R | R2, E, A>
  <R, E, A, R2>(fx: Effect.Effect<R, E, A>, scheduled: Schedule.Schedule<R2, unknown, unknown>): Fx<R | R2, E, A>
} = core.fromScheduled

export const periodic: {
  (duration: DurationInput): <R, E, A>(fx: Effect.Effect<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Effect.Effect<R, E, A>, duration: DurationInput): Fx<R, E, A>
} = core.periodic

/* #endregion */

/* #region Running */

export const run: <R, E, A, R2>(
  fx: Fx<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
) => Effect.Effect<R | R2, never, unknown> = internalRun.run

export const observe: {
  <A, R2, E2>(
    onSuccees: (a: A) => Effect.Effect<R2, E2, unknown>
  ): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R | R2, E | E2, void>
  <R, E, A, R2, E2>(
    fx: Fx<R, E, A>,
    onSuccees: (a: A) => Effect.Effect<R2, E2, unknown>
  ): Effect.Effect<R | R2, E | E2, void>
} = dual(2, core.observe)

export const drain: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, void> = core.drain

export const reduce: {
  <A, B>(seed: B, f: (acc: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B): Effect.Effect<R, E, B>
} = core.reduce

export const toArray: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, Array<A>> = core.toArray

export const toReadonlyArray: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>> = core.toReadonlyArray

export const toChunk: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>> = core.toChunk

/* #endregion */

/* #region Combinators */

export const map: {
  <A, B>(f: (a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B>
} = core.map

export const filter: {
  <A, B extends A>(f: (a: A) => a is B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <A>(f: (a: A) => boolean): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: (a: A) => a is B): Fx<R, E, B>
  <R, E, A>(fx: Fx<R, E, A>, f: (a: A) => boolean): Fx<R, E, A>
} = core.filter

export const filterMap: {
  <A, B>(f: (a: A) => Option.Option<B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => Option.Option<B>): Fx<R, E, B>
} = core.filterMap

export const mapErrorCause: {
  <E, E2>(f: (a: Cause.Cause<E>) => Cause.Cause<E2>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => Cause.Cause<E2>): Fx<R, E2, A>
} = core.mapErrorCause

export const mapError: {
  <E, E2>(f: (a: E) => E2): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (a: E) => E2): Fx<R, E2, A>
} = core.mapError

export const filterCause: {
  <E, E2 extends E>(f: (a: Cause.Cause<E>) => a is Cause.Cause<E2>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <E>(f: (a: Cause.Cause<E>) => boolean): <R, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, E2 extends E, A>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => a is Cause.Cause<E2>): Fx<R, E2, A>
  <R, E, A>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => boolean): Fx<R, E, A>
} = core.filterCause

export const filterMapCause: {
  <E, E2>(f: (a: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>): Fx<R, E2, A>
} = core.filterMapCause

export const flatMapWithStrategy: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>,
    strategy: FlattenStrategy
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    strategy: FlattenStrategy
  ): Fx<R | R2, E | E2, B>
} = dual(3, core.flatMapWithStrategy)

export const switchMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = core.switchMap

export const exhaustMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = core.exhaustMap

export const exhaust: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A> = core.exhaust

export const exhaustMapLatest: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = core.exhaustMapLatest

export const exhaustLatest: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A> = core.exhaustLatest

export const flatMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = core.flatMap

export const flatten: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A> = core.flatten

export const flatMapConcurrently: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>, concurrency: number): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>, concurrency: number): Fx<R | R2, E | E2, B>
} = core.flatMapCauseConcurrently

export const concatMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = core.concatMap

export const slice: {
  (skip: number, take: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, skip: number, take: number): Fx<R, E, A>
} = core.slice

export const take: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
} = core.take

export const drop: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
} = core.drop

export const takeWhile: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = core.takeWhile

export const takeUntil: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = core.takeUntil

export const dropWhile: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = core.dropWhile

export const dropUntil: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = core.dropUntil

export const dropAfter: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = core.dropAfter

export const continueWith: {
  <R2, E2, A>(f: () => Fx<R2, E2, A>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, R2, E2, A>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, A>): Fx<R | R2, E | E2, A>
} = core.continueWith

export const orElse: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, A>): Fx<R | R2, E2, A | B>
} = core.recoverWith

export const mapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
} = core.mapEffect

export const tap: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
} = core.tap

export const filterEffect: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = core.filterEffect

export const filterMapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): Fx<R | R2, E | E2, B>
} = core.filterMapEffect

export const middleware: {
  <R, E, A, R2>(
    f: (effect: Effect.Effect<R, never, unknown>, sink: Sink.Sink<E, A>) => Effect.Effect<R2, never, unknown>
  ): (fx: Fx<R, E, A>) => Fx<R2, E, A>

  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (effect: Effect.Effect<R, never, unknown>, sink: Sink.Sink<E, A>) => Effect.Effect<R2, never, unknown>
  ): Fx<R2, E, A>
} = core.middleware

export const loop: {
  <A, B, C>(seed: B, f: (acc: B, a: A) => readonly [C, B]): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, C>
  <R, E, A, B, C>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Fx<R, E, C>
} = core.loop

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
} = core.loopEffect

export const startWith: {
  <B>(value: B): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A | B>
  <R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, A | B>
} = core.startWith

export const endWith: {
  <B>(value: B): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A | B>
  <R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, A | B>
} = core.endWith

export const scan: {
  <A, B>(seed: B, f: (acc: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B): Fx<R, E, B>
} = core.scan

export const scanEffect: {
  <A, B, R2, E2>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, B>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, B, R2, E2>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
} = core.scanEffect

export const flatMapCauseWithStrategy: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    strategy: FlattenStrategy
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    strategy: FlattenStrategy
  ): Fx<R | R2, E2, A | B>
} = core.flatMapCauseWithStrategy

export const flatMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = core.flatMapCause

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
} = core.flatMapCauseConcurrently

export const switchMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = core.switchMapCause

export const exhaustMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = core.exhaustMapCause

export const exhaustMapLatestCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = core.exhaustMapLatestCause

export const matchCauseWithStrategy: {
  <E, R2, E2, B, A, R3, E3, C>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>,
    strategy: FlattenStrategy
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>,
    strategy: FlattenStrategy
  ): Fx<R | R2, E2 | E3, B | C>
} = core.matchCauseWithStrategy

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
} = core.matchCause

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
} = core.matchCauseConcurrently

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
} = core.switchMatchCause

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
} = core.exhaustMatchCause

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
} = core.exhaustLatestMatchCause

export const during: {
  <R2, E2, R3, E3>(
    window: Fx<R2, E2, Fx<R3, E3, unknown>>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E | E2 | E3, A>

  <R, E, A, R2, E2, R3, E3>(
    fx: Fx<R, E, A>,
    window: Fx<R2, E2, Fx<R3, E3, unknown>>
  ): Fx<R | R2 | R3, E | E2 | E3, A>
} = core.during

export const since: {
  <R2, E2>(window: Fx<R2, E2, unknown>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, window: Fx<R2, E2, unknown>): Fx<R | R2, E | E2, A>
} = core.since

export const until: {
  <R2, E2>(window: Fx<R2, E2, unknown>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, window: Fx<R2, E2, unknown>): Fx<R | R2, E | E2, A>
} = core.until

export const provideContext: {
  <R>(context: Context<R>): <E, A>(fx: Fx<R, E, A>) => Fx<never, E, A>
  <R, E, A>(fx: Fx<R, E, A>, context: Context<R>): Fx<never, E, A>
} = core.provideContext

export const provideSomeContext: {
  <R2>(context: Context<R2>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, R2>, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, context: Context<R2>): Fx<Exclude<R, R2>, E, A>
} = core.provideSomeContext

export const provideLayer: {
  <R2, E2, R>(layer: Layer.Layer<R2, E2, R>): <E, A>(fx: Fx<R, E, A>) => Fx<R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, R>): Fx<R2, E | E2, A>
} = core.provideLayer

export const provideSomeLayer: {
  <R2, E2, S>(layer: Layer.Layer<R2, E2, S>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | Exclude<R, S>, E | E2, A>
  <R, E, A, R2, E2, S>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, S>): Fx<R2 | Exclude<R, S>, E | E2, A>
} = core.provideSomeLayer

export const skipRepeatsWith: {
  <A>(eq: Equivalence<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, eq: Equivalence<A>): Fx<R, E, A>
} = core.skipRepeatsWith

export const skipRepeats: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = core.skipRepeats

export const snapshot: {
  <R2, E2, B, A, R3, E3, C>(
    sampled: Fx<R2, E2, B>,
    f: (a: A, b: B) => Effect.Effect<R3, E3, C>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E | E2 | E3, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    sampled: Fx<R2, E2, B>,
    f: (a: A, b: B) => Effect.Effect<R3, E3, C>
  ): Fx<R | R2 | R3, E | E2 | E3, C>
} = core.snapshot

export const share: <R, E, A, R2>(fx: Fx<R, E, A>, subject: Subject<R2, E, A>) => Fx<R | R2, E, A> = Share.share

export const multicast: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = Share.multicast

export const hold: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = Share.hold

export const replay: {
  (capacity: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, capacity: number): Fx<R, E, A>
} = Share.replay

/* #endregion */
