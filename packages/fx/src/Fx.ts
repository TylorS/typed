import type * as Ctx from "@typed/context"
import type {
  ConfigProvider,
  Duration,
  Equivalence,
  ExecutionStrategy,
  Exit,
  Fiber,
  FiberId,
  FiberRef,
  HashSet,
  Pipeable,
  Predicate,
  PubSub,
  Request,
  Runtime,
  Scope,
  Tracer
} from "effect"
import { Cause, Effect, Either, Layer, Option, Queue, Schedule } from "effect"
import type { DurationInput } from "effect/Duration"
import { dual, identity } from "effect/Function"
import type * as Types from "effect/Types"
import * as Emitter from "./Emitter.js"
import * as core from "./internal/core.js"
import * as coreKeyed from "./internal/keyed.js"
import * as protos from "./internal/protos.js"
import * as coreShare from "./internal/share.js"
import * as strategies from "./internal/strategies.js"
import * as coreWithKey from "./internal/withKey.js"
import { type RefSubject, transform } from "./RefSubject.js"
import * as Sink from "./Sink.js"
import type * as Subject from "./Subject.js"
import { TypeId } from "./TypeId.js"

export interface Fx<out R, out E, out A> extends Pipeable.Pipeable {
  readonly [TypeId]: Fx.Variance<R, E, A>

  run<R2 = never>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown>
}

export namespace Fx {
  export interface Variance<R, E, A> {
    readonly _R: Types.Covariant<R>
    readonly _E: Types.Covariant<E>
    readonly _A: Types.Covariant<A>
  }

  export type Context<T> = T extends Fx<infer R, infer _E, infer _A> ? R : never

  export type Error<T> = T extends Fx<infer _R, infer E, infer _A> ? E : never

  export type Success<T> = T extends Fx<infer _R, infer _E, infer A> ? A : never

  export type Unify<T> = T extends Fx<infer R, infer E, infer A> | infer _ ? Fx<R, E, A> : never
}

export type Context<T> = Fx.Context<T>

export type Error<T> = Fx.Error<T>

export type Success<T> = Fx.Success<T>

export type Unify<T> = Fx.Unify<T>

export function isFx<R, E, A>(u: unknown): u is Fx<R, E, A> {
  return u === null ? false : typeof u === "object" && TypeId in u
}

/**
 * FlattenStrategy is a representation of how higher-order effect operators should flatten
 * nested Fx.
 *
 * @since 1.20.0
 * @category FlattenStrategy
 */
export type FlattenStrategy = Unbounded | Bounded | Switch | Exhaust | ExhaustLatest

/**
 * Strategy which will allow for an unbounded number of concurrent effects to be run.
 * @since 1.20.0
 * @category FlattenStrategy
 */
export interface Unbounded {
  readonly _tag: "Unbounded"
}

/**
 * Singleton instance of Unbounded
 * @since 1.20.0
 * @category FlattenStrategy
 */
export const Unbounded: Unbounded = strategies.Unbounded

/**
 * Strategy which will allow for a bounded number of concurrent effects to be run.
 * @since 1.20.0
 * @category FlattenStrategy
 */
export interface Bounded {
  readonly _tag: "Bounded"
  readonly capacity: number
}

/**
 * Construct a Bounded strategy
 * @since 1.20.0
 * @category FlattenStrategy
 */
export const Bounded: (capacity: number) => Bounded = strategies.Bounded

/**
 * Strategy which will switch to a new effect as soon as it is available.
 * @since 1.20.0
 * @category FlattenStrategy
 */
export interface Switch {
  readonly _tag: "Switch"
}

/**
 * Singleton instance of Switch
 * @since 1.20.0
 * @category FlattenStrategy
 */
export const Switch: Switch = strategies.Switch

/**
 * Strategy which will always favor the first Fx, dropping any Fx emitted while
 * the first Fx is still running. When the first Fx finished, the next event
 * will execute.
 *
 * @since 1.20.0
 * @category FlattenStrategy
 */
export interface Exhaust {
  readonly _tag: "Exhaust"
}

/**
 * Singleton instance of Exhaust
 * @since 1.20.0
 * @category FlattenStrategy
 */
export const Exhaust: Exhaust = strategies.Exhaust

/**
 * Strategy which will always favor the latest Fx, dropping any Fx emitted while
 * the latest Fx is still running. When the latest Fx finishes, the last seend event
 * will execute.
 *
 * @since 1.20.0
 * @category FlattenStrategy
 */
export interface ExhaustLatest {
  readonly _tag: "ExhaustLatest"
}

/**
 * Singleton instance of ExhaustLatest
 * @since 1.20.0
 * @category FlattenStrategy
 */
export const ExhaustLatest: ExhaustLatest = strategies.ExhaustLatest

/**
 * MergeStrategy is a representation of how multiple Fx should be merged together.
 * @since 1.20.0
 * @category MergeStrategy
 */
export type MergeStrategy = Unordered | Ordered | Switch

/**
 * Strategy which will merge Fx in an unordered fashion.
 * @since 1.20.0
 * @category MergeStrategy
 */
export interface Unordered {
  readonly _tag: "Unordered"
  readonly concurrency: number
}

/**
 * Construct an Unordered strategy
 * @since 1.20.0
 * @category MergeStrategy
 */
export const Unordered: (concurrency: number) => Unordered = strategies.Unordered

/**
 * Strategy which will merge Fx in an ordered fashion with
 * the specified level of concurrency.
 * @since 1.20.0
 * @category MergeStrategy
 */
export interface Ordered {
  readonly _tag: "Ordered"
  readonly concurrency: number
}

/**
 * Construct an Ordered strategy
 * @since 1.20.0
 * @category MergeStrategy
 */
export const Ordered: (concurrency: number) => Ordered = strategies.Ordered

/* #endregion */

/**
 * Type-alias for a Effect.forkIn(scope) that returns a Fiber
 * @since 1.20.0
 * @category models
 */
export type ScopedFork = <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<R, never, Fiber.Fiber<E, A>>

/**
 * Type-alias for Effect.forkIn(scope) which runs the Effect runtime
 * of an Fx in a Scope. Used in for higher-order operators.
 *
 * @since 1.20.0
 * @category models
 */
export type FxFork = <R>(
  effect: Effect.Effect<R, never, void>
) => Effect.Effect<R, never, void>

export const make: {
  <R, E, A>(run: (sink: Sink.Sink<never, E, A>) => Effect.Effect<R, never, unknown>): Fx<R, E, A>
  <E, A>(run: (sink: Sink.Sink<never, E, A>) => Effect.Effect<never, never, unknown>): Fx<never, E, A>
  <A>(run: (sink: Sink.Sink<never, never, A>) => Effect.Effect<never, never, unknown>): Fx<never, never, A>
} = core.make

export const succeed: <A>(value: A) => Fx<never, never, A> = core.succeed

export const sync: <A>(f: () => A) => Fx<never, never, A> = core.fromSync

export const fromArray: <const A extends ReadonlyArray<any>>(array: A) => Fx<never, never, A[number]> = core.fromArray

export const fromIterable: <A>(iterable: Iterable<A>) => Fx<never, never, A> = core.fromIterable

export const fromEffect: <R, E, A>(effect: Effect.Effect<R, E, A>) => Fx<R, E, A> = core.fromEffect

export const fromScheduled: {
  <R2, I, O>(
    schedule: Schedule.Schedule<R2, I, O>
  ): <R, E>(input: Effect.Effect<R, E, I>) => Fx<R | R2, E, O>

  <R, E, I, R2, O>(
    input: Effect.Effect<R, E, I>,
    schedule: Schedule.Schedule<R2, I, O>
  ): Fx<R | R2, E, O>
} = dual(2, core.fromScheduled)

export const schedule: {
  <R2, O>(
    schedule: Schedule.Schedule<R2, unknown, O>
  ): <R, E, A>(input: Effect.Effect<R, E, A>) => Fx<R | R2, E, A>

  <R, E, A, R2, O>(
    input: Effect.Effect<R, E, A>,
    schedule: Schedule.Schedule<R2, unknown, O>
  ): Fx<R | R2, E, A>
} = dual(2, core.schedule)

export const periodic: {
  (period: Duration.DurationInput): <R, E, A>(iterator: Effect.Effect<R, E, A>) => Fx<R, E, A>
  <R, E, A>(iterator: Effect.Effect<R, E, A>, period: Duration.DurationInput): Fx<R, E, A>
} = dual(2, <R, E, A>(
  iterator: Effect.Effect<R, E, A>,
  period: Duration.DurationInput
): Fx<R, E, A> => continueWith(fromEffect(iterator), () => schedule(iterator, Schedule.spaced(period))))

export const failCause: <E>(cause: Cause.Cause<E>) => Fx<never, E, never> = core.failCause

export const fail: <E>(error: E) => Fx<never, E, never> = core.fail

export const die: (error: unknown) => Fx<never, never, never> = core.die

export const map: {
  <A, B>(f: (a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B>
} = dual(2, core.map)

export const filter: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <A>(f: Predicate.Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: Predicate.Refinement<A, B>): Fx<R, E, B>
  <R, E, A>(fx: Fx<R, E, A>, f: Predicate.Predicate<A>): Fx<R, E, A>
} = dual(2, core.filter)

export const filterMap: {
  <A, B>(f: (a: A) => Option.Option<B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => Option.Option<B>): Fx<R, E, B>
} = dual(2, core.filterMap)

export const compact = <R, E, A>(fx: Fx<R, E, Option.Option<A>>): Fx<R, E, A> => filterMap(fx, identity)

export const mapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(2, core.mapEffect)

export const filterMapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): Fx<R | R2, E | E2, B>
} = dual(2, core.filterMapEffect)

export const filterEffect: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(2, core.filterEffect)

export const tapEffect: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, unknown>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, unknown>): Fx<R | R2, E | E2, A>
} = dual(2, core.tapEffect)

export const tap: {
  <A>(f: (a: A) => unknown): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, f: (a: A) => unknown): Fx<R, E, A>
} = dual(2, (fx, f) => tapEffect(fx, (a) => Effect.sync(() => f(a))))

export const loop: {
  <B, A, C>(seed: B, f: (acc: B, a: A) => readonly [C, B]): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, C>
  <R, E, A, B, C>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Fx<R, E, C>
} = dual(3, core.loop)

export const filterMapLoop: {
  <B, A, C>(seed: B, f: (acc: B, a: A) => readonly [Option.Option<C>, B]): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, C>
  <R, E, A, B, C>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => readonly [Option.Option<C>, B]): Fx<R, E, C>
} = dual(3, core.filterMapLoop)

export const loopEffect: {
  <R2, E2, B, A, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, C>
  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>
  ): Fx<R | R2, E | E2, C>
} = dual(3, core.loopEffect)

export const filterMapLoopEffect: {
  <R2, E2, B, A, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [Option.Option<C>, B]>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, C>
  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [Option.Option<C>, B]>
  ): Fx<R | R2, E | E2, C>
} = dual(3, core.filterMapLoopEffect)

export const observe: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R | R2, E | E2, void>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Effect.Effect<R | R2, E | E2, void>
} = dual(2, core.observe)

export const drain: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, void> = core.drain

export const reduce: {
  <A, B>(seed: B, f: (acc: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B): Effect.Effect<R, E, B>
} = dual(3, core.reduce)

export const toReadonlyArray: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>> = core.toReadonlyArray

export const slice: {
  (drop: number, take: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, drop: number, take: number): Fx<R, E, A>
} = dual(3, core.slice)

export const take: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
} = dual(2, core.take)

export const drop: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
} = dual(2, core.drop)

export const skipRepeats: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = core.skipRepeats

export const skipRepeatsWith: {
  <A>(eq: Equivalence.Equivalence<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, eq: Equivalence.Equivalence<A>): Fx<R, E, A>
} = dual(2, core.skipRepeatsWith)

export const empty: Fx<never, never, never> = core.empty

export const never: Fx<never, never, never> = core.never

export const padWith: {
  <B, C>(start: Iterable<B>, end: Iterable<C>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A | B | C>
  <R, E, A, B, C>(fx: Fx<R, E, A>, start: Iterable<B>, end: Iterable<C>): Fx<R, E, A | B | C>
} = dual(3, core.padWith)

export const prependAll: {
  <B>(start: Iterable<B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A | B>
  <R, E, A, B>(fx: Fx<R, E, A>, start: Iterable<B>): Fx<R, E, A | B>
} = dual(2, core.prependAll)

export const appendAll: {
  <C>(end: Iterable<C>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A | C>
  <R, E, A, C>(fx: Fx<R, E, A>, end: Iterable<C>): Fx<R, E, A | C>
} = dual(2, core.appendAll)

export const prepend: {
  <B>(start: B): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A | B>
  <R, E, A, B>(fx: Fx<R, E, A>, start: B): Fx<R, E, A | B>
} = dual(2, core.prepend)

export const append: {
  <C>(end: C): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A | C>
  <R, E, A, C>(fx: Fx<R, E, A>, end: C): Fx<R, E, A | C>
} = dual(2, core.append)

export const scan: {
  <B, A>(seed: B, f: (b: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (b: B, a: A) => B): Fx<R, E, B>
} = dual(3, core.scan)

export const flatMapWithStrategy: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>,
    strategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E | E2, B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    strategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): Fx<R | R2 | Scope.Scope, E | E2, B>
} = dual(4, core.flatMapWithStrategy)

const isDataFirstFx = (args: IArguments) => isFx(args[0])

export const flatMap: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E | E2, B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E | E2, B>
} = dual(isDataFirstFx, core.flatMap)

export const flatMapEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E | E2, B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E | E2, B>
} = dual(isDataFirstFx, core.flatMapEffect)

export const switchMap: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E | E2, B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E | E2, B>
} = dual(isDataFirstFx, core.switchMap)

export const switchMapEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E | E2, B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E | E2, B>
} = dual(isDataFirstFx, core.switchMapEffect)

export const exhaustMap: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E | E2, B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E | E2, B>
} = dual(isDataFirstFx, core.exhaustMap)

export const exhaustMapEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E | E2, B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E | E2, B>
} = dual(isDataFirstFx, core.exhaustMapEffect)

export const exhaustMapLatest: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E | E2, B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E | E2, B>
} = dual(isDataFirstFx, core.exhaustMapLatest)

export const exhaustMapLatestEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E | E2, B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E | E2, B>
} = dual(isDataFirstFx, core.exhaustMapLatestEffect)

export const flatMapConcurrently: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>,
    capacity: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E | E2, B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    capacity: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E | E2, B>
} = dual(isDataFirstFx, core.flatMapConcurrently)

export const flatMapConcurrentlyEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
    capacity: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E | E2, B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
    capacity: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E | E2, B>
} = dual(isDataFirstFx, core.flatMapConcurrentlyEffect)

export const concatMap: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, E>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<Scope.Scope | R | R2, E | E2, B>
} = dual(isDataFirstFx, core.concatMap)

export const fromFxEffect: <R, E, R2, E2, B>(effect: Effect.Effect<R, E, Fx<R2, E2, B>>) => Fx<R | R2, E | E2, B> =
  core.fromFxEffect

export const continueWith: {
  <R2, E2, B>(f: () => Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
} = dual(2, core.continueWith)

export const orElseCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, core.orElseCause)

export const orElse: {
  <E, R2, E2, B>(f: (error: E) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (error: E) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, core.orElse)

export const suspend: <R, E, A>(f: () => Fx<R, E, A>) => Fx<R, E, A> = core.suspend

export const mergeWithStrategy: {
  (strategy: MergeStrategy): <FX extends ReadonlyArray<Fx<any, any, any>>>(
    fx: FX
  ) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>

  <const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fx: FX,
    stategy: MergeStrategy
  ): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
} = dual(2, core.mergeWithStrategy)

export const merge: {
  <R2, E2, B>(other: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, other: Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
} = dual(
  2,
  core.merge
)

export const mergeAll: <FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> = core.mergeAll

export const mergeOrdered: <FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> = core.mergeOrdered

export const mergeOrderedConcurrently: <FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX,
  concurrency: number
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> = core.mergeOrderedConcurrently

export const mergeSwitch: <FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> = core.mergeSwitch

export const takeWhile: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <A>(f: Predicate.Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: Predicate.Refinement<A, B>): Fx<R, E, B>
  <R, E, A>(fx: Fx<R, E, A>, f: Predicate.Predicate<A>): Fx<R, E, A>
} = dual(2, core.takeWhile)

export const takeUntil: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, Exclude<A, B>>
  <A>(f: Predicate.Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: Predicate.Refinement<A, B>): Fx<R, E, Exclude<A, B>>
  <R, E, A>(fx: Fx<R, E, A>, f: Predicate.Predicate<A>): Fx<R, E, A>
} = dual(2, core.takeUntil)

export const dropWhile: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, Exclude<A, B>>
  <A>(f: Predicate.Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: Predicate.Refinement<A, B>): Fx<R, E, Exclude<A, B>>
  <R, E, A>(fx: Fx<R, E, A>, f: Predicate.Predicate<A>): Fx<R, E, A>
} = dual(2, core.dropWhile)

export const dropUntil: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A | B>
  <A>(f: Predicate.Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: Predicate.Refinement<A, B>): Fx<R, E, A | B>
  <R, E, A>(fx: Fx<R, E, A>, f: Predicate.Predicate<A>): Fx<R, E, A>
} = dual(2, core.dropUntil)

export const dropAfter: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, Exclude<A, B>>
  <A>(f: Predicate.Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: Predicate.Refinement<A, B>): Fx<R, E, Exclude<A, B>>
  <R, E, A>(fx: Fx<R, E, A>, f: Predicate.Predicate<A>): Fx<R, E, A>
} = dual(2, core.dropAfter)

export const takeWhileEffect: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(2, core.takeWhileEffect)

export const takeUntiEffect: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(2, core.takeUntilEffect)

export const dropWhileEffect: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(2, core.dropWhileEffect)

export const dropUntilEffect: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(2, core.dropUntilEffect)

export const dropAfterEffect: {
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(2, core.dropAfterEffect)

export const during: {
  <R2, E2, A, R3, E3, B>(
    window: Fx<R2, E2, Fx<R3, E3, B>>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | R3 | Scope.Scope, E | E2 | E3, A>
  <R, E, A, R2, E2, R3, E3, B>(
    fx: Fx<R, E, A>,
    window: Fx<R2, E2, Fx<R3, E3, B>>
  ): Fx<R | R2 | R3 | Scope.Scope, E | E2 | E3, A>
} = dual(2, core.during)

export const since: {
  <R2, E2, B>(window: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E | E2, A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, window: Fx<R2, E2, B>): Fx<R | R2 | Scope.Scope, E | E2, A>
} = dual(2, core.since)

export const until: {
  <R2, E2, B>(window: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E | E2, A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, window: Fx<R2, E2, B>): Fx<R | R2 | Scope.Scope, E | E2, A>
} = dual(2, core.until)

export const middleware: {
  <R, R3, E, A>(
    effect: (effect: Effect.Effect<R, never, unknown>) => Effect.Effect<R3, never, unknown>,
    sink?: ((sink: Sink.Sink<never, E, A>) => Sink.Sink<R, E, A>) | undefined
  ): <E, A>(fx: Fx<R, E, A>) => Fx<R3, E, A>

  <R, E, A, R3>(
    fx: Fx<R, E, A>,
    effect: (effect: Effect.Effect<R, never, unknown>) => Effect.Effect<R3, never, unknown>,
    sink?: ((sink: Sink.Sink<never, E, A>) => Sink.Sink<R, E, A>) | undefined
  ): Fx<R3, E, A>
} = dual(isDataFirstFx, core.middleware)

export const onExit: {
  <R2>(
    f: (exit: Exit.Exit<never, unknown>) => Effect.Effect<R2, never, unknown>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2, E, A>

  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (exit: Exit.Exit<never, unknown>) => Effect.Effect<R2, never, unknown>
  ): Fx<R | R2, E, A>
} = dual(2, core.onExit)

export const onInterrupt: {
  <R2>(
    f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<R2, never, unknown>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2, E, A>
  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<R2, never, unknown>
  ): Fx<R | R2, E, A>
} = dual(2, core.onInterrupt)

export const onError: {
  <R2>(f: (cause: Cause.Cause<never>) => Effect.Effect<R2, never, unknown>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<never>) => Effect.Effect<R2, never, unknown>): Fx<R | R2, E, A>
} = dual(2, core.onError)

export const scoped: <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, Scope.Scope>, E, A> = core.scoped

export const annotateLogs: {
  (key: string | Record<string, unknown>, value?: unknown): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, key: string | Record<string, unknown>, value?: unknown): Fx<R, E, A>
} = dual(isDataFirstFx, core.annotateLogs)

export const annotateSpans: {
  (key: string | Record<string, unknown>, value?: unknown): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, key: string | Record<string, unknown>, value?: unknown): Fx<R, E, A>
} = dual(isDataFirstFx, core.annotateSpans)

export const interruptible: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = core.interruptible

export const uninterruptible: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = core.uninterruptible

export const locally: {
  <A>(self: FiberRef.FiberRef<A>, value: A): <R, E, B>(fx: Fx<R, E, B>) => Fx<R, E, B>
  <R, E, B, A>(use: Fx<R, E, B>, self: FiberRef.FiberRef<A>, value: A): Fx<R, E, B>
} = dual(3, core.locally)

export const locallyWith: {
  <A>(self: FiberRef.FiberRef<A>, f: (a: A) => A): <R, E, B>(fx: Fx<R, E, B>) => Fx<R, E, B>
  <R, E, B, A>(use: Fx<R, E, B>, self: FiberRef.FiberRef<A>, f: (a: A) => A): Fx<R, E, B>
} = dual(3, core.locallyWith)

export const withTracerTiming: {
  (enabled: boolean): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, enabled: boolean): Fx<R, E, A>
} = dual(2, core.withTracerTiming)

export const withConcurrency: {
  (concurrency: number | "unbounded"): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, concurrency: number | "unbounded"): Fx<R, E, A>
} = dual(2, core.withConcurrency)

export const withConfigProvider: {
  (configProvider: ConfigProvider.ConfigProvider): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, configProvider: ConfigProvider.ConfigProvider): Fx<R, E, A>
} = dual(2, core.withConfigProvider)

export const withLogSpan: {
  (span: string): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, span: string): Fx<R, E, A>
} = dual(2, core.withLogSpan)

export const withMaxOpsBeforeYield: {
  (maxOps: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, maxOps: number): Fx<R, E, A>
} = dual(2, core.withMaxOpsBeforeYield)

export const withParentSpan: {
  (parentSpan: Tracer.ParentSpan): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, parentSpan: Tracer.ParentSpan): Fx<R, E, A>
} = dual(2, core.withParentSpan)

export const withRequestBatching: {
  (requestBatching: boolean): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, requestBatching: boolean): Fx<R, E, A>
} = dual(2, core.withRequestBatching)

export const withRequestCache: {
  (cache: Request.Cache): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, cache: Request.Cache): Fx<R, E, A>
} = dual(2, core.withRequestCache)

export const withRequestCaching: {
  (requestCaching: boolean): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, requestCaching: boolean): Fx<R, E, A>
} = dual(2, core.withRequestCaching)

export const withTracer: {
  (tracer: Tracer.Tracer): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, tracer: Tracer.Tracer): Fx<R, E, A>
} = dual(2, core.withTracer)

export const acquireUseRelease: {
  <A, R2, E2, B, R3, E3, C>(
    use: (a: A) => Fx<R2, E2, B>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, C>
  ): <R, E>(acquire: Effect.Effect<R, E, A>) => Fx<R | R2 | R3, E | E2 | E3, B>
  <R, E, A, R2, E2, B, R3, E3, C>(
    acquire: Effect.Effect<R, E, A>,
    use: (a: A) => Fx<R2, E2, B>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, C>
  ): Fx<R | R2 | R3, E | E2 | E3, B>
} = dual(3, core.acquireUseRelease)

export const withSpan: {
  (name: string, options?: {
    readonly attributes?: Record<string, unknown>
    readonly links?: ReadonlyArray<Tracer.SpanLink>
    readonly parent?: Tracer.ParentSpan
    readonly root?: boolean
    readonly context?: Ctx.Context<never>
  }): <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, A>

  <R, E, A>(self: Fx<R, E, A>, name: string, options?: {
    readonly attributes?: Record<string, unknown>
    readonly links?: ReadonlyArray<Tracer.SpanLink>
    readonly parent?: Tracer.ParentSpan
    readonly root?: boolean
    readonly context?: Ctx.Context<never>
  }): Fx<R, E, A>
} = dual(3, core.withSpan)

export const provideContext: {
  <R2>(context: Ctx.Context<R2>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, R2>, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, context: Ctx.Context<R2>): Fx<Exclude<R, R2>, E, A>
} = dual(2, core.provideContext)

export const provideLayer: {
  <R2, E2, S>(layer: Layer.Layer<R2, E2, S>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | Exclude<R, S>, E | E2, A>
  <R, E, A, R2, E2, S>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, S>): Fx<R2 | Exclude<R, S>, E | E2, A>
} = dual(2, core.provideLayer)

export const provideRuntime: {
  <R2>(runtime: Runtime.Runtime<R2>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, R2>, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, runtime: Runtime.Runtime<R2>): Fx<Exclude<R, R2>, E, A>
} = dual(2, core.provideRuntime)

export const provideService: {
  <I, S>(service: Ctx.Tag<I, S>, instance: S): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, I>, E, A>
  <R, E, A, I, S>(fx: Fx<R, E, A>, service: Ctx.Tag<I, S>, instance: S): Fx<Exclude<R, I>, E, A>
} = dual(3, core.provideService)

export const provideServiceEffect: {
  <I, S, R2, E2>(
    service: Ctx.Tag<I, S>,
    instance: Effect.Effect<R2, E2, S>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | Exclude<R, I>, E | E2, A>
  <R, E, A, I, S, R2, E2>(
    fx: Fx<R, E, A>,
    service: Ctx.Tag<I, S>,
    instance: Effect.Effect<R2, E2, S>
  ): Fx<R2 | Exclude<R, I>, E | E2, A>
} = dual(3, core.provideServiceEffect)

export const provide: {
  <R2>(context: Ctx.Context<R2>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, R2>, E, A>
  <R2>(runtime: Runtime.Runtime<R2>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, R2>, E, A>
  <R2, E2, S>(layer: Layer.Layer<R2, E2, S>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | Exclude<R, S>, E | E2, A>
  <R2 = never, E2 = never, S = never>(
    provide: Layer.Layer<R2, E2, S> | Ctx.Context<S> | Runtime.Runtime<S>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | Exclude<R, S>, E | E2, A>

  <R, E, A, R2>(fx: Fx<R, E, A>, context: Ctx.Context<R2>): Fx<Exclude<R, R2>, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, runtime: Runtime.Runtime<R2>): Fx<Exclude<R, R2>, E, A>
  <R, E, A, R2, E2, S>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, S>): Fx<R2 | Exclude<R, S>, E | E2, A>
  <R, E, A, R2 = never, E2 = never, S = never>(
    fx: Fx<R, E, A>,
    provide: Layer.Layer<R2, E2, S> | Ctx.Context<S> | Runtime.Runtime<S>
  ): Fx<R2 | Exclude<R, S>, E | E2, A>
} = dual(2, core.provide)

export const share: {
  <R2, E2, A>(subject: Subject.Subject<R2, E2, A>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, subject: Subject.Subject<R2, E, A>): Fx<R | R2 | Scope.Scope, E, A>
} = dual(2, coreShare.share)

export const multicast: <R, E, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R, E, A> = coreShare.multicast

export const hold: <R, E, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R, E, A> = coreShare.hold

export const replay: {
  (capacity: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, capacity: number): Fx<Scope.Scope | R, E, A>
} = dual(2, coreShare.replay)

export const mapCause: {
  <E, E2>(f: (cause: Cause.Cause<E>) => Cause.Cause<E2>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Cause.Cause<E2>): Fx<R, E2, A>
} = dual(2, core.mapCause)

export const mapError: {
  <E, E2>(f: (e: E) => E2): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (e: E) => E2): Fx<R, E2, A>
} = dual(2, core.mapError)

export const mapBoth: {
  <E, E2, A, B>(f: (e: E) => E2, g: (a: A) => B): <R>(fx: Fx<R, E, A>) => Fx<R, E2, B>
  <R, E, A, B, C>(fx: Fx<R, E, A>, f: (e: E) => B, g: (a: A) => C): Fx<R, B, C>
} = dual(3, core.mapBoth)

export const filterCause: {
  <E>(f: (cause: Cause.Cause<E>) => boolean): <R, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => boolean): Fx<R, E, A>
} = dual(2, core.filterCause)

export const filterError: {
  <E>(f: (e: E) => boolean): <R, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, f: (e: E) => boolean): Fx<R, E, A>
} = dual(2, core.filterError)

export const filterMapCause: {
  <E, E2>(f: (cause: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>): Fx<R, E2, A>
} = dual(2, core.filterMapCause)

export const filterMapError: {
  <E, E2>(f: (e: E) => Option.Option<E2>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (e: E) => Option.Option<E2>): Fx<R, E2, A>
} = dual(2, core.filterMapError)

export const mapCauseEffect: {
  <R2, E2, E3>(f: (cause: Cause.Cause<E2>) => Effect.Effect<R2, E3, Cause.Cause<E3>>): <R, E, A>(
    fx: Fx<R, E, A>
  ) => Fx<R | R2, E2 | E3, A>
  <R, E, A, R2, E2, E3>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, Cause.Cause<E3>>
  ): Fx<R | R2, E2 | E3, A>
} = dual(2, core.mapCauseEffect)

export const mapErrorEffect: {
  <R2, E2, E3>(f: (e: E2) => Effect.Effect<R2, E3, E3>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2 | E3, A>
  <R, E, A, R2, E2, E3>(fx: Fx<R, E, A>, f: (e: E) => Effect.Effect<R2, E2, E3>): Fx<R | R2, E2 | E3, A>
} = dual(2, core.mapErrorEffect)

export const filterCauseEffect: {
  <E, R2, E2>(f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, boolean>): <R, A>(
    fx: Fx<R, E, A>
  ) => Fx<R | R2, E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E2, A>
} = dual(2, core.filterCauseEffect)

export const filterErrorEffect: {
  <E, R2, E2>(f: (e: E) => Effect.Effect<R2, E2, boolean>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (e: E) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E2, A>
} = dual(2, core.filterErrorEffect)

export const filterMapCauseEffect: {
  <R2, E2, E3>(f: (cause: Cause.Cause<E2>) => Effect.Effect<R2, E2, Option.Option<Cause.Cause<E3>>>): <R, E, A>(
    fx: Fx<R, E, A>
  ) => Fx<R | R2, E2 | E3, A>
  <R, E, A, R2, E2, E3>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, Option.Option<Cause.Cause<E3>>>
  ): Fx<R | R2, E2 | E3, A>
} = dual(2, core.filterMapCauseEffect)

export const filterMapErrorEffect: {
  <E, R2, E2, E3>(
    f: (e: E) => Effect.Effect<R2, E2, Option.Option<E3>>
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2 | E3, A>
  <R, E, A, R2, E2, E3>(fx: Fx<R, E, A>, f: (e: E) => Effect.Effect<R2, E2, Option.Option<E3>>): Fx<R | R2, E2 | E3, A>
} = dual(2, core.filterMapErrorEffect)

export const loopCause: {
  <B, E, C>(
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => readonly [Cause.Cause<C>, B]
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R, C, A>

  <R, E, A, B, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => readonly [Cause.Cause<C>, B]
  ): Fx<R, C, A>
} = dual(3, core.loopCause)

export const loopError: {
  <B, E, C>(seed: B, f: (b: B, e: E) => readonly [C, B]): <R, A>(fx: Fx<R, E, A>) => Fx<R, C, A>
  <R, E, A, B, C>(fx: Fx<R, E, A>, seed: B, f: (b: B, e: E) => readonly [C, B]): Fx<R, C, A>
} = dual(3, core.loopError)

export const loopCauseEffect: {
  <B, E, R2, E2, C>(
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<R2, E2, readonly [Cause.Cause<C>, B]>
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2 | C, A>
  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<R2, E2, readonly [Cause.Cause<C>, B]>
  ): Fx<R | R2, E2 | C, A>
} = dual(3, core.loopCauseEffect)

export const loopErrorEffect: {
  <B, E, R2, E2, C>(seed: B, f: (b: B, e: E) => Effect.Effect<R2, E2, readonly [C, B]>): <R, A>(
    fx: Fx<R, E, A>
  ) => Fx<R | R2, E2 | C, A>
  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (b: B, e: E) => Effect.Effect<R2, E2, readonly [C, B]>
  ): Fx<R | R2, E2 | C, A>
} = dual(3, core.loopErrorEffect)

export const filterMapLoopCause: {
  <B, E, R2, E2, C>(
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<R2, E2, readonly [Option.Option<Cause.Cause<C>>, B]>
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2 | C, A>
  <R, E, A, B, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B]
  ): Fx<R, C, A>
} = dual(3, core.filterMapLoopCause)

export const filterMapLoopError: {
  <B, E, R2, E2, C>(seed: B, f: (b: B, e: E) => Effect.Effect<R2, E2, readonly [Option.Option<C>, B]>): <R, A>(
    fx: Fx<R, E, A>
  ) => Fx<R | R2, E2 | C, A>
  <R, E, A, B, C>(fx: Fx<R, E, A>, seed: B, f: (b: B, e: E) => readonly [Option.Option<C>, B]): Fx<R, C, A>
} = dual(3, core.filterMapLoopError)

export const filterMapLoopCauseEffect: {
  <B, E, R2, E2, C>(
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<R2, E2, readonly [Option.Option<Cause.Cause<C>>, B]>
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2 | C, A>
  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<R2, E2, readonly [Option.Option<Cause.Cause<C>>, B]>
  ): Fx<R | R2, E2 | C, A>
} = dual(3, core.filterMapLoopCauseEffect)

export const filterMapLoopErrorEffect: {
  <B, E, R2, E2, C>(seed: B, f: (b: B, e: E) => Effect.Effect<R2, E2, readonly [Option.Option<C>, B]>): <R, A>(
    fx: Fx<R, E, A>
  ) => Fx<R | R2, E2 | C, A>
  <R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (b: B, e: E) => Effect.Effect<R2, E2, readonly [Option.Option<C>, B]>
  ): Fx<R | R2, E2 | C, A>
} = dual(3, core.filterMapLoopErrorEffect)

export const flatMapCauseWithStrategy: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    flattenStrategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E2, A | B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    flattenStrategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): Fx<R | R2 | Scope.Scope, E2, A | B>
} = dual(isDataFirstFx, core.flatMapCauseWithStrategy)

export const flatMapErrorWithStrategy: {
  <E, R2, E2, B>(
    f: (e: E) => Fx<R2, E2, B>,
    flattenStrategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E2, A | B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: E) => Fx<R2, E2, B>,
    flattenStrategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): Fx<R | R2 | Scope.Scope, E2, A | B>
} = dual(isDataFirstFx, core.flatMapErrorWithStrategy)

export const switchMapCause: {
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E2, A | B>

  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E2, A | B>
} = dual(isDataFirstFx, core.switchMapCause)

export const switchMapError: {
  <E, R2, E2, B>(
    f: (e: E) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: E) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E2, A | B>
} = dual(isDataFirstFx, core.switchMapError)

export const flatMapCause: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E2, A | B>
} = dual(isDataFirstFx, core.flatMapCause)

export const flatMapError: {
  <E, R2, E2, B>(
    f: (e: E) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: E) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E2, A | B>
} = dual(isDataFirstFx, core.flatMapError)

export const flatMapCauseConcurrently: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    concurrency: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E2, A | B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    concurrency: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E2, A | B>
} = dual(isDataFirstFx, core.flatMapCauseConcurrently)

export const flatMapErrorConcurrently: {
  <E, R2, E2, B>(
    f: (e: E) => Fx<R2, E2, B>,
    concurrency: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: E) => Fx<R2, E2, B>,
    concurrency: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E2, A | B>
} = dual(isDataFirstFx, core.flatMapErrorConcurrently)

export const exhaustMapCause: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E2, A | B>
} = dual(isDataFirstFx, core.exhaustMapCause)

export const exhaustMapError: {
  <E, R2, E2, B>(
    f: (e: E) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: E) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E2, A | B>
} = dual(isDataFirstFx, core.exhaustMapError)

export const exhaustMapLatestCause: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E2, A | B>
} = dual(isDataFirstFx, core.exhaustMapLatestCause)

export const exhaustMapLatestError: {
  <E, R2, E2, B>(
    f: (e: E) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (e: E) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E2, A | B>
} = dual(isDataFirstFx, core.exhaustMapLatestError)

export type MatchCauseOptions<E, A, R2, E2, B, R3, E3, C> = {
  readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
  readonly onSuccess: (a: A) => Fx<R3, E3, C>
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
}

export type MatchErrorOptions<E, A, R2, E2, B, R3, E3, C> = {
  readonly onFailure: (e: E) => Fx<R2, E2, B>
  readonly onSuccess: (a: A) => Fx<R3, E3, C>
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
}

export const matchCauseWithStrategy: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    flattenStrategy: FlattenStrategy,
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>
} = dual(3, core.matchCauseWithStrategy)

export const matchErrorWithStrategy: {
  <E, A, R2, E2, B, R3, E3, C>(
    { executionStrategy, onFailure, onSuccess }: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    flattenStrategy: FlattenStrategy,
    { executionStrategy, onFailure, onSuccess }: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
} = dual(3, core.matchErrorWithStrategy)

export const matchCause: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
} = dual(2, core.matchCause)

export const matchError: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    opts: core.MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>
} = dual(2, core.matchError)

export const matchCauseConcurrently: {
  <E, A, R2, E2, B, R3, E3, C>(
    concurrency: number,
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    concurrency: number,
    opts: core.MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>
} = dual(3, core.matchCauseConcurrently)

export const matchErrorConcurrently: {
  <E, A, R2, E2, B, R3, E3, C>(
    concurrency: number,
    opts: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    concurrency: number,
    opts: core.MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
} = dual(3, core.matchErrorConcurrently)

export const switchMatchCause: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
} = dual(2, core.switchMatchCause)

export const switchMatchError: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    opts: core.MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>
} = dual(2, core.switchMatchError)

export const exhaustMatchCause: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
} = dual(2, core.exhaustMatchCause)

export const exhaustMatchError: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    opts: core.MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>
} = dual(2, core.exhaustMatchError)

export const exhaustMatchLatestCause: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<Scope.Scope | R | R2 | R3, E2 | E3, B | C>
} = dual(2, core.exhaustMatchLatestCause)

export const exhaustMatchLatestError: {
  <E, A, R2, E2, B, R3, E3, C>(
    opts: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    opts: core.MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
  ): Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C>
} = dual(2, core.exhaustMatchLatestError)

export const exit: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, never, Exit.Exit<E, A>> = core.exit

export const either: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, never, Either.Either<E, A>> = core.either

export const tuple: <const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, { readonly [K in keyof FX]: Fx.Success<FX[K]> }> = core.tuple

export const struct: <const FX extends Readonly<Record<string, Fx<any, any, any>>>>(
  fx: FX
) => Fx<Fx.Context<FX[string]>, Fx.Error<FX[string]>, { readonly [K in keyof FX]: Fx.Success<FX[K]> }> = core.struct

export const all: {
  <const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fx: FX
  ): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, { readonly [K in keyof FX]: Fx.Success<FX[K]> }>
  <const FX extends Readonly<Record<string, Fx<any, any, any>>>>(
    fx: FX
  ): Fx<Fx.Context<FX[string]>, Fx.Error<FX[string]>, { readonly [K in keyof FX]: Fx.Success<FX[K]> }>
} = core.all

export const toEnqueue: {
  <R2 = never, A = never>(
    queue: Ctx.Enqueue<R2, A> | Queue.Enqueue<A>
  ): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R | R2, E, void>
  <R, E, A, R2 = never>(fx: Fx<R, E, A>, queue: Ctx.Enqueue<R2, A> | Queue.Enqueue<A>): Effect.Effect<R | R2, E, void>
} = dual(2, core.toEnqueue)

export const debounce: {
  (delay: Duration.DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | Scope.Scope, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: Duration.DurationInput): Fx<R | Scope.Scope, E, A>
} = dual(2, core.debounce)

export const throttle: {
  (delay: Duration.DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | Scope.Scope, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: Duration.DurationInput): Fx<R | Scope.Scope, E, A>
} = dual(2, core.throttle)

export const throttleLatest: {
  (delay: Duration.DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | Scope.Scope, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: Duration.DurationInput): Fx<R | Scope.Scope, E, A>
} = dual(2, core.throttleLatest)

export interface KeyedOptions<A, B, R2, E2, C> {
  readonly getKey: (a: A) => B
  readonly onValue: (ref: RefSubject<never, never, A>, key: B) => Fx<R2, E2, C>
  readonly debounce?: Duration.DurationInput
}

export const keyed: {
  <A, B extends PropertyKey, R2, E2, C>(
    options: KeyedOptions<A, B, R2, E2, C>
  ): <R, E>(fx: Fx<R, E, ReadonlyArray<A>>) => Fx<R | R2, E | E2, ReadonlyArray<C>>

  <R, E, A, B extends PropertyKey, R2, E2, C>(
    fx: Fx<R, E, ReadonlyArray<A>>,
    options: KeyedOptions<A, B, R2, E2, C>
  ): Fx<R | R2, E | E2, ReadonlyArray<C>>
} = dual(2, coreKeyed.keyed)

export interface WithKeyOptions<A, B, R2, E2, C> {
  readonly getKey: (a: A) => B
  readonly onValue: (ref: RefSubject<never, never, A>, key: B) => Fx<R2, E2, C>
}

export const withKey: {
  <A, B extends PropertyKey, R2, E2, C>(
    options: WithKeyOptions<A, B, R2, E2, C>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, C>

  <R, E, A, B extends PropertyKey, R2, E2, C>(
    fx: Fx<R, E, A>,
    options: WithKeyOptions<A, B, R2, E2, C>
  ): Fx<R | R2, E | E2, C>
} = dual(2, coreWithKey.withKey)

const getTag = (a: { readonly _tag: string }): string => a._tag

/**
 * Match over a tagged union of values into a set of persistent workflows
 * that allow listening to changes of values with the same tag using the same
 * Fx.
 *
 * @since 1.20.0
 * @category combinators
 */
export const matchTags: {
  <A extends { readonly _tag: string }, Matchers extends DefaultMatchersFrom<A>>(
    matchers: Matchers
  ): <R, E>(fx: Fx<R, E, A>) => Fx<
    R | Fx.Context<ReturnType<Matchers[keyof Matchers]>>,
    E | Fx.Error<ReturnType<Matchers[keyof Matchers]>>,
    Fx.Success<ReturnType<Matchers[keyof Matchers]>>
  >

  <R, E, A extends { readonly _tag: string }, Matchers extends DefaultMatchersFrom<A>>(
    fx: Fx<R, E, A>,
    matchers: Matchers
  ): Fx<
    R | Fx.Context<ReturnType<Matchers[keyof Matchers]>>,
    E | Fx.Error<ReturnType<Matchers[keyof Matchers]>>,
    Fx.Success<ReturnType<Matchers[keyof Matchers]>>
  >
} = dual(
  2,
  function matchTags<R, E, A extends { readonly _tag: string }, Matchers extends DefaultMatchersFrom<A>>(
    fx: Fx<R, E, A>,
    matchers: Matchers
  ): Fx<
    R | Fx.Context<ReturnType<Matchers[keyof Matchers]>>,
    E | Fx.Error<ReturnType<Matchers[keyof Matchers]>>,
    Fx.Success<ReturnType<Matchers[keyof Matchers]>>
  > {
    return withKey(fx, {
      getKey: getTag,
      onValue: (ref, tag: A["_tag"]) => matchers[tag](ref as any)
    })
  }
)

/**
 * @since 1.20.0
 */
export type DefaultMatchersFrom<A extends { readonly _tag: string }> = {
  readonly [Tag in A["_tag"]]: (
    value: RefSubject<never, never, Extract<A, { readonly _tag: Tag }>>
  ) => Fx<any, any, any>
}

/**
 * @since 1.20.0
 */
export const matchOption: {
  <A, R2 = never, E2 = never, B = never, R3 = never, E3 = never, C = never>(
    onNone: () => Fx<R2, E2, B>,
    onSome: (a: RefSubject<never, never, A>) => Fx<R3, E3, C>
  ): <R, E>(fx: Fx<R, E, Option.Option<A>>) => Fx<R | R2 | R3 | Scope.Scope, E | E2 | E3, B | C>

  <R, E, A, R2 = never, E2 = never, B = never, R3 = never, E3 = never, C = never>(
    fx: Fx<R, E, Option.Option<A>>,
    onNone: () => Fx<R2, E2, B>,
    onSome: (a: RefSubject<never, never, A>) => Fx<R3, E3, C>
  ): Fx<R | R2 | R3 | Scope.Scope, E | E2 | E3, B | C>
} = dual(
  3,
  function matchOption<R, E, A, R2 = never, E2 = never, B = never, R3 = never, E3 = never, C = never>(
    fx: Fx<R, E, Option.Option<A>>,
    onNone: () => Fx<R2, E2, B>,
    onSome: (a: RefSubject<never, never, A>) => Fx<R3, E3, C>
  ): Fx<R | R2 | R3 | Scope.Scope, E | E2 | E3, B | C> {
    return matchTags(fx, {
      None: onNone,
      Some: (some) => onSome(transform(some, (s) => s.value, (value) => Option.some(value) as Option.Some<A>))
    })
  }
)

/**
 * @since 1.20.0
 */
export const getOrElse: {
  <A, R2 = never, E2 = never, B = never>(
    orElse: () => Fx<R2, E2, B>
  ): <R, E>(fx: Fx<R, E, Option.Option<A>>) => Fx<R | R2 | Scope.Scope, E | E2, A | B>

  <R, E, A, R2 = never, E2 = never, B = never>(
    fx: Fx<R, E, Option.Option<A>>,
    orElse: () => Fx<R2, E2, B>
  ): Fx<R | R2 | Scope.Scope, E | E2, A | B>
} = dual(
  2,
  function getOrElse<R, E, A, R2 = never, E2 = never, B = never>(
    fx: Fx<R, E, Option.Option<A>>,
    orElse: () => Fx<R2, E2, B>
  ): Fx<R | R2 | Scope.Scope, E | E2, A | B> {
    return matchOption(fx, orElse, identity)
  }
)

/**
 * @since 1.20.0
 */
export const matchEither: {
  <E1, A, R2 = never, E2 = never, B = never, R3 = never, E3 = never, C = never>(
    onLeft: (e: RefSubject<never, never, E1>) => Fx<R2, E2, B>,
    onRight: (a: RefSubject<never, never, A>) => Fx<R3, E3, C>
  ): <R, E>(fx: Fx<R, E, Either.Either<E1, A>>) => Fx<R | R2 | R3 | Scope.Scope, E | E2 | E3, B | C>

  <R, E, E1, A, R2 = never, E2 = never, B = never, R3 = never, E3 = never, C = never>(
    fx: Fx<R, E, Either.Either<E1, A>>,
    onLeft: (e: RefSubject<never, never, E1>) => Fx<R2, E2, B>,
    onRight: (a: RefSubject<never, never, A>) => Fx<R3, E3, C>
  ): Fx<R | R2 | R3 | Scope.Scope, E | E2 | E3, B | C>
} = dual(
  3,
  function matchEither<R, E, E1, A, R2 = never, E2 = never, B = never, R3 = never, E3 = never, C = never>(
    fx: Fx<R, E, Either.Either<E1, A>>,
    onLeft: (e: RefSubject<never, never, E1>) => Fx<R2, E2, B>,
    onRight: (a: RefSubject<never, never, A>) => Fx<R3, E3, C>
  ): Fx<R | R2 | R3 | Scope.Scope, E | E2 | E3, B | C> {
    return matchTags(fx, {
      Left: (left) => onLeft(transform(left, (a) => a.left, (a) => Either.left(a) as Either.Left<E1, A>)),
      Right: (right) => onRight(transform(right, (s) => s.right, (value) => Either.right(value) as Either.Right<E1, A>))
    })
  }
)

export const at: {
  (duration: Duration.DurationInput): <A>(value: A) => Fx<never, never, A>
  <A>(value: A, duration: Duration.DurationInput): Fx<never, never, A>
} = dual(
  2,
  <A>(value: A, duration: Duration.DurationInput): Fx<never, never, A> =>
    fromEffect(Effect.delay(Effect.succeed(value), duration))
)

export function drainLayer<FXS extends ReadonlyArray<Fx<any, never, any>>>(...fxs: FXS): Layer.Layer<
  Exclude<Fx.Context<FXS[number]>, Scope.Scope>,
  never,
  never
> {
  return Layer.scopedDiscard(Effect.forkScoped(core.drain(core.mergeAll(fxs))))
}

/**
 * @since 1.20.0
 */
export const fork = <R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, never, Fiber.RuntimeFiber<E, void>> =>
  Effect.fork(drain(fx))

/**
 * @since 1.20.0
 */
export const forkScoped = <R, E, A>(
  fx: Fx<R, E, A>
): Effect.Effect<R | Scope.Scope, never, Fiber.RuntimeFiber<E, void>> => Effect.forkScoped(drain(fx))

/**
 * @since 1.20.0
 */
export const forkDaemon = <R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, never, Fiber.RuntimeFiber<E, void>> =>
  Effect.forkDaemon(drain(fx))

/**
 * @since 1.20.0
 */
export const forkIn: {
  (scope: Scope.Scope): <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, never, Fiber.RuntimeFiber<E, void>>
  <R, E, A>(fx: Fx<R, E, A>, scope: Scope.Scope): Effect.Effect<R, never, Fiber.RuntimeFiber<E, void>>
} = dual(2, <R, E, A>(
  fx: Fx<R, E, A>,
  scope: Scope.Scope
): Effect.Effect<R, never, Fiber.RuntimeFiber<E, void>> => Effect.forkIn(drain(fx), scope))

/**
 * @since 1.20.0
 */
export const fromAsyncIterable: <A>(iterable: AsyncIterable<A>) => Fx<never, never, A> = core.fromAsyncIterable

/**
 * @since 1.20.0
 */
export const partitionMap: {
  <A, B, C>(
    f: (a: A) => Either.Either<B, C>
  ): <R, E>(fx: Fx<R, E, A>) => readonly [Fx<Scope.Scope | R, E, B>, Fx<Scope.Scope | R, E, C>]
  <R, E, A, B, C>(
    fx: Fx<R, E, A>,
    f: (a: A) => Either.Either<B, C>
  ): readonly [Fx<Scope.Scope | R, E, B>, Fx<Scope.Scope | R, E, C>]
} = dual(2, function partitionMap<R, E, A, B, C>(
  fx: Fx<R, E, A>,
  f: (a: A) => Either.Either<B, C>
): readonly [Fx<R | Scope.Scope, E, B>, Fx<R | Scope.Scope, E, C>] {
  const source = coreShare.multicast(core.map(fx, f))

  return [
    core.filterMap(source, Either.getLeft),
    core.filterMap(source, Either.getRight)
  ]
})

export const gen: <Y extends Effect.EffectGen<any, any, any>, FX extends Fx<any, any, any>>(
  f: (_: Effect.Adapter) => Generator<Y, FX, any>
) => Fx<
  Effect.Effect.Context<Y["value"]> | Fx.Context<FX>,
  Effect.Effect.Error<Y["value"]> | Fx.Error<FX>,
  Fx.Success<FX>
> = core.gen

export const genScoped: <Y extends Effect.EffectGen<any, any, any>, FX extends Fx<any, any, any>>(
  f: (_: Effect.Adapter) => Generator<Y, FX, any>
) => Fx<
  Exclude<Effect.Effect.Context<Y["value"]> | Fx.Context<FX>, Scope.Scope>,
  Effect.Effect.Error<Y["value"]> | Fx.Error<FX>,
  Fx.Success<FX>
> = core.genScoped

export const findFirst: {
  <A, B extends A>(refinement: Predicate.Refinement<A, B>): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, B>
  <A>(predicate: Predicate.Predicate<A>): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, refinement: Predicate.Refinement<A, B>): Effect.Effect<R, E, B>
  <R, E, A>(fx: Fx<R, E, A>, predicate: Predicate.Predicate<A>): Effect.Effect<R, E, A>
} = dual(2, core.findFirst)

export const first: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, A> = core.first

export const mergeFirst: {
  <R2, E2, B>(that: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, that: Fx<R2, E2, B>): Fx<R | R2, E | E2, A>
} = dual(2, core.mergeFirst)

export const mergeRace: {
  <R2, E2, B>(that: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, that: Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
} = dual(2, core.mergeRace)

export const raceAll: <const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> = core.raceAll

export const race: {
  <R2, E2, B>(that: Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, that: Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
} = dual(2, core.race)

export const snapshot: {
  <R, E, B, A, C>(sampled: Fx<R, E, B>, g: (a: A, b: B) => C): <R2, E2>(fx: Fx<R2, E2, A>) => Fx<R | R2, E | E2, C>
  <R, E, A, R2, E2, B, C>(fx: Fx<R, E, A>, sampled: Fx<R2, E2, B>, f: (a: A, b: B) => C): Fx<R | R2, E | E2, C>
} = dual(3, core.snapshot)

export const sample: {
  <R, E, B>(sampled: Fx<R, E, B>): <R2, E2, A>(fx: Fx<R2, E2, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, sampled: Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(2, core.sample)

export const snapshotEffect: {
  <R2, E2, B, A, R3, E3, C>(sampled: Fx<R2, E2, B>, g: (a: A, b: B) => Effect.Effect<R3, E3, C>): <R, E>(
    fx: Fx<R, E, A>
  ) => Fx<R | R2 | R3, E | E2 | E3, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    sampled: Fx<R2, E2, B>,
    f: (a: A, b: B) => Effect.Effect<R3, E3, C>
  ): Fx<R | R2 | R3, E | E2 | E3, C>
} = dual(3, core.snapshotEffect)

const if_: {
  <R2, E2, B, R3, E3, C>(options: { readonly onTrue: Fx<R2, E2, B>; readonly onFalse: Fx<R3, E3, C> }): <R, E>(
    bool: Fx<R, E, boolean>
  ) => Fx<R | R2 | R3 | Scope.Scope, E | E2 | E3, B | C>
  <R, E, R2, E2, B, R3, E3, C>(
    bool: Fx<R, E, boolean>,
    options: { readonly onTrue: Fx<R2, E2, B>; readonly onFalse: Fx<R3, E3, C> }
  ): Fx<R | R2 | R3 | Scope.Scope, E | E2 | E3, B | C>
} = dual(2, core.if)

export { if_ as if }

export const when: {
  <B, C>(
    options: { readonly onTrue: B; readonly onFalse: C }
  ): <R, E>(bool: Fx<R, E, boolean>) => Fx<R | Scope.Scope, E, B | C>
  <R, E, B, C>(
    bool: Fx<R, E, boolean>,
    options: { readonly onTrue: B; readonly onFalse: C }
  ): Fx<R | Scope.Scope, E, B | C>
} = dual(2, core.when)

export const withEmitter = <E, A, R = never>(
  f: (emitter: Emitter.Emitter<E, A>) => Effect.Effect<R, E, unknown>
): Fx<R | Scope.Scope, E, A> => core.make<R | Scope.Scope, E, A>((sink) => Emitter.withEmitter(sink, f))

/**
 * Create an Fx which will wait a specified duration of time where no
 * events have occurred before emitting a value.
 * @since 1.18.0
 */
export const delay: {
  (delay: DurationInput): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | Scope.Scope, E, A>
  <R, E, A>(fx: Fx<R, E, A>, delay: DurationInput): Fx<R | Scope.Scope, E, A>
} = dual(2, function<R, E, A>(fx: Fx<R, E, A>, delay: DurationInput): Fx<R | Scope.Scope, E, A> {
  return core.flatMap(fx, (a) => core.fromEffect(Effect.delay(Effect.succeed(a), delay)))
})

export const ensuring: {
  <R2>(finalizer: Effect.Effect<R2, never, unknown>): <R, E, A>(self: Fx<R, E, A>) => Fx<R | R2, E, A>
  <R, E, A, R2>(self: Fx<R, E, A>, finalizer: Effect.Effect<R2, never, unknown>): Fx<R | R2, E, A>
} = dual(2, function<R, E, A, R2>(
  self: Fx<R, E, A>,
  finalizer: Effect.Effect<R2, never, unknown>
): Fx<R | R2, E, A> {
  return core.middleware(self, (effect) => Effect.ensuring(effect, finalizer))
})

export const flip = <R, E, A>(fx: Fx<R, E, A>): Fx<R, A, E> =>
  core.make<R, A, E>((sink) =>
    fx.run(Sink.make(
      (cause) =>
        Either.match(Cause.failureOrCause(cause), {
          onLeft: (e) => sink.onSuccess(e),
          onRight: (c) => sink.onFailure(c)
        }),
      (a) => sink.onFailure(Cause.fail(a))
    ))
  )

export const fromNullable = <A>(value: A | null | undefined | void): Fx<never, never, NonNullable<A>> => {
  if (value === null || value === undefined) {
    return core.empty
  } else {
    return core.succeed(value)
  }
}

export function fromDequeue<A>(dequeue: Queue.Dequeue<A>): Fx<never, never, A>
export function fromDequeue<I, A>(dequeue: Ctx.Dequeue<I, A>): Fx<I, never, A>
export function fromDequeue<I, A>(dequeue: Ctx.Dequeue<I, A> | Queue.Dequeue<A>): Fx<I, never, A> {
  return core.make((sink) =>
    Effect.repeatWhileEffect(
      Effect.matchCauseEffect(dequeue.take, sink),
      () => dequeueIsActive(dequeue)
    )
  )
}

/**
 * @internal
 */
export function dequeueIsActive<I, A>(
  dequeue: Ctx.Dequeue<I, A> | Queue.Dequeue<A>
): Effect.Effect<I, never, boolean> {
  if (Queue.DequeueTypeId in dequeue) {
    return Effect.sync(() => dequeue.isActive())
  } else {
    return dequeue.isActive
  }
}

export function fromPubSub<A>(pubSub: PubSub.PubSub<A>): Fx<Scope.Scope, never, A>
export function fromPubSub<I, A>(pubSub: Ctx.PubSub<I, A>): Fx<I | Scope.Scope, never, A>
export function fromPubSub<I, A>(pubSub: Ctx.PubSub<I, A> | PubSub.PubSub<A>): Fx<I | Scope.Scope, never, A> {
  return core.acquireUseRelease(
    pubSub.subscribe,
    (q) => fromDequeue(q),
    (d) => d.shutdown
  )
}

export abstract class FxEffectBase<R, E, A, R2, E2, B> extends protos.FxEffectBase<R, E, A, R2, E2, B> {
  private _fx: Fx<R, E, A> | undefined

  run<R3>(sink: Sink.Sink<R3, E, A>): Effect.Effect<R | R3, never, void> {
    return (this._fx ||= this.toFx()).run(sink)
  }

  abstract toFx(): Fx<R, E, A>

  abstract toEffect(): Effect.Effect<R2, E2, B>
}
