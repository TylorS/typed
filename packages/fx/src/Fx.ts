/**
 * Fx<R, E, A> is a representation of an `Effect`-ful workflow that exists over
 * the time dimension. It operates within a context `R`, can fail with an `E`,
 * and succeed with an `A`.
 *
 * Any `Fx`, shorthand for "Effects", can emit 0 or more errors or events over an
 * indefinite period of time. This is in contrast to `Effect` which can only
 * produce exactly 1 error or event.
 *
 * It is defined as a super-type of `Effect`, `Stream`, and `Cause`. This
 * allows for all operators that accept an `Fx` to also capable of
 * accepting an `Effect`, `Stream`, or `Cause`. An Effect or Cause represents a single
 * event or error, while a Stream represents a series of events or errors that will
 * be pulled from the producer as soon as possible.
 *
 * @since 1.18.0
 */

import type * as Chunk from "@effect/data/Chunk"
import type { Context, Tag } from "@effect/data/Context"
import type { DurationInput } from "@effect/data/Duration"
import type * as Either from "@effect/data/Either"
import type { Equivalence } from "@effect/data/Equivalence"
import { dual, identity } from "@effect/data/Function"
import type * as HashSet from "@effect/data/HashSet"
import type { Inspectable } from "@effect/data/Inspectable"
import type * as Option from "@effect/data/Option"
import type { Pipeable } from "@effect/data/Pipeable"
import * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import type * as Exit from "@effect/io/Exit"
import type * as Fiber from "@effect/io/Fiber"
import type * as FiberId from "@effect/io/FiberId"
import type { FiberRef } from "@effect/io/FiberRef"
import type * as Layer from "@effect/io/Layer"
import type * as Logger from "@effect/io/Logger"
import type * as Request from "@effect/io/Request"
import type * as Schedule from "@effect/io/Schedule"
import type { Scheduler } from "@effect/io/Scheduler"
import type * as Scope from "@effect/io/Scope"
import type * as Tracer from "@effect/io/Tracer"
import * as core from "@typed/fx/internal/core"
import * as internal from "@typed/fx/internal/fx"
import * as primitive from "@typed/fx/internal/fx-primitive"
import * as internalKeyed from "@typed/fx/internal/keyed"
import * as internalRun from "@typed/fx/internal/run"
import * as Share from "@typed/fx/internal/share"
import * as strategies from "@typed/fx/internal/strategies"
import type { RefSubject } from "@typed/fx/RefSubject"
import type * as Sink from "@typed/fx/Sink"
import type { Subject } from "@typed/fx/Subject"
import type { TypeId } from "@typed/fx/TypeId"

/* #region Model */

/**
 * Fx<R, E, A> is a representation of an `Effect`-ful workflow that exists over
 * the time dimension. It operates within a context `R`, can fail with an `E`,
 * and succeed with an `A`.
 *
 * @since 1.18.0
 * @category models
 */
export interface Fx<R, E, A> extends Fx.Variance<R, E, A>, Pipeable, Inspectable {}

/**
 * @since 1.18.0
 */
export namespace Fx {
  /**
   * Extract the Context, Error, or Success type from an Fx
   * @since 1.18.0
   */
  export type Context<T> = T extends Fx<infer R, infer _E, infer _A> ? R : never

  /**
   * Extract the Error type from an Fx
   * @since 1.18.0
   */
  export type Error<T> = T extends Fx<infer _R, infer E, infer _A> ? E : never

  /**
   * Extract the Success type from an Fx
   * @since 1.18.0
   */
  export type Success<T> = T extends Fx<infer _R, infer _E, infer A> ? A : never

  /**
   * Configures the variance of an Fx
   * @since 1.18.0
   * @category models
   */
  export interface Variance<R, E, A> {
    readonly [TypeId]: {
      readonly _R: (_: never) => R
      readonly _E: (_: never) => E
      readonly _A: (_: never) => A
    }
  }
}

/**
 * FlattenStrategy is a representation of how higher-order effect operators should flatten
 * nested Fx.
 *
 * @since 1.18.0
 * @category FlattenStrategy
 */
export type FlattenStrategy = Unbounded | Bounded | Switch | Exhaust | ExhaustLatest

/**
 * Strategy which will allow for an unbounded number of concurrent effects to be run.
 * @since 1.18.0
 * @category FlattenStrategy
 */
export interface Unbounded {
  readonly _tag: "Unbounded"
}

/**
 * Singleton instance of Unbounded
 * @since 1.18.0
 * @category FlattenStrategy
 */
export const Unbounded: Unbounded = strategies.Unbounded

/**
 * Strategy which will allow for a bounded number of concurrent effects to be run.
 * @since 1.18.0
 * @category FlattenStrategy
 */
export interface Bounded {
  readonly _tag: "Bounded"
  readonly capacity: number
}

/**
 * Construct a Bounded strategy
 * @since 1.18.0
 * @category FlattenStrategy
 */
export const Bounded: (capacity: number) => Bounded = strategies.Bounded

/**
 * Strategy which will switch to a new effect as soon as it is available.
 * @since 1.18.0
 * @category FlattenStrategy
 */
export interface Switch {
  readonly _tag: "Switch"
}

/**
 * Singleton instance of Switch
 * @since 1.18.0
 * @category FlattenStrategy
 */
export const Switch: Switch = strategies.Switch

/**
 * Strategy which will always favor the first Fx, dropping any Fx emitted while
 * the first Fx is still running. When the first Fx finished, the next event
 * will execute.
 *
 * @since 1.18.0
 * @category FlattenStrategy
 */
export interface Exhaust {
  readonly _tag: "Exhaust"
}

/**
 * Singleton instance of Exhaust
 * @since 1.18.0
 * @category FlattenStrategy
 */
export const Exhaust: Exhaust = strategies.Exhaust

/**
 * Strategy which will always favor the latest Fx, dropping any Fx emitted while
 * the latest Fx is still running. When the latest Fx finishes, the last seend event
 * will execute.
 *
 * @since 1.18.0
 * @category FlattenStrategy
 */
export interface ExhaustLatest {
  readonly _tag: "ExhaustLatest"
}

/**
 * Singleton instance of ExhaustLatest
 * @since 1.18.0
 * @category FlattenStrategy
 */
export const ExhaustLatest: ExhaustLatest = strategies.ExhaustLatest

/**
 * MergeStrategy is a representation of how multiple Fx should be merged together.
 * @since 1.18.0
 * @category MergeStrategy
 */
export type MergeStrategy = Unordered | Ordered | Switch

/**
 * Strategy which will merge Fx in an unordered fashion.
 * @since 1.18.0
 * @category MergeStrategy
 */
export interface Unordered {
  readonly _tag: "Unordered"
  readonly concurrency: number
}

/**
 * Construct an Unordered strategy
 * @since 1.18.0
 * @category MergeStrategy
 */
export const Unordered: (concurrency: number) => Unordered = strategies.Unordered

/**
 * Strategy which will merge Fx in an ordered fashion with
 * the specified level of concurrency.
 * @since 1.18.0
 * @category MergeStrategy
 */
export interface Ordered {
  readonly _tag: "Ordered"
  readonly concurrency: number
}

/**
 * Construct an Ordered strategy
 * @since 1.18.0
 * @category MergeStrategy
 */
export const Ordered: (concurrency: number) => Ordered = strategies.Ordered

/* #endregion */

/* #region Constructor */

/* #region Core */

/**
 * An Fx which will immediately end producing 0 events and 0 errors.
 * @since 1.18.0
 * @category constructors
 */
export const empty: Fx<never, never, never> = core.empty

/**
 * Construct an Fx<never, E, A> from a Cause<E>
 * @since 1.18.0
 * @category constructors
 */
export const failCause: <E>(cause: Cause.Cause<E>) => Fx<never, E, never> = core.failCause

/**
 * Construct an Fx<never, never, never> from a defect
 * @since 1.18.0
 * @category constructors
 */
export const die = (defect: unknown): Fx<never, never, never> => failCause(Cause.die(defect))

/**
 * Interrupt the current Fx with the specified FiberId
 * @since 1.18.0
 * @category constructors
 */
export const interrupt = (id: FiberId.FiberId): Fx<never, never, never> => failCause(Cause.interrupt(id))

/**
 * Construct an Fx which will fail with the specified error.
 * @since 1.18.0
 * @category constructors
 */
export const fail: <E>(error: E) => Fx<never, E, never> = core.fail

/**
 * Construct an Fx<R, E, A> from an Effect<R, E, A>
 * @since 1.18.0
 * @category constructors
 */
export const fromEffect: <R, E, A>(effect: Effect.Effect<R, E, A>) => Fx<R, E, A> = identity

/**
 * Construct an Fx from an Iterable
 * @since 1.18.0
 * @category constructors
 */
export const fromIterable: {
  <A extends ReadonlyArray<any>>(array: A): Fx<never, never, A[number]>
  <A>(iterable: Iterable<A>): Fx<never, never, A>
} = core.fromIterable

/**
 * Construct an Fx by describing an Effectful workflow that has access to a Sink
 * to emit events and errors.
 * @since 1.18.0
 * @category constructors
 */
export const fromSink: <R, E, A>(f: (sink: Sink.Sink<E, A>) => Effect.Effect<R, E, unknown>) => Fx<R, E, A> =
  core.fromSink

/**
 * An Fx which will never emit any errors or events, and will never end
 * @since 1.18.0
 * @category constructors
 */
export const never: Fx<never, never, never> = core.never

/**
 * Construct an Fx which will emit the specified value and then end.
 * @since 1.18.0
 * @category constructors
 */
export const succeed: <A>(value: A) => Fx<never, never, A> = core.succeed

/**
 * Construct an Fx which will emit the return of a synchronous function and then end.
 * @since 1.18.0
 * @category constructors
 */
export const sync: <A>(f: () => A) => Fx<never, never, A> = core.sync

/**
 * Lazily construct an Fx.
 * @since 1.18.0
 * @category constructors
 */
export const suspend: <R, E, A>(f: () => Fx<R, E, A>) => Fx<R, E, A> = core.suspend

/**
 * Helper for constructing your own custom subtypes of an Fx
 * @since 1.18.0
 * @category Subtyping
 */
export abstract class ToFx<R, E, A> extends primitive.ToFx<R, E, A> implements Fx<R, E, A> {
  /**
   * @since 1.18.0
   */
  abstract toFx(): Fx<R, E, A>
}

/**
 * Create an Fx which will emit a value after waiting for a specified duration.
 * @since 1.18.0
 * @category constructors
 */
export const at: {
  (delay: DurationInput): <A>(value: A) => Fx<never, never, A>
  <A>(value: A, delay: DurationInput): Fx<never, never, A>
} = internal.at

/**
 * Type-alias for a Effect.forkIn(scope) that returns a Fiber
 * @since 1.18.0
 * @category models
 */
export type ScopedFork = <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<R, never, Fiber.Fiber<E, A>>

/**
 * Type-alias for Effect.forkIn(scope) which runs the Effect runtime
 * of an Fx in a Scope. Used in for higher-order operators.
 *
 * @since 1.18.0
 * @category models
 */
export type FxFork = <R>(
  effect: Effect.Effect<R, never, void>
) => Effect.Effect<R, never, void>

/**
 * Params for withScopedFork
 * @since 1.18.0
 * @category params
 */
export type WithScopedForkParams<E, A> = {
  readonly sink: Sink.Sink<E, A>
  readonly fork: ScopedFork
  readonly scope: Scope.Scope
}

/**
 * Construct an Fx which can fork effects into a Scope.
 * @since 1.18.0
 * @category constructors
 */
export const withScopedFork: <R, E, A>(
  f: (params: WithScopedForkParams<E, A>) => Effect.Effect<R, never, unknown>
) => Fx<R, E, A> = core.withScopedFork

/**
 * Params for withEarlyExit
 * @since 1.18.0
 * @category params
 */
export type WithEarlyExitParams<E, A> = {
  readonly sink: Sink.WithEarlyExit<E, A>
  readonly fork: ScopedFork
  readonly scope: Scope.Scope
}

/**
 * Construct an Fx which can exit early from a Scope.
 * @since 1.18.0
 * @category constructors
 */
export const withEarlyExit: <R, E, A>(
  f: (params: WithEarlyExitParams<E, A>) => Effect.Effect<R, never, unknown>
) => Fx<R, E, A> = core.withEarlyExit

/**
 * Params for withFlattenStrategy
 * @since 1.18.0
 * @category params
 */
export type WithFlattenStrategyParams<E, A> = {
  readonly sink: Sink.Sink<E, A>
  readonly fork: FxFork
  readonly scope: Scope.Scope
}

/**
 * Construct an Fx which can flatten nested Fx.
 * @since 1.18.0
 * @category constructors
 */
export const withFlattenStrategy: <R, E, A>(
  f: (params: WithFlattenStrategyParams<E, A>) => Effect.Effect<R, never, unknown>,
  strategy: FlattenStrategy
) => Fx<R, E, A> = core.withFlattenStrategy

/* #endregion */

/* #region Additions */

/**
 * Acquire a resource, use it to construct an Fx, and then release the resource
 * after the Fx has exited.
 *
 * @since 1.18.0
 * @category constructors
 */
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

/**
 * Combine multiple Fx into a single Fx that will emit the results of all Fx
 * as a tuple of values.
 *
 * @since 1.18.0
 * @category constructors
 */
export const combine: <const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, { readonly [K in keyof FX]: Fx.Success<FX[K]> }> = core.combine

/**
 * Combine a record of Fx into a single Fx that will emit the results of all Fx
 * as a record of values.
 *
 * @since 1.18.0
 * @category constructors
 */
export const struct: <const FX extends Readonly<Record<string, Fx<any, any, any>>>>(
  fxs: FX
) => Fx<Fx.Context<FX[string]>, Fx.Error<FX[string]>, { readonly [K in keyof FX]: Fx.Success<FX[K]> }> = (fx) =>
  map(combine(Object.entries(fx).map(([k, fx]) => map(fx, (v) => [k, v] as const))), Object.fromEntries)

/**
 * Combine multiple Fx into a single Fx that will emit the results of all Fx
 * as they occur.
 * @since 1.18.0
 * @category constructors
 */
export const merge: <const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> = core.merge

/**
 * Combine multiple Fx into a single Fx that will emit the results of all Fx
 * as they occur, but only allowing `n` concurrent Fx to run at a time.
 *
 * @since 1.18.0
 * @category constructors
 */
export const mergeConcurrently: {
  (concurrency: number): <const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX
  ) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
  <const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX,
    concurrency: number
  ): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
} = core.mergeConcurrently

/**
 * Combine multiple Fx into a single Fx that will emit the results of all Fx
 * in the order the Fx were provided. All Fx will be executed concurrently,
 * and the results will be buffered if necessary to preserve ordering.
 *
 * @since 1.18.0
 * @category constructors
 */
export const mergeBuffer: <const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> = core.mergeBuffer

/**
 * Combine multiple Fx into a single Fx that will emit the results of all Fx
 * in the order the Fx were provided. All Fx will be executed concurrently, limited
 * by the provided concurrency, and the results will be buffered if necessary to preserve ordering.
 *
 * @since 1.18.0
 * @category constructors
 */
export const mergeBufferConcurrently: {
  (concurrency: number): <const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX
  ) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
  <const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX,
    concurrency: number
  ): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
} = core.mergeBufferConcurrently

/**
 * Merge together multiple Fx into a single Fx that will emit the results of all Fx
 * allowing only 1 Fx to run at a time.
 *
 * @since 1.18.0
 * @category constructors
 */
export const mergeSwitch = <const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> => core.mergeSwitch(fxs)

/**
 * Merge together multiple Fx into a single Fx that will emit the results of the
 * first Fx to emit a value.
 *
 * @since 1.18.0
 * @category constructors
 */
export const race: <const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> = core.race

/**
 * Schedule an Effect to run using the provided Schedule, emitting its success of failure
 * at the intervals specified by the Schedule.
 *
 * @since 1.18.0
 * @category constructors
 */
export const fromScheduled: {
  <R2>(scheduled: Schedule.Schedule<R2, unknown, unknown>): <R, E, A>(fx: Effect.Effect<R, E, A>) => Fx<R | R2, E, A>
  <R, E, A, R2>(fx: Effect.Effect<R, E, A>, scheduled: Schedule.Schedule<R2, unknown, unknown>): Fx<R | R2, E, A>
} = core.fromScheduled

/**
 * Schedule an Effect to run at the specified duration.
 *
 * @since 1.18.0
 * @category constructors
 */
export const periodic: {
  (duration: DurationInput): <R, E, A>(fx: Effect.Effect<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Effect.Effect<R, E, A>, duration: DurationInput): Fx<R, E, A>
} = core.periodic

/* #endregion */

/* #region Running */

/**
 * Run an Fx to completion with the provided Sink. The
 * Effect will resolve with the first Error of the Fx.
 * @since 1.18.0
 * @category running
 */
export const run: <R, E, A, R2>(
  fx: Fx<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
) => Effect.Effect<R | R2, never, unknown> = internalRun.run

/**
 * Observe an Fx with the provided success value handler. The
 * Effect will resolve with the first Error of the Fx.
 *
 * @since 1.18.0
 * @category running
 */
export const observe: {
  <A, R2, E2>(
    onSuccees: (a: A) => Effect.Effect<R2, E2, unknown>
  ): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R | R2, E | E2, void>
  <R, E, A, R2, E2>(
    fx: Fx<R, E, A>,
    onSuccees: (a: A) => Effect.Effect<R2, E2, unknown>
  ): Effect.Effect<R | R2, E | E2, void>
} = dual(2, core.observe)

/**
 * Run an Fx to completion. The Effect will resolve with the first Error of the Fx.
 *
 * @since 1.18.0
 * @category running
 */
export const drain: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, void> = core.drain

/**
 * Reduce an Fx to a single value.
 * @since 1.18.0
 * @category running
 */
export const reduce: {
  <A, B>(seed: B, f: (acc: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B): Effect.Effect<R, E, B>
} = core.reduce

/**
 * Run an Fx to completion, collecting all emitted values into an Array.
 * @since 1.18.0
 * @category running
 */
export const toArray: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, Array<A>> = core.toArray

/**
 * Run an Fx to completion, collecting all emitted values into a ReadonlyArray.
 * @since 1.18.0
 * @category running
 */
export const toReadonlyArray: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>> = core.toReadonlyArray

/**
 * Run an Fx to completion, collecting all emitted values into a Chunk.
 * @since 1.18.0
 * @category running
 */
export const toChunk: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>> = core.toChunk

/* #endregion */

/* #region Combinators */

/**
 * Map over the success value of an Fx.
 * @since 1.18.0
 * @category combinators
 */
export const map: {
  <A, B>(f: (a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B>
} = core.map

/**
 * Map over both failure and success values of an Fx.
 * @since 1.18.0
 * @category combinators
 */
export const mapBoth: {
  <E, E2, A, B>(
    options: { readonly onFailure: (e: E) => E2; readonly onSuccess: (a: A) => B }
  ): <R>(fx: Fx<R, E, A>) => Fx<R, E2, B>
  <R, E, A, E2, B>(
    fx: Fx<R, E, A>,
    options: { readonly onFailure: (e: E) => E2; readonly onSuccess: (a: A) => B }
  ): Fx<R, E2, B>
} = core.mapBoth

/**
 * Filter the success value of an Fx.
 * @since 1.18.0
 * @category combinators
 */
export const filter: {
  <A, B extends A>(f: (a: A) => a is B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <A>(f: (a: A) => boolean): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: (a: A) => a is B): Fx<R, E, B>
  <R, E, A>(fx: Fx<R, E, A>, f: (a: A) => boolean): Fx<R, E, A>
} = core.filter

/**
 * Filter and map the success value of an Fx.
 * @since 1.18.0
 * @category combinators
 */
export const filterMap: {
  <A, B>(f: (a: A) => Option.Option<B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => Option.Option<B>): Fx<R, E, B>
} = core.filterMap

/**
 * Unwrap Options by filtering any None values.
 * @since 1.18.0
 * @category combinators
 */
export const compct: <R, E, A>(fx: Fx<R, E, Option.Option<A>>) => Fx<R, E, A> = core.compact
/**
 * Map over the Cause  of an Fx.
 * @since 1.18.0
 * @category errors
 */
export const mapErrorCause: {
  <E, E2>(f: (a: Cause.Cause<E>) => Cause.Cause<E2>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => Cause.Cause<E2>): Fx<R, E2, A>
} = core.mapErrorCause

/**
 * Map over the Error of an Fx.
 * @since 1.18.0
 * @category errors
 */
export const mapError: {
  <E, E2>(f: (a: E) => E2): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (a: E) => E2): Fx<R, E2, A>
} = core.mapError

/**
 * Filter the Error of an Fx.
 * @since 1.18.0
 * @category errors
 */
export const filterCause: {
  <E, E2 extends E>(f: (a: Cause.Cause<E>) => a is Cause.Cause<E2>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <E>(f: (a: Cause.Cause<E>) => boolean): <R, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, E2 extends E, A>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => a is Cause.Cause<E2>): Fx<R, E2, A>
  <R, E, A>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => boolean): Fx<R, E, A>
} = core.filterCause

/**
 * Filter and map the Error of an Fx.
 * @since 1.18.0
 * @category errors
 */
export const filterMapCause: {
  <E, E2>(f: (a: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>): Fx<R, E2, A>
} = core.filterMapCause

/**
 * Map the success value of an Fx to another Fx, flattening the result
 * with the provided FlattenStrategy.
 * @since 1.18.0
 * @category flattening
 */
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

/**
 * Map the success value of an Fx to another Fx, switching to the latest
 * Fx emitted and interrupting the previous.
 * @since 1.18.0
 * @category flattening
 */
export const switchMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = core.switchMap

/**
 * Map the success value of an Fx to another Fx, prefering the first
 * Fx emitted and dropping any subsequent Fx until it has completed.
 * @since 1.18.0
 * @category flattening
 */
export const exhaustMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = core.exhaustMap

/**
 * Flatten a nested Fx, prefering the first
 * Fx emitted and dropping any subsequent Fx until it has completed.
 * @since 1.18.0
 * @category flattening
 */
export const exhaust: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A> = core.exhaust

/**
 * Map the success value of an Fx to another Fx, prefering the first
 * until completion, and then running the last emitted Fx if they are not
 * the same Fx.
 *
 * @since 1.18.0
 * @category flattening
 */
export const exhaustMapLatest: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = core.exhaustMapLatest

/**
 * Flatten a nested Fx, prefering the first until completion, and then running the last emitted Fx if they are not
 * the same Fx.
 *
 * @since 1.18.0
 * @category flattening
 */
export const exhaustLatest: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A> = core.exhaustLatest

/**
 * Map the success value of an Fx to another Fx with unbounded concurrency.
 *
 * @since 1.18.0
 * @category flattening
 */
export const flatMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = core.flatMap

/**
 * Map the success value of an Fx to another Fx with unbounded concurrency.
 *
 * @since 1.18.0
 * @category flattening
 */
export const flatten: <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => Fx<R | R2, E | E2, A> = core.flatten

/**
 * Map the success value of an Fx to another Fx with the specified concurrency.
 *
 * @since 1.18.0
 * @category flattening
 */
export const flatMapConcurrently: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>, concurrency: number): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>, concurrency: number): Fx<R | R2, E | E2, B>
} = core.flatMapCauseConcurrently

/**
 * Map the success value of an Fx to another Fx one at a time.
 *
 * @since 1.18.0
 * @category flattening
 */
export const concatMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = core.concatMap

/**
 * Skip and take a number of values from an Fx.
 *
 * @since 1.18.0
 * @category slicing
 */
export const slice: {
  (skip: number, take: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, skip: number, take: number): Fx<R, E, A>
} = core.slice

/**
 * Take a number of values from an Fx.
 *
 * @since 1.18.0
 * @category slicing
 */
export const take: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
} = core.take

/**
 * Drop a number of values from an Fx.
 *
 * @since 1.18.0
 * @category slicing
 */
export const drop: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
} = core.drop

/**
 * Take values from an Fx while the predicate returns true.
 *
 * @since 1.18.0
 * @category slicing
 */
export const takeWhile: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = core.takeWhile

/**
 * Take values from an Fx until the predicate returns true.
 *
 * @since 1.18.0
 * @category slicing
 */
export const takeUntil: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = core.takeUntil

/**
 * Drop values from an Fx while the predicate returns true.
 *
 * @since 1.18.0
 * @category slicing
 */
export const dropWhile: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = core.dropWhile

/**
 * Drop values from an Fx until the predicate returns true.
 *
 * @since 1.18.0
 * @category slicing
 */
export const dropUntil: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = core.dropUntil

/**
 * Drop values from an Fx after the predicate returns true.
 *
 * @since 1.18.0
 * @category slicing
 */
export const dropAfter: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = core.dropAfter

/**
 * Concatenate an Fx after the successful completion of another Fx
 *
 * @since 1.18.0
 * @category combinators
 */
export const continueWith: {
  <R2, E2, B>(f: () => Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
} = core.continueWith

/**
 * Concatenate an Fx after the failure of another Fx
 *
 * @since 1.18.0
 * @category combinators
 */
export const orElse: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, A>): Fx<R | R2, E2, A | B>
} = core.recoverWith

/**
 * Map the success value of an Fx to an Effect, doesn't fork any fibers like flatMap* etc.
 *
 * @since 1.18.0
 * @category combinators
 */
export const mapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
} = core.mapEffect

/**
 * Perform an Effect for each value emitted by an Fx, not affecting the output of the Fx.
 *
 * @since 1.18.0
 * @category combinators
 */
export const tap: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
} = core.tap

/**
 * Filter the success value of an Fx with an Effect.
 *
 * @since 1.18.0
 * @category combinators
 */
export const filterEffect: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = core.filterEffect

/**
 * Filter and map the success value of an Fx with an Effect.
 *
 * @since 1.18.0
 * @category combinators
 */
export const filterMapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): Fx<R | R2, E | E2, B>
} = core.filterMapEffect

/**
 * Apply a function to the constructed Effect that represents the running Fx.
 *
 * @since 1.18.0
 * @category combinators
 */
export const middleware: {
  <R, E, A, R2>(
    f: (effect: Effect.Effect<R, never, unknown>, sink: Sink.Sink<E, A>) => Effect.Effect<R2, never, unknown>
  ): (fx: Fx<R, E, A>) => Fx<R2, E, A>

  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (effect: Effect.Effect<R, never, unknown>, sink: Sink.Sink<E, A>) => Effect.Effect<R2, never, unknown>
  ): Fx<R2, E, A>
} = core.middleware

/**
 * Accumulate a value over the success values of an Fx and atomically produce derived value.
 *
 * @since 1.18.0
 * @category combinators
 */
export const loop: {
  <A, B, C>(seed: B, f: (acc: B, a: A) => readonly [C, B]): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, C>
  <R, E, A, B, C>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Fx<R, E, C>
} = core.loop

/**
 * Accumulate a value over the success values of an Fx and atomically produce derived value
 * useing an Effect. A SynchronizedRef is utilized to ensure ordering of events.
 *
 * @since 1.18.0
 * @category combinators
 */
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

/**
 * Prepends a value to the beginning of an Fx.
 *
 * @since 1.18.0
 * @category combinators
 */
export const startWith: {
  <B>(value: B): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A | B>
  <R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, A | B>
} = core.startWith

/**
 * Appends a value to the end of an Fx.
 *
 * @since 1.18.0
 * @category combinators
 */
export const endWith: {
  <B>(value: B): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A | B>
  <R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, A | B>
} = core.endWith

/**
 * Run a reducer over the success values of an Fx.
 *
 * @since 1.18.0
 * @category combinators
 */
export const scan: {
  <A, B>(seed: B, f: (acc: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B): Fx<R, E, B>
} = core.scan

/**
 * Run an Effect-ful reducer over the success values of an Fx.
 *
 * @since 1.18.0
 * @category combinators
 */
export const scanEffect: {
  <A, B, R2, E2>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, B>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, B, R2, E2>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
} = core.scanEffect

/**
 * Map the failures of an Fx to another Fx, flattening the result
 * with the provided FlattenStrategy.
 * @since 1.18.0
 * @category flattening
 */
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

/**
 * Map the failures of an Fx to another Fx, flattening the result with unbounded concurrency.
 *
 * @since 1.18.0
 * @category flattening
 */
export const flatMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = core.flatMapCause

/**
 * Map the failures of an Fx to another Fx with the specified concurrency.
 *
 * @since 1.18.0
 * @category flattening
 */
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

/**
 * Map the failures of an Fx to another Fx, switching to the latest
 * Fx emitted and interrupting the previous.
 *
 * @since 1.18.0
 * @category flattening
 */
export const switchMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = core.switchMapCause

/**
 * Map the failures of an Fx to another Fx, prefering the first
 * Fx emitted and dropping any subsequent Fx until it has completed.
 *
 * @since 1.18.0
 * @category flattening
 */
export const exhaustMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = core.exhaustMapCause

/**
 * Map the failures of an Fx to another Fx, prefering the first
 * until completion, and then running the last emitted Fx if they are not
 * the same Fx.
 *
 * @since 1.18.0
 * @category flattening
 */
export const exhaustMapLatestCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = core.exhaustMapLatestCause

/**
 * Map over the failures and successes of an Fx, flattening both using the same strategy.
 *
 * @since 1.18.0
 * @category flattening
 */
export const matchCauseWithStrategy: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
      readonly strategy: FlattenStrategy
    }
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R2 | R, E2, B | A>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
      readonly strategy: FlattenStrategy
    }
  ): Fx<R | R2, E2 | E3, B | C>
} = core.matchCauseWithStrategy

/**
 * Map over the failures and successes of an Fx, flattening both with unbounded concurrency.
 *
 * @since 1.18.0
 * @category flattening
 */
export const matchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
    }
  ): <R>(fx: Fx<R, E, A>) => Fx<R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = core.matchCause

/**
 * Map over the failures and successes of an Fx, flattening both with the specified concurrency.
 *
 * @since 1.18.0
 * @category flattening
 */
export const matchCauseConcurrently: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
      readonly concurrency: number
    }
  ): <R>(fx: Fx<R, E, A>) => Fx<R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
      readonly concurrency: number
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = core.matchCauseConcurrently

/**
 * Map over the failures and successes of an Fx, switching to the latest
 * Fx emitted and interrupting the previous.
 *
 * @since 1.18.0
 * @category flattening
 */
export const switchMatchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
    }
  ): <R>(fx: Fx<R, E, A>) => Fx<R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = core.switchMatchCause

/**
 * Map over the failures and successes of an Fx, prefering the first
 * Fx emitted and dropping any subsequent Fx until it has completed.
 *
 * @since 1.18.0
 * @category flattening
 */
export const exhaustMatchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
    }
  ): <R>(fx: Fx<R, E, A>) => Fx<R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = core.exhaustMatchCause

/**
 * Map over the failures and successes of an Fx, prefering the first
 *
 * @since 1.18.0
 * @category flattening
 */
export const exhaustLatestMatchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
    }
  ): <R>(fx: Fx<R, E, A>) => Fx<R2 | R3 | R, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
      readonly onSuccess: (a: A) => Fx<R3, E3, C>
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = core.exhaustLatestMatchCause

/**
 * Listen to the events of an Fx within the provided window. When the window Fx
 * emits the inner stream, the fx will begin allowing events to pass through,
 * and when the inner stream emits, the fx will be interrupted.
 *
 * @since 1.18.0
 * @category time slicing
 */
export const during: {
  <R2, E2, R3, E3>(
    window: Fx<R2, E2, Fx<R3, E3, unknown>>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E | E2 | E3, A>

  <R, E, A, R2, E2, R3, E3>(
    fx: Fx<R, E, A>,
    window: Fx<R2, E2, Fx<R3, E3, unknown>>
  ): Fx<R | R2 | R3, E | E2 | E3, A>
} = core.during

/**
 * Listen to the events of an Fx after the provided window emits.
 *
 * @since 1.18.0
 * @category time slicing
 */
export const since: {
  <R2, E2>(window: Fx<R2, E2, unknown>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, window: Fx<R2, E2, unknown>): Fx<R | R2, E | E2, A>
} = core.since

/**
 * Listen to the events of an Fx until the provided window emits.
 *
 * @since 1.18.0
 * @category time slicing
 */
export const until: {
  <R2, E2>(window: Fx<R2, E2, unknown>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, window: Fx<R2, E2, unknown>): Fx<R | R2, E | E2, A>
} = core.until

/**
 * Provide the environment to an Fx.
 *
 * @since 1.18.0
 * @category context
 */
export const provideContext: {
  <R>(context: Context<R>): <E, A>(fx: Fx<R, E, A>) => Fx<never, E, A>
  <R, E, A>(fx: Fx<R, E, A>, context: Context<R>): Fx<never, E, A>
} = core.provideContext

/**
 * Provide some of the environment to an Fx.
 *
 * @since 1.18.0
 * @category context
 */
export const provideSomeContext: {
  <R2>(context: Context<R2>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, R2>, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, context: Context<R2>): Fx<Exclude<R, R2>, E, A>
} = core.provideSomeContext

/**
 * Provide the environment to an Fx using a Layer.
 *
 * @since 1.18.0
 * @category context
 */
export const provideLayer: {
  <R2, E2, R>(layer: Layer.Layer<R2, E2, R>): <E, A>(fx: Fx<R, E, A>) => Fx<R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, R>): Fx<R2, E | E2, A>
} = core.provideLayer

/**
 * Provide some of the environment to an Fx using a Layer.
 *
 * @since 1.18.0
 * @category context
 */
export const provideSomeLayer: {
  <R2, E2, S>(layer: Layer.Layer<R2, E2, S>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | Exclude<R, S>, E | E2, A>
  <R, E, A, R2, E2, S>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, S>): Fx<R2 | Exclude<R, S>, E | E2, A>
} = core.provideSomeLayer

/**
 * Provide a service to an Fx using a Tag.
 * @since 1.18.0
 * @category context
 */
export const provideService: {
  <I, S>(tag: Tag<I, S>, service: S): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, I>, E, A>
  <R, E, A, I, S>(fx: Fx<R, E, A>, tag: Tag<I, S>, service: S): Fx<Exclude<R, I>, E, A>
} = core.provideService

/**
 * Provide a service using an Effect to an Fx using a Tag.
 *
 * @since 1.18.0
 * @category context
 */
export const provideServiceEffect: {
  <I, S, R2, E2>(
    tag: Tag<I, S>,
    service: Effect.Effect<R2, E2, S>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | Exclude<R, I>, E, A>
  <R, E, A, I, S, R2, E2>(
    fx: Fx<R, E, A>,
    tag: Tag<I, S>,
    service: Effect.Effect<R2, E2, S>
  ): Fx<R2 | Exclude<R, I>, E, A>
} = core.provideServiceEffect

/**
 * Skip repeated values, using the provided Equivalence to compare values.
 *
 * @since 1.18.0
 * @category slicing
 */
export const skipRepeatsWith: {
  <A>(eq: Equivalence<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, eq: Equivalence<A>): Fx<R, E, A>
} = core.skipRepeatsWith

/**
 * Skip repeated values, using @effect/data/Equal for value comparison.
 *
 * @since 1.18.0
 * @category slicing
 */
export const skipRepeats: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = core.skipRepeats

/**
 * Sample the values of an Fx, or Effect, during the events of another Fx.
 *
 * @since 1.18.0
 * @category combinators
 */
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

/**
 * Share the output of an Fx, or Effect, with other Fx's using the behavior of the
 * provided Subject.
 *
 * @since 1.18.0
 * @category sharing
 */
export const share: <R, E, A, R2>(fx: Fx<R, E, A>, subject: Subject<R2, E, A>) => Fx<R | R2, E, A> = Share.share

/**
 * Effeciently share an underlying stream with multiple subscribers.
 *
 * @since 1.18.0
 * @category sharing
 */
export const multicast: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = Share.multicast

/**
 * Effeciently share an underlying stream with multiple subscribers, saving the most
 * recent event and emitting it to new subscribers.
 *
 * @since 1.18.0
 * @category sharing
 */
export const hold: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = Share.hold

/**
 * Effeciently share an underlying stream with multiple subscribers,
 * saving up to the most recent `n` events and emitting them to new subscribers.
 *
 * @since 1.18.0
 * @category sharing
 */
export const replay: {
  (capacity: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, capacity: number): Fx<R, E, A>
} = Share.replay

/**
 * Create an Fx which will wait a specified duration of time where no
 * events have occurred before emitting a value.
 * @since 1.18.0
 * @category time slicing
 */
export const debounce: {
  (delay: DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: DurationInput): Fx<R, E, A>
} = internal.debounce

/**
 * Create an Fx which will wait a specified duration of time before emitting
 * an event after the last event.
 * @since 1.18.0
 * @category time slicing
 */
export const throttle: {
  (delay: DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: DurationInput): Fx<R, E, A>
} = internal.throttle

/**
 * Create an Fx which will wait a specified duration of time where no
 * events have occurred before emitting a value.
 * @since 1.18.0
 * @category combinators
 */
export const delay: {
  (delay: DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: DurationInput): Fx<R, E, A>
} = internal.delay

/**
 * Run an Effect to produce an Fx to run.
 * @since 1.18.0
 * @category constructors
 */
export const fromFxEffect: <R, E, R2, E2, B>(fxEffect: Effect.Effect<R, E, Fx<R2, E2, B>>) => Fx<R | R2, E | E2, B> =
  internal.fromFxEffect

/**
 * Extract the context from an EffectGen
 * @since 1.18.0
 */
export type EffectGenContext<T> = [T] extends [never] ? never
  : [T] extends [Effect.EffectGen<infer R, any, any>] ? R
  : never

/**
 * Extract the error from an EffectGen
 * @since 1.18.0
 */
export type EffectGenError<T> = [T] extends [never] ? never
  : [T] extends [Effect.EffectGen<any, infer E, any>] ? E
  : never

/**
 * Extract the success value from an EffectGen
 * @since 1.18.0
 */
export type EffectGenSuccess<T> = [T] extends [never] ? never
  : [T] extends [Effect.EffectGen<any, any, infer A>] ? A
  : never

/**
 * Utilize Effect.gen to construct an Fx
 * @since 1.18.0
 * @category constructors
 */
export function gen<Yield extends Effect.EffectGen<any, any, any>, R, E, A>(
  f: () => Generator<Yield, Fx<R, E, A>, any>
): Fx<R | EffectGenContext<Yield>, E | EffectGenError<Yield>, A> {
  return fromFxEffect(Effect.gen(f))
}

/**
 * Run an Effect when an Fx exits
 * @since 1.18.0
 * @category lifecycles
 */
export const onExit: {
  <R2>(
    f: (exit: Exit.Exit<never, unknown>) => Effect.Effect<R2, never, unknown>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E, A>
  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (exit: Exit.Exit<never, unknown>) => Effect.Effect<R2, never, unknown>
  ): Fx<R | R2, E, A>
} = internal.onExit

/**
 * Run an Effect when an Fx is interrupted
 * @since 1.18.0
 * @category lifecycles
 */
export const onInterrupt: {
  <R2>(
    f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<R2, never, unknown>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E, A>
  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<R2, never, unknown>
  ): Fx<R | R2, E, A>
} = internal.onInterrupt

/**
 * Run an Effect when an Fx ends with an error
 * @since 1.18.0
 * @category lifecycles
 */
export const onError: {
  <R2>(
    f: (cause: Cause.Cause<never>) => Effect.Effect<R2, never, unknown>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E, A>
  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<never>) => Effect.Effect<R2, never, unknown>
  ): Fx<R | R2, E, A>
} = internal.onError

/**
 * Provide a Scope to an Fx
 * @since 1.18.0
 * @category context
 */
export const scoped: <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, Scope.Scope>, E, A> = internal.scoped

/**
 * Annotate the logs of an Fx
 * @since 1.18.0
 * @category combinators
 */
export const annotateLogs: {
  (key: string, value: Logger.AnnotationValue): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  (values: Record<string, Logger.AnnotationValue>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, key: string, value: Logger.AnnotationValue): Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, values: Record<string, Logger.AnnotationValue>): Fx<R, E, A>
} = internal.annotateLogs

/**
 * Annotate the spans of an Fx
 * @since 1.18.0
 * @category combinators
 */
export const annotateSpans: {
  (key: string, value: Tracer.AttributeValue): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  (values: Record<string, Tracer.AttributeValue>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, key: string, value: Tracer.AttributeValue): Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, values: Record<string, Tracer.AttributeValue>): Fx<R, E, A>
} = internal.annotateSpans

/**
 * Create an Fx which will succeed with Option.None
 * @since 1.18.0
 * @category constructors
 */
export const succeedNone: <A = never>() => Fx<never, never, Option.Option<A>> = internal.succeedNone

/**
 * Create an Fx which will succeed with Option.Some
 * @since 1.18.0
 * @category constructors
 */
export const succeedSome: <A>(value: A) => Fx<never, never, Option.Option<A>> = internal.succeedSome

/**
 * Do simulation
 * @since 1.18.0
 * @category Do
 */
export const Do: Fx<never, never, {}> = internal.Do

/**
 * Do simulation
 * @since 1.18.0
 * @category Do
 */
export const bind: {
  <N extends string, A extends object, R2, E2, B>(
    name: Exclude<N, keyof A>,
    f: (a: A) => Fx<R2, E2, B>
  ): <R1, E1>(self: Fx<R1, E1, A>) => Fx<R2 | R1, E2 | E1, { [K in N | keyof A]: K extends keyof A ? A[K] : B }>
  <R1, E1, A1 extends object, N extends string, R2, E2, B>(
    self: Fx<R1, E1, A1>,
    name: Exclude<N, keyof A1>,
    f: (a: A1) => Fx<R2, E2, B>
  ): Fx<R1 | R2, E1 | E2, { [K in N | keyof A1]: K extends keyof A1 ? A1[K] : B }>
} = internal.bind

/**
 * Do simulation
 * @since 1.18.0
 * @category Do
 */
export const bindTo: {
  <N extends string>(name: N): <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, { [K in N]: A }>
  <R, E, A, N extends string>(self: Fx<R, E, A>, name: N): Fx<R, E, { [K_1 in N]: A }>
} = internal.bindTo

const let_: {
  <N extends string, A extends object, B>(
    name: Exclude<N, keyof A>,
    f: (a: A) => B
  ): <R1, E1>(self: Fx<R1, E1, A>) => Fx<R1, E1, { [K in N | keyof A]: K extends keyof A ? A[K] : B }>
  <R1, E1, A1 extends object, N extends string, B>(
    self: Fx<R1, E1, A1>,
    name: Exclude<N, keyof A1>,
    f: (a: A1) => B
  ): Fx<R1, E1, { [K in N | keyof A1]: K extends keyof A1 ? A1[K] : B }>
} = internal.let

export {
  /**
   * Do simulation
   * @since 1.18.0
   * @category Do
   */
  let_ as let
}

/**
 * Ensure a finalizer runs on Fx ext.
 * @since 1.18.0
 * @category combinators
 */
export const ensuring: {
  <R2>(finalizer: Effect.Effect<R2, never, unknown>): <R, E, A>(self: Fx<R, E, A>) => Fx<R2 | R, E, A>
  <R, E, A, R2>(self: Fx<R, E, A>, finalizer: Effect.Effect<R2, never, unknown>): Fx<R | R2, E, A>
} = internal.ensuring

/**
 * Capture the errors and success values as Exit
 * @since 1.18.0
 * @category combinators
 */
export const exit: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, never, Exit.Exit<E, A>> = internal.exit

/**
 * Capture the errors and success values as Either
 * @since 1.18.0
 * @category combinators
 */
export const either: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, never, Either.Either<E, A>> = internal.either

/**
 * Run an Fx until finding a value which satisfies the predicate.
 * @since 1.18.0
 * @category running
 */
export const findFirst: {
  <A, R2, E2>(
    f: (a: A) => Effect.Effect<R2, E2, boolean>
  ): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R2 | R, E2 | E, Option.Option<A>>
  <R, E, A, R2, E2>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Effect.Effect<R | R2, E | E2, Option.Option<A>>
} = internal.findFirst

/**
 * Transform success values into failures and failures into successes.
 * @since 1.18.0
 * @category combinators
 */
export const flip: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, A, E> = internal.flip

/**
 * Lift a nullable value into an Fx
 * @since 1.18.0
 * @category constructors
 */
export const fromNullable: <A>(value: void | A | null | undefined) => Fx<never, never, NonNullable<A>> =
  internal.fromNullable

const if_: {
  <R2, E2, B, R3, E3, C>(
    options: { readonly onTrue: Fx<R2, E2, B>; readonly onFalse: Fx<R3, E3, C> }
  ): {
    <R, E>(bool: Fx<R, E, boolean>): Fx<R2 | R3 | R, E2 | E3 | E, B | C>
    (bool: boolean): Fx<R2 | R3, E2 | E3, B | C>
  }
  <R, E, R2, E2, B, R3, E3, C>(
    bool: Fx<R, E, boolean>,
    options: { readonly onTrue: Fx<R2, E2, B>; readonly onFalse: Fx<R3, E3, C> }
  ): Fx<R | R2 | R3, E | E2 | E3, B | C>
  <R2, E2, B, R3, E3, C>(
    bool: boolean,
    options: { readonly onTrue: Fx<R2, E2, B>; readonly onFalse: Fx<R3, E3, C> }
  ): Fx<R2 | R3, E2 | E3, B | C>
} = internal.if

export {
  /**
   * Logical if/else using Fx.
   * @since 1.18.0
   * @category combinators
   */
  if_ as if
}

/**
 * Mark an Fx as interruptible
 * @since 1.18.0
 * @category combinators
 */
export const interruptible: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = internal.interruptible

/**
 * Mark an Fx as uninterruptible
 * @since 1.18.0
 * @category combinators
 */
export const uninterruptible: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = internal.uninterruptible

/**
 * Locally set the value of a FiberRef
 * @since 1.18.0
 * @category FiberRef
 */
export const locally: {
  <A>(self: FiberRef<A>, value: A): <R, E, B>(use: Fx<R, E, B>) => Fx<R, E, B>
  <R, E, B, A>(use: Fx<R, E, B>, self: FiberRef<A>, value: A): Fx<R, E, B>
} = internal.locally

/**
 * Locally set the value of a FiberRef by updating the current value
 * @since 1.18.0
 * @category FiberRef
 */
export const locallyWith: {
  <A>(self: FiberRef<A>, f: (a: A) => A): <R, E, B>(use: Fx<R, E, B>) => Fx<R, E, B>
  <R, E, B, A>(use: Fx<R, E, B>, self: FiberRef<A>, f: (a: A) => A): Fx<R, E, B>
} = internal.locallyWith

/**
 * Enable/disable tracer timing for an Fx
 * @since 1.18.0
 * @category tracing
 */
export const withTracerTiming: {
  (enabled: boolean): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, enabled: boolean): Fx<R, E, A>
} = internal.withTracerTiming

/**
 * Configure the concurreny limit of Fibers running within an Fx
 * @since 1.18.0
 * @category concurrency
 */
export const withConcurrency: {
  (concurrency: number | "unbounded"): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, concurrency: number | "unbounded"): Fx<R, E, A>
} = internal.withConcurrency

/**
 * Add a span to your log messages
 * @since 1.18.0
 * @category logging
 */
export const withLogSpan: {
  (span: string): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, span: string): Fx<R, E, A>
} = internal.withLogSpan

/**
 * Configure the maximum number of operations to run before yielding to the runtime
 * @since 1.18.0
 * @category concurrency
 */
export const withMaxOpsBeforeYield: {
  (maxOps: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, maxOps: number): Fx<R, E, A>
} = internal.withMaxOpsBeforeYield

/**
 * Set the parent Span of an Fx
 * @since 1.18.0
 * @category tracing
 */
export const withParentSpan: {
  (parentSpan: Tracer.ParentSpan): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, parentSpan: Tracer.ParentSpan): Fx<R, E, A>
} = internal.withParentSpan

/**
 * Enable/disable request batching within an Fx
 * @since 1.18.0
 * @category batching
 */
export const withRequestBatching: {
  (requestBatching: boolean): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, requestBatching: boolean): Fx<R, E, A>
} = internal.withRequestBatching

/**
 * Set the request cache Effects running within an Fx
 * @since 1.18.0
 * @category batching
 */
export const withRequestCache: {
  (cache: Request.Cache): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, cache: Request.Cache): Fx<R, E, A>
} = internal.withRequestCache

/**
 * Enable/disable request caching within an Fx
 * @since 1.18.0
 * @category batching
 */
export const withRequestCaching: {
  (requestCaching: boolean): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, requestCaching: boolean): Fx<R, E, A>
} = internal.withRequestCaching

/**
 * Configure the scheduler to use within an Fx
 * @since 1.18.0
 * @category concurrency
 */
export const withScheduler: {
  (scheduler: Scheduler): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, scheduler: Scheduler): Fx<R, E, A>
} = internal.withScheduler

/**
 * Set the span of an Fx
 * @since 1.18.0
 * @category tracing
 */
export const withSpan: {
  (
    name: string,
    options?: {
      readonly attributes?: Record<string, Tracer.AttributeValue>
      readonly links?: ReadonlyArray<Tracer.SpanLink>
      readonly parent?: Tracer.ParentSpan
      readonly root?: boolean
      readonly context?: Context<never>
    }
  ): <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(
    self: Fx<R, E, A>,
    name: string,
    options?: {
      readonly attributes?: Record<string, Tracer.AttributeValue>
      readonly links?: ReadonlyArray<Tracer.SpanLink>
      readonly parent?: Tracer.ParentSpan
      readonly root?: boolean
      readonly context?: Context<never>
    }
  ): Fx<R, E, A>
} = internal.withSpan

/**
 * Set the tracer used within an Fx
 * @since 1.18.0
 * @category tracing
 */
export const withTracer: {
  (tracer: Tracer.Tracer): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, tracer: Tracer.Tracer): Fx<R, E, A>
} = internal.withTracer

/**
 * Partition an Fx into two Fx's based on a either-returning function.
 * @since 1.18.0
 * @category combinators
 */
export const partitionMap: {
  <A, B, C>(f: (a: A) => Either.Either<B, C>): <R, E>(self: Fx<R, E, A>) => readonly [Fx<R, E, B>, Fx<R, E, C>]
  <R, E, A, B, C>(self: Fx<R, E, A>, f: (a: A) => Either.Either<B, C>): readonly [Fx<R, E, B>, Fx<R, E, C>]
} = internal.partitionMap

/**
 * Convert a list of keyed values into persistent workflows for given each key of the list
 * even when the list has been re-ordered.
 *
 * @since 1.18.0
 */
export const keyed: {
  <A, R2, E2, B, C>(
    f: (
      ref: RefSubject<never, A>,
      key: C
    ) => Fx<R2, E2, B>,
    getKey: (a: A) => C
  ): <R, E>(fx: Fx<R, E, ReadonlyArray<A>>) => Fx<R | R2, E | E2, ReadonlyArray<B>>

  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, ReadonlyArray<A>>,
    f: (
      ref: RefSubject<never, A>,
      key: C
    ) => Fx<R2, E2, B>,
    getKey: (a: A) => C
  ): Fx<R | R2, E | E2, ReadonlyArray<B>>
} = dual(3, internalKeyed.keyed)

/* #endregion */
