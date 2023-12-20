import type * as Ctx from "@typed/context"
import { Effect, Schedule } from "effect"
import type {
  Cause,
  ConfigProvider,
  Duration,
  Equivalence,
  ExecutionStrategy,
  Exit,
  Fiber,
  FiberId,
  FiberRef,
  HashSet,
  Layer,
  Option,
  Pipeable,
  Predicate,
  Queue,
  Request,
  Runtime,
  Scope,
  Tracer
} from "effect"
import { dual } from "effect/Function"
import type * as Types from "effect/Types"
import * as strategies from "../internal/strategies.js"
import { TypeId } from "../TypeId.js"
import * as core from "./internal/core.js"
import * as coreKeyed from "./internal/keyed.js"
import * as coreShare from "./internal/share.js"
import type { RefSubject } from "./RefSubject.js"
import type { Sink } from "./Sink.js"
import type { Subject } from "./Subject.js"

export interface Fx<out R, out E, out A> extends Pipeable.Pipeable {
  readonly [TypeId]: Fx.Variance<R, E, A>

  run<R2 = never>(sink: Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown>
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

export const make: {
  <A>(run: <R2 = never>(sink: Sink<R2, never, A>) => Effect.Effect<R2, never, unknown>): Fx<never, never, A>
  <E, A>(run: <R2 = never>(sink: Sink<R2, E, A>) => Effect.Effect<R2, never, unknown>): Fx<never, E, A>
  <R, E, A>(run: <R2 = never>(sink: Sink<R2, E, A>) => Effect.Effect<R | R2, never, unknown>): Fx<R, E, A>
} = core.make

export const succeed: <A>(value: A) => Fx<never, never, A> = core.succeed

export const fromSync: <A>(f: () => A) => Fx<never, never, A> = core.fromSync

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
): Fx<R, E, A> => schedule(iterator, Schedule.spaced(period)))

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
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B>
} = dual(2, core.filterMap)

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

export const fromFxEffect: <R, E, R2, E2, B>(effect: Effect.Effect<R, E, Fx<R2, E2, B>>) => Fx<R | R2, E | E2, B> =
  core.fromFxEffect

export const continueWith: {
  <R2, E2, B>(f: () => Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
} = dual(2, core.continueWith)

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
    sink?: ((sink: Sink<never, E, A>) => Sink<R, E, A>) | undefined
  ): <E, A>(fx: Fx<R, E, A>) => Fx<R3, E, A>

  <R, E, A, R3>(
    fx: Fx<R, E, A>,
    effect: (effect: Effect.Effect<R, never, unknown>) => Effect.Effect<R3, never, unknown>,
    sink?: ((sink: Sink<never, E, A>) => Sink<R, E, A>) | undefined
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
  <R2, E2, A>(subject: Subject<R2, E2, A>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, subject: Subject<R2, E, A>): Fx<R | R2 | Scope.Scope, E, A>
} = dual(2, coreShare.share)

export const multicast: <R, E, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R, E, A> = coreShare.multicast

export const hold: <R, E, A>(fx: Fx<R, E, A>) => Fx<Scope.Scope | R, E, A> = coreShare.hold

export const replay: {
  (capacity: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, capacity: number): Fx<R, E, A>
} = dual(2, coreShare.replay)

export const mapCause: {
  <E, E2>(f: (cause: Cause.Cause<E>) => Cause.Cause<E2>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Cause.Cause<E2>): Fx<R, E2, A>
} = dual(2, core.mapCause)

export const mapError: {
  <E, E2>(f: (e: E) => E2): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (e: E) => E2): Fx<R, E2, A>
} = dual(2, core.mapError)

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
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2 | Scope.Scope, E2, A | B>

  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<R | R2 | Scope.Scope, E2, A | B>
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

export const toEnqueue: {
  <R2 = never, A = never>(
    queue: Ctx.Enqueue<R2, A> | Queue.Enqueue<A>
  ): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R | R2, E, void>
  <R, E, A, R2 = never>(fx: Fx<R, E, A>, queue: Ctx.Enqueue<R2, A> | Queue.Enqueue<A>): Effect.Effect<R | R2, E, void>
} = dual(2, core.toEnqueue)

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

export const at: {
  (duration: Duration.DurationInput): <A>(value: A) => Fx<never, never, A>
  <A>(value: A, duration: Duration.DurationInput): Fx<never, never, A>
} = dual(
  2,
  <A>(value: A, duration: Duration.DurationInput): Fx<never, never, A> =>
    fromEffect(Effect.delay(Effect.succeed(value), duration))
)
