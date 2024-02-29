/**
 * Fx is a push-based reactive primitive built atop of Effect.
 * @since 1.20.0
 */

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
import * as Cause from "effect/Cause"
import type { DurationInput } from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import { dual, identity } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import { hasProperty } from "effect/Predicate"
import * as Queue from "effect/Queue"
import * as Schedule from "effect/Schedule"
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

/**
 * Fx is a push-based reactive primitive built atop of Effect.
 * @since 1.20.0
 */
export interface Fx<out A, out E = never, out R = never> extends Pipeable.Pipeable {
  readonly [TypeId]: Fx.Variance<A, E, R>

  /**
   * @since 1.20.0
   */
  run<R2 = never>(sink: Sink.Sink<A, E, R2>): Effect.Effect<unknown, never, R | R2>
}

/**
 * @since 1.20.0
 */
export namespace Fx {
  /**
   * @since 1.20.0
   */
  export interface Variance<A, E, R> {
    readonly _R: Types.Covariant<R>
    readonly _E: Types.Covariant<E>
    readonly _A: Types.Covariant<A>
  }

  /**
   * @since 1.20.0
   */
  export type Context<T> = T extends Fx<infer _A, infer _E, infer R> ? R : never

  /**
   * @since 1.20.0
   */
  export type Error<T> = T extends Fx<infer _A, infer E, infer _R> ? E : never

  /**
   * @since 1.20.0
   */
  export type Success<T> = T extends Fx<infer A, infer _E, infer _R> ? A : never

  /**
   * @since 1.20.0
   */
  export type Unify<T> = T extends Fx<infer A, infer E, infer R> | infer _ ? Fx<A, E, R> : never
}

/**
 * @since 1.20.0
 */
export type Context<T> = Fx.Context<T>

/**
 * @since 1.20.0
 */
export type Error<T> = Fx.Error<T>

/**
 * @since 1.20.0
 */
export type Success<T> = Fx.Success<T>

/**
 * @since 1.20.0
 */
export type Unify<T> = Fx.Unify<T>

/**
 * @since 1.20.0
 */
export function isFx<A, E, R>(u: unknown): u is Fx<A, E, R> {
  return u === null ? false : hasProperty(u, TypeId)
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
export type ScopedFork = <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<Fiber.Fiber<A, E>, never, R>

/**
 * Type-alias for Effect.forkIn(scope) which runs the Effect runtime
 * of an Fx in a Scope. Used in for higher-order operators.
 *
 * @since 1.20.0
 * @category models
 */
export type FxFork = <R>(
  effect: Effect.Effect<void, never, R>
) => Effect.Effect<void, never, R>

/**
 * @since 1.20.0
 */
export const make: {
  <A, E, R>(run: (sink: Sink.Sink<A, E>) => Effect.Effect<unknown, never, R>): Fx<A, E, R>
  <A, E>(run: (sink: Sink.Sink<A, E>) => Effect.Effect<unknown>): Fx<A, E>
  <A>(run: (sink: Sink.Sink<A>) => Effect.Effect<unknown>): Fx<A>
} = core.make

/**
 * @since 1.20.0
 */
export const succeed: <A>(value: A) => Fx<A> = core.succeed

/**
 * @since 1.20.0
 */
export const sync: <A>(f: () => A) => Fx<A> = core.fromSync

/**
 * @since 1.20.0
 */
export const fromArray: <const A extends ReadonlyArray<any>>(array: A) => Fx<A[number]> = core.fromArray

/**
 * @since 1.20.0
 */
export const fromIterable: <A>(iterable: Iterable<A>) => Fx<A> = core.fromIterable

/**
 * @since 1.20.0
 */
export const fromEffect: <A, E, R>(effect: Effect.Effect<A, E, R>) => Fx<A, E, R> = core.fromEffect

/**
 * @since 1.20.0
 */
export const fromScheduled: {
  <R2, I, O>(
    schedule: Schedule.Schedule<O, I, R2>
  ): <E, R>(input: Effect.Effect<I, E, R>) => Fx<O, E, R | R2>

  <I, E, R, R2, O>(
    input: Effect.Effect<I, E, R>,
    schedule: Schedule.Schedule<O, I, R2>
  ): Fx<O, E, R | R2>
} = dual(2, core.fromScheduled)

/**
 * @since 1.20.0
 */
export const schedule: {
  <R2, O>(
    schedule: Schedule.Schedule<O, unknown, R2>
  ): <A, E, R>(input: Effect.Effect<A, E, R>) => Fx<A, E, R | R2>

  <A, E, R, R2, O>(
    input: Effect.Effect<A, E, R>,
    schedule: Schedule.Schedule<O, unknown, R2>
  ): Fx<A, E, R | R2>
} = dual(2, core.schedule)

/**
 * @since 1.20.0
 */
export const periodic: {
  (period: Duration.DurationInput): <A, E, R>(iterator: Effect.Effect<A, E, R>) => Fx<A, E, R>
  <A, E, R>(iterator: Effect.Effect<A, E, R>, period: Duration.DurationInput): Fx<A, E, R>
} = dual(2, <A, E, R>(
  iterator: Effect.Effect<A, E, R>,
  period: Duration.DurationInput
): Fx<A, E, R> => continueWith(fromEffect(iterator), () => schedule(iterator, Schedule.spaced(period))))

/**
 * @since 1.20.0
 */
export const failCause: <E>(cause: Cause.Cause<E>) => Fx<never, E> = core.failCause

/**
 * @since 1.20.0
 */
export const fail: <E>(error: E) => Fx<never, E> = core.fail

/**
 * @since 1.20.0
 */
export const die: (error: unknown) => Fx<never> = core.die

/**
 * @since 1.20.0
 */
export const map: {
  <A, B>(f: (a: A) => B): <E, R>(fx: Fx<A, E, R>) => Fx<B, E, R>
  <A, E, R, B>(fx: Fx<A, E, R>, f: (a: A) => B): Fx<B, E, R>
} = dual(2, core.map)

/**
 * @since 1.20.0
 */
export const filter: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <E, R>(fx: Fx<A, E, R>) => Fx<B, E, R>
  <A>(f: Predicate.Predicate<A>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R, B extends A>(fx: Fx<A, E, R>, f: Predicate.Refinement<A, B>): Fx<B, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: Predicate.Predicate<A>): Fx<A, E, R>
} = dual(2, core.filter)

/**
 * @since 1.20.0
 */
export const filterMap: {
  <A, B>(f: (a: A) => Option.Option<B>): <E, R>(fx: Fx<A, E, R>) => Fx<B, E, R>
  <A, E, R, B>(fx: Fx<A, E, R>, f: (a: A) => Option.Option<B>): Fx<B, E, R>
} = dual(2, core.filterMap)

/**
 * @since 1.20.0
 */
export const compact = <A, E, R>(fx: Fx<Option.Option<A>, E, R>): Fx<A, E, R> => filterMap(fx, identity)

/**
 * @since 1.20.0
 */
export const mapEffect: {
  <A, B, E2, R2>(f: (a: A) => Effect.Effect<B, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<B, E | E2, R | R2>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<B, E2, R2>): Fx<B, E | E2, R | R2>
} = dual(2, core.mapEffect)

/**
 * @since 1.20.0
 */
export const filterMapEffect: {
  <A, B, E2, R2>(f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<B, E | E2, R | R2>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>): Fx<B, E | E2, R | R2>
} = dual(2, core.filterMapEffect)

/**
 * @since 1.20.0
 */
export const filterEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<boolean, E2, R2>): Fx<A, E | E2, R | R2>
} = dual(2, core.filterEffect)

/**
 * @since 1.20.0
 */
export const tapEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<unknown, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<unknown, E2, R2>): Fx<A, E | E2, R | R2>
} = dual(2, core.tapEffect)

/**
 * @since 1.20.0
 */
export const tap: {
  <A>(f: (a: A) => unknown): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: (a: A) => unknown): Fx<A, E, R>
} = dual(2, (fx, f) => tapEffect(fx, (a) => Effect.sync(() => f(a))))

/**
 * @since 1.20.0
 */
export const loop: {
  <B, A, C>(seed: B, f: (acc: B, a: A) => readonly [C, B]): <E, R>(fx: Fx<A, E, R>) => Fx<C, E, R>
  <A, E, R, B, C>(fx: Fx<A, E, R>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Fx<C, E, R>
} = dual(3, core.loop)

/**
 * @since 1.20.0
 */
export const filterMapLoop: {
  <B, A, C>(seed: B, f: (acc: B, a: A) => readonly [Option.Option<C>, B]): <E, R>(fx: Fx<A, E, R>) => Fx<C, E, R>
  <A, E, R, B, C>(fx: Fx<A, E, R>, seed: B, f: (acc: B, a: A) => readonly [Option.Option<C>, B]): Fx<C, E, R>
} = dual(3, core.filterMapLoop)

/**
 * @since 1.20.0
 */
export const loopEffect: {
  <B, E2, R2, A, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E2, R2>
  ): <E, R>(fx: Fx<A, E, R>) => Fx<C, E | E2, R | R2>
  <A, E, R, B, E2, R2, C>(
    fx: Fx<A, E, R>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E2, R2>
  ): Fx<C, E | E2, R | R2>
} = dual(3, core.loopEffect)

/**
 * @since 1.20.0
 */
export const filterMapLoopEffect: {
  <B, E2, R2, A, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E2, R2>
  ): <E, R>(fx: Fx<A, E, R>) => Fx<C, E | E2, R | R2>
  <A, E, R, B, E2, R2, C>(
    fx: Fx<A, E, R>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E2, R2>
  ): Fx<C, E | E2, R | R2>
} = dual(3, core.filterMapLoopEffect)

/**
 * @since 1.20.0
 */
export const observe: {
  <A, B, E2, R2>(f: (a: A) => Effect.Effect<B, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Effect.Effect<void, E | E2, R | R2>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<B, E2, R2>): Effect.Effect<void, E | E2, R | R2>
} = dual(2, core.observe)

/**
 * @since 1.20.0
 */
export const drain: <A, E, R>(fx: Fx<A, E, R>) => Effect.Effect<void, E, R> = core.drain

/**
 * @since 1.20.0
 */
export const reduce: {
  <A, B>(seed: B, f: (acc: B, a: A) => B): <E, R>(fx: Fx<A, E, R>) => Effect.Effect<B, E, R>
  <A, E, R, B>(fx: Fx<A, E, R>, seed: B, f: (acc: B, a: A) => B): Effect.Effect<B, E, R>
} = dual(3, core.reduce)

/**
 * @since 1.20.0
 */
export const toReadonlyArray: <A, E, R>(fx: Fx<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R> = core.toReadonlyArray

/**
 * @since 1.20.0
 */
export const slice: {
  (drop: number, take: number): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, drop: number, take: number): Fx<A, E, R>
} = dual(3, core.slice)

/**
 * @since 1.20.0
 */
export const take: {
  (n: number): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, n: number): Fx<A, E, R>
} = dual(2, core.take)

/**
 * @since 1.20.0
 */
export const drop: {
  (n: number): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, n: number): Fx<A, E, R>
} = dual(2, core.drop)

/**
 * @since 1.20.0
 */
export const skipRepeats: <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R> = core.skipRepeats

/**
 * @since 1.20.0
 */
export const skipRepeatsWith: {
  <A>(eq: Equivalence.Equivalence<A>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, eq: Equivalence.Equivalence<A>): Fx<A, E, R>
} = dual(2, core.skipRepeatsWith)

/**
 * @since 1.20.0
 */
export const empty: Fx<never> = core.empty

/**
 * @since 1.20.0
 */
export const never: Fx<never> = core.never

/**
 * @since 1.20.0
 */
export const padWith: {
  <B, C>(start: Iterable<B>, end: Iterable<C>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A | B | C, E, R>
  <A, E, R, B, C>(fx: Fx<A, E, R>, start: Iterable<B>, end: Iterable<C>): Fx<A | B | C, E, R>
} = dual(3, core.padWith)

/**
 * @since 1.20.0
 */
export const prependAll: {
  <B>(start: Iterable<B>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A | B, E, R>
  <A, E, R, B>(fx: Fx<A, E, R>, start: Iterable<B>): Fx<A | B, E, R>
} = dual(2, core.prependAll)

/**
 * @since 1.20.0
 */
export const appendAll: {
  <C>(end: Iterable<C>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A | C, E, R>
  <A, E, R, C>(fx: Fx<A, E, R>, end: Iterable<C>): Fx<A | C, E, R>
} = dual(2, core.appendAll)

/**
 * @since 1.20.0
 */
export const prepend: {
  <B>(start: B): <A, E, R>(fx: Fx<A, E, R>) => Fx<A | B, E, R>
  <A, E, R, B>(fx: Fx<A, E, R>, start: B): Fx<A | B, E, R>
} = dual(2, core.prepend)

/**
 * @since 1.20.0
 */
export const append: {
  <C>(end: C): <A, E, R>(fx: Fx<A, E, R>) => Fx<A | C, E, R>
  <A, E, R, C>(fx: Fx<A, E, R>, end: C): Fx<A | C, E, R>
} = dual(2, core.append)

/**
 * @since 1.20.0
 */
export const scan: {
  <B, A>(seed: B, f: (b: B, a: A) => B): <E, R>(fx: Fx<A, E, R>) => Fx<B, E, R>
  <A, E, R, B>(fx: Fx<A, E, R>, seed: B, f: (b: B, a: A) => B): Fx<B, E, R>
} = dual(3, core.scan)

/**
 * @since 1.20.0
 */
export const flatMapWithStrategy: {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    strategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E | E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    strategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): Fx<B, E | E2, R | R2 | Scope.Scope>
} = dual(4, core.flatMapWithStrategy)

const isDataFirstFx = (args: IArguments) => isFx(args[0])

/**
 * @since 1.20.0
 */
export const flatMap: {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E | E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.flatMap)

/**
 * @since 1.20.0
 */
export const flatMapEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E | E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.flatMapEffect)

/**
 * @since 1.20.0
 */
export const switchMap: {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E | E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.switchMap)

/**
 * @since 1.20.0
 */
export const switchMapEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E | E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.switchMapEffect)

/**
 * @since 1.20.0
 */
export const exhaustMap: {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E | E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.exhaustMap)

/**
 * @since 1.20.0
 */
export const exhaustMapEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E | E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.exhaustMapEffect)

/**
 * @since 1.20.0
 */
export const exhaustMapLatest: {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E | E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.exhaustMapLatest)

/**
 * @since 1.20.0
 */
export const exhaustMapLatestEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E | E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.exhaustMapLatestEffect)

/**
 * @since 1.20.0
 */
export const flatMapConcurrently: {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    capacity: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E | E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    capacity: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.flatMapConcurrently)

/**
 * @since 1.20.0
 */
export const flatMapConcurrentlyEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>,
    capacity: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E | E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
    capacity: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.flatMapConcurrentlyEffect)

/**
 * @since 1.20.0
 */
export const concatMap: {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <E, R>(fx: Fx<A, E, R>) => Fx<B, E | E2, Scope.Scope | R | R2>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<B, E | E2, Scope.Scope | R | R2>
} = dual(isDataFirstFx, core.concatMap)

/**
 * @since 1.20.0
 */
export const fromFxEffect: <B, E, R, E2, R2>(effect: Effect.Effect<Fx<B, E2, R2>, E, R>) => Fx<B, E | E2, R | R2> =
  core.fromFxEffect

/**
 * @since 1.20.0
 */
export const continueWith: {
  <B, E2, R2>(f: () => Fx<B, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A | B, E | E2, R | R2>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, f: () => Fx<B, E2, R2>): Fx<A | B, E | E2, R | R2>
} = dual(2, core.continueWith)

/**
 * @since 1.20.0
 */
export const orElseCause: {
  <E, B, E2, R2>(f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>): <R, A>(fx: Fx<A, E, R>) => Fx<A | B, E2, R | R2>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>): Fx<A | B, E2, R | R2>
} = dual(2, core.orElseCause)

/**
 * @since 1.20.0
 */
export const orElse: {
  <E, B, E2, R2>(f: (error: E) => Fx<B, E2, R2>): <R, A>(fx: Fx<A, E, R>) => Fx<A | B, E2, R | R2>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, f: (error: E) => Fx<B, E2, R2>): Fx<A | B, E2, R | R2>
} = dual(2, core.orElse)

/**
 * @since 1.20.0
 */
export const suspend: <A, E, R>(f: () => Fx<A, E, R>) => Fx<A, E, R> = core.suspend

/**
 * @since 1.20.0
 */
export const mergeWithStrategy: {
  (strategy: MergeStrategy): <FX extends ReadonlyArray<Fx<any, any, any>>>(
    fx: FX
  ) => Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>>

  <const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fx: FX,
    stategy: MergeStrategy
  ): Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>>
} = dual(2, core.mergeWithStrategy)

/**
 * @since 1.20.0
 */
export const merge: {
  <B, E2, R2>(other: Fx<B, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A | B, E | E2, R | R2>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, other: Fx<B, E2, R2>): Fx<A | B, E | E2, R | R2>
} = dual(
  2,
  core.merge
)

/**
 * @since 1.20.0
 */
export const mergeAll: <FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
) => Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>> = core.mergeAll

/**
 * @since 1.20.0
 */
export const mergeOrdered: <FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
) => Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>> = core.mergeOrdered

/**
 * @since 1.20.0
 */
export const mergeOrderedConcurrently: <FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX,
  concurrency: number
) => Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>> = core.mergeOrderedConcurrently

/**
 * @since 1.20.0
 */
export const mergeSwitch: <FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
) => Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>> = core.mergeSwitch

/**
 * @since 1.20.0
 */
export const takeWhile: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <E, R>(fx: Fx<A, E, R>) => Fx<B, E, R>
  <A>(f: Predicate.Predicate<A>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R, B extends A>(fx: Fx<A, E, R>, f: Predicate.Refinement<A, B>): Fx<B, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: Predicate.Predicate<A>): Fx<A, E, R>
} = dual(2, core.takeWhile)

/**
 * @since 1.20.0
 */
export const takeUntil: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <E, R>(fx: Fx<A, E, R>) => Fx<Exclude<A, B>, E, R>
  <A>(f: Predicate.Predicate<A>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R, B extends A>(fx: Fx<A, E, R>, f: Predicate.Refinement<A, B>): Fx<Exclude<A, B>, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: Predicate.Predicate<A>): Fx<A, E, R>
} = dual(2, core.takeUntil)

/**
 * @since 1.20.0
 */
export const dropWhile: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <E, R>(fx: Fx<A, E, R>) => Fx<Exclude<A, B>, E, R>
  <A>(f: Predicate.Predicate<A>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R, B extends A>(fx: Fx<A, E, R>, f: Predicate.Refinement<A, B>): Fx<Exclude<A, B>, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: Predicate.Predicate<A>): Fx<A, E, R>
} = dual(2, core.dropWhile)

/**
 * @since 1.20.0
 */
export const dropUntil: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <E, R>(fx: Fx<A, E, R>) => Fx<A | B, E, R>
  <A>(f: Predicate.Predicate<A>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R, B extends A>(fx: Fx<A, E, R>, f: Predicate.Refinement<A, B>): Fx<A | B, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: Predicate.Predicate<A>): Fx<A, E, R>
} = dual(2, core.dropUntil)

/**
 * @since 1.20.0
 */
export const dropAfter: {
  <A, B extends A>(f: Predicate.Refinement<A, B>): <E, R>(fx: Fx<A, E, R>) => Fx<Exclude<A, B>, E, R>
  <A>(f: Predicate.Predicate<A>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R, B extends A>(fx: Fx<A, E, R>, f: Predicate.Refinement<A, B>): Fx<Exclude<A, B>, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: Predicate.Predicate<A>): Fx<A, E, R>
} = dual(2, core.dropAfter)

/**
 * @since 1.20.0
 */
export const takeWhileEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<boolean, E2, R2>): Fx<A, E | E2, R | R2>
} = dual(2, core.takeWhileEffect)

/**
 * @since 1.20.0
 */
export const takeUntiEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<boolean, E2, R2>): Fx<A, E | E2, R | R2>
} = dual(2, core.takeUntilEffect)

/**
 * @since 1.20.0
 */
export const dropWhileEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<boolean, E2, R2>): Fx<A, E | E2, R | R2>
} = dual(2, core.dropWhileEffect)

/**
 * @since 1.20.0
 */
export const dropUntilEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<boolean, E2, R2>): Fx<A, E | E2, R | R2>
} = dual(2, core.dropUntilEffect)

/**
 * @since 1.20.0
 */
export const dropAfterEffect: {
  <A, E2, R2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (a: A) => Effect.Effect<boolean, E2, R2>): Fx<A, E | E2, R | R2>
} = dual(2, core.dropAfterEffect)

/**
 * @since 1.20.0
 */
export const during: {
  <E2, R2, A, R3, E3, B>(
    window: Fx<Fx<B, E3, R3>, E2, R2>
  ): <E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2 | E3, R | R2 | R3 | Scope.Scope>
  <A, E, R, E2, R2, R3, E3, B>(
    fx: Fx<A, E, R>,
    window: Fx<Fx<B, E3, R3>, E2, R2>
  ): Fx<A, E | E2 | E3, R | R2 | R3 | Scope.Scope>
} = dual(2, core.during)

/**
 * @since 1.20.0
 */
export const since: {
  <B, E2, R2>(window: Fx<B, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2 | Scope.Scope>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, window: Fx<B, E2, R2>): Fx<A, E | E2, R | R2 | Scope.Scope>
} = dual(2, core.since)

/**
 * @since 1.20.0
 */
export const until: {
  <B, E2, R2>(window: Fx<B, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2 | Scope.Scope>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, window: Fx<B, E2, R2>): Fx<A, E | E2, R | R2 | Scope.Scope>
} = dual(2, core.until)

/**
 * @since 1.20.0
 */
export const middleware: {
  <R, A, E, R3>(
    effect: (effect: Effect.Effect<unknown, never, R>) => Effect.Effect<unknown, never, R3>,
    sink?: ((sink: Sink.Sink<A, E>) => Sink.Sink<A, E, R>) | undefined
  ): <A, E>(fx: Fx<A, E, R>) => Fx<A, E, R3>

  <A, E, R, R3>(
    fx: Fx<A, E, R>,
    effect: (effect: Effect.Effect<unknown, never, R>) => Effect.Effect<unknown, never, R3>,
    sink?: ((sink: Sink.Sink<A, E>) => Sink.Sink<A, E, R>) | undefined
  ): Fx<A, E, R3>
} = dual(isDataFirstFx, core.middleware)

/**
 * @since 1.20.0
 */
export const onExit: {
  <R2>(
    f: (exit: Exit.Exit<unknown>) => Effect.Effect<unknown, never, R2>
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R2>

  <A, E, R, R2>(
    fx: Fx<A, E, R>,
    f: (exit: Exit.Exit<unknown>) => Effect.Effect<unknown, never, R2>
  ): Fx<A, E, R | R2>
} = dual(2, core.onExit)

/**
 * @since 1.20.0
 */
export const onInterrupt: {
  <R2>(
    f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<unknown, never, R2>
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R2>
  <A, E, R, R2>(
    fx: Fx<A, E, R>,
    f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<unknown, never, R2>
  ): Fx<A, E, R | R2>
} = dual(2, core.onInterrupt)

/**
 * @since 1.20.0
 */
export const onError: {
  <R2>(f: (cause: Cause.Cause<never>) => Effect.Effect<unknown, never, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R2>
  <A, E, R, R2>(fx: Fx<A, E, R>, f: (cause: Cause.Cause<never>) => Effect.Effect<unknown, never, R2>): Fx<A, E, R | R2>
} = dual(2, core.onError)

/**
 * @since 1.20.0
 */
export const scoped: <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Exclude<R, Scope.Scope>> = core.scoped

/**
 * @since 1.20.0
 */
export const annotateLogs: {
  (key: string | Record<string, unknown>, value?: unknown): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, key: string | Record<string, unknown>, value?: unknown): Fx<A, E, R>
} = dual(isDataFirstFx, core.annotateLogs)

/**
 * @since 1.20.0
 */
export const annotateSpans: {
  (key: string | Record<string, unknown>, value?: unknown): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, key: string | Record<string, unknown>, value?: unknown): Fx<A, E, R>
} = dual(isDataFirstFx, core.annotateSpans)

/**
 * @since 1.20.0
 */
export const interruptible: <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R> = core.interruptible

/**
 * @since 1.20.0
 */
export const uninterruptible: <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R> = core.uninterruptible

/**
 * @since 1.20.0
 */
export const locally: {
  <A>(self: FiberRef.FiberRef<A>, value: A): <B, E, R>(fx: Fx<B, E, R>) => Fx<B, E, R>
  <B, E, R, A>(use: Fx<B, E, R>, self: FiberRef.FiberRef<A>, value: A): Fx<B, E, R>
} = dual(3, core.locally)

/**
 * @since 1.20.0
 */
export const locallyWith: {
  <A>(self: FiberRef.FiberRef<A>, f: (a: A) => A): <B, E, R>(fx: Fx<B, E, R>) => Fx<B, E, R>
  <B, E, R, A>(use: Fx<B, E, R>, self: FiberRef.FiberRef<A>, f: (a: A) => A): Fx<B, E, R>
} = dual(3, core.locallyWith)

/**
 * @since 1.20.0
 */
export const withTracerTiming: {
  (enabled: boolean): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, enabled: boolean): Fx<A, E, R>
} = dual(2, core.withTracerTiming)

/**
 * @since 1.20.0
 */
export const withConcurrency: {
  (concurrency: number | "unbounded"): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, concurrency: number | "unbounded"): Fx<A, E, R>
} = dual(2, core.withConcurrency)

/**
 * @since 1.20.0
 */
export const withConfigProvider: {
  (configProvider: ConfigProvider.ConfigProvider): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, configProvider: ConfigProvider.ConfigProvider): Fx<A, E, R>
} = dual(2, core.withConfigProvider)

/**
 * @since 1.20.0
 */
export const withLogSpan: {
  (span: string): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, span: string): Fx<A, E, R>
} = dual(2, core.withLogSpan)

/**
 * @since 1.20.0
 */
export const withMaxOpsBeforeYield: {
  (maxOps: number): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, maxOps: number): Fx<A, E, R>
} = dual(2, core.withMaxOpsBeforeYield)

/**
 * @since 1.20.0
 */
export const withParentSpan: {
  (parentSpan: Tracer.ParentSpan): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, parentSpan: Tracer.ParentSpan): Fx<A, E, R>
} = dual(2, core.withParentSpan)

/**
 * @since 1.20.0
 */
export const withRequestBatching: {
  (requestBatching: boolean): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, requestBatching: boolean): Fx<A, E, R>
} = dual(2, core.withRequestBatching)

/**
 * @since 1.20.0
 */
export const withRequestCache: {
  (cache: Request.Cache): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, cache: Request.Cache): Fx<A, E, R>
} = dual(2, core.withRequestCache)

/**
 * @since 1.20.0
 */
export const withRequestCaching: {
  (requestCaching: boolean): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, requestCaching: boolean): Fx<A, E, R>
} = dual(2, core.withRequestCaching)

/**
 * @since 1.20.0
 */
export const withTracer: {
  (tracer: Tracer.Tracer): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, tracer: Tracer.Tracer): Fx<A, E, R>
} = dual(2, core.withTracer)

/**
 * @since 1.20.0
 */
export const acquireUseRelease: {
  <A, B, E2, R2, C, E3, R3>(
    use: (a: A) => Fx<B, E2, R2>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<C, E3, R3>
  ): <E, R>(acquire: Effect.Effect<A, E, R>) => Fx<B, E | E2 | E3, R | R2 | R3>
  <A, E, R, B, E2, R2, C, E3, R3>(
    acquire: Effect.Effect<A, E, R>,
    use: (a: A) => Fx<B, E2, R2>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<C, E3, R3>
  ): Fx<B, E | E2 | E3, R | R2 | R3>
} = dual(3, core.acquireUseRelease)

/**
 * @since 1.20.0
 */
export const withSpan: {
  (name: string, options?: {
    readonly attributes?: Record<string, unknown>
    readonly links?: ReadonlyArray<Tracer.SpanLink>
    readonly parent?: Tracer.ParentSpan
    readonly root?: boolean
    readonly context?: Ctx.Context<never>
  }): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E, R>

  <A, E, R>(self: Fx<A, E, R>, name: string, options?: {
    readonly attributes?: Record<string, unknown>
    readonly links?: ReadonlyArray<Tracer.SpanLink>
    readonly parent?: Tracer.ParentSpan
    readonly root?: boolean
    readonly context?: Ctx.Context<never>
  }): Fx<A, E, R>
} = dual(3, core.withSpan)

/**
 * @since 1.20.0
 */
export const provideContext: {
  <R2>(context: Ctx.Context<R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Exclude<R, R2>>
  <A, E, R, R2>(fx: Fx<A, E, R>, context: Ctx.Context<R2>): Fx<A, E, Exclude<R, R2>>
} = dual(2, core.provideContext)

/**
 * @since 1.20.0
 */
export const provideLayer: {
  <E2, R2, S>(layer: Layer.Layer<S, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R2 | Exclude<R, S>>
  <A, E, R, E2, R2, S>(fx: Fx<A, E, R>, layer: Layer.Layer<S, E2, R2>): Fx<A, E | E2, R2 | Exclude<R, S>>
} = dual(2, core.provideLayer)

/**
 * @since 1.20.0
 */
export const provideRuntime: {
  <R2>(runtime: Runtime.Runtime<R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Exclude<R, R2>>
  <A, E, R, R2>(fx: Fx<A, E, R>, runtime: Runtime.Runtime<R2>): Fx<A, E, Exclude<R, R2>>
} = dual(2, core.provideRuntime)

/**
 * @since 1.20.0
 */
export const provideService: {
  <I, S>(service: Ctx.Tag<I, S>, instance: S): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Exclude<R, I>>
  <A, E, R, I, S>(fx: Fx<A, E, R>, service: Ctx.Tag<I, S>, instance: S): Fx<A, E, Exclude<R, I>>
} = dual(3, core.provideService)

/**
 * @since 1.20.0
 */
export const provideServiceEffect: {
  <I, S, E2, R2>(
    service: Ctx.Tag<I, S>,
    instance: Effect.Effect<S, E2, R2>
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R2 | Exclude<R, I>>
  <A, E, R, I, S, E2, R2>(
    fx: Fx<A, E, R>,
    service: Ctx.Tag<I, S>,
    instance: Effect.Effect<S, E2, R2>
  ): Fx<A, E | E2, R2 | Exclude<R, I>>
} = dual(3, core.provideServiceEffect)

/**
 * @since 1.20.0
 */
export const provide: {
  <R2>(context: Ctx.Context<R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Exclude<R, R2>>
  <R2>(runtime: Runtime.Runtime<R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Exclude<R, R2>>
  <S, E2, R2>(layer: Layer.Layer<S, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R2 | Exclude<R, S>>
  <S, E2 = never, R2 = never>(
    provide: Layer.Layer<S, E2, R2> | Ctx.Context<S> | Runtime.Runtime<S>
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R2 | Exclude<R, S>>

  <A, E, R, R2>(fx: Fx<A, E, R>, context: Ctx.Context<R2>): Fx<A, E, Exclude<R, R2>>
  <A, E, R, R2>(fx: Fx<A, E, R>, runtime: Runtime.Runtime<R2>): Fx<A, E, Exclude<R, R2>>
  <A, E, R, S, E2, R2>(fx: Fx<A, E, R>, layer: Layer.Layer<S, E2, R2>): Fx<A, E | E2, R2 | Exclude<R, S>>
  <A, E, R, S, E2 = never, R2 = never>(
    fx: Fx<A, E, R>,
    provide: Layer.Layer<S, E2, R2> | Ctx.Context<S> | Runtime.Runtime<S>
  ): Fx<A, E | E2, R2 | Exclude<R, S>>
} = dual(2, core.provide)

/**
 * @since 1.20.0
 */
export const share: {
  <E2, R2, A>(subject: Subject.Subject<A, E2, R2>): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R | R2 | Scope.Scope>
  <A, E, R, R2>(fx: Fx<A, E, R>, subject: Subject.Subject<A, E, R2>): Fx<A, E, R | R2 | Scope.Scope>
} = dual(2, coreShare.share)

/**
 * @since 1.20.0
 */
export const multicast: <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Scope.Scope | R> = coreShare.multicast

/**
 * @since 1.20.0
 */
export const hold: <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Scope.Scope | R> = coreShare.hold

/**
 * @since 1.20.0
 */
export const replay: {
  (capacity: number): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Scope.Scope | R>
  <A, E, R>(fx: Fx<A, E, R>, capacity: number): Fx<A, E, Scope.Scope | R>
} = dual(2, coreShare.replay)

/**
 * @since 1.20.0
 */
export const mapCause: {
  <E, E2>(f: (cause: Cause.Cause<E>) => Cause.Cause<E2>): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2, R>
  <A, E, R, E2>(fx: Fx<A, E, R>, f: (cause: Cause.Cause<E>) => Cause.Cause<E2>): Fx<A, E2, R>
} = dual(2, core.mapCause)

/**
 * @since 1.20.0
 */
export const mapError: {
  <E, E2>(f: (e: E) => E2): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2, R>
  <A, E, R, E2>(fx: Fx<A, E, R>, f: (e: E) => E2): Fx<A, E2, R>
} = dual(2, core.mapError)

/**
 * @since 1.20.0
 */
export const mapBoth: {
  <E, E2, A, B>(f: (e: E) => E2, g: (a: A) => B): <R>(fx: Fx<A, E, R>) => Fx<B, E2, R>
  <A, E, R, B, C>(fx: Fx<A, E, R>, f: (e: E) => B, g: (a: A) => C): Fx<C, B, R>
} = dual(3, core.mapBoth)

/**
 * @since 1.20.0
 */
export const filterCause: {
  <E>(f: (cause: Cause.Cause<E>) => boolean): <R, A>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: (cause: Cause.Cause<E>) => boolean): Fx<A, E, R>
} = dual(2, core.filterCause)

/**
 * @since 1.20.0
 */
export const filterError: {
  <E>(f: (e: E) => boolean): <R, A>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, f: (e: E) => boolean): Fx<A, E, R>
} = dual(2, core.filterError)

/**
 * @since 1.20.0
 */
export const filterMapCause: {
  <E, E2>(f: (cause: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2, R>
  <A, E, R, E2>(fx: Fx<A, E, R>, f: (cause: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>): Fx<A, E2, R>
} = dual(2, core.filterMapCause)

/**
 * @since 1.20.0
 */
export const filterMapError: {
  <E, E2>(f: (e: E) => Option.Option<E2>): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2, R>
  <A, E, R, E2>(fx: Fx<A, E, R>, f: (e: E) => Option.Option<E2>): Fx<A, E2, R>
} = dual(2, core.filterMapError)

/**
 * @since 1.20.0
 */
export const mapCauseEffect: {
  <E3, E2, R2>(f: (cause: Cause.Cause<E2>) => Effect.Effect<Cause.Cause<E3>, E3, R2>): <A, E, R>(
    fx: Fx<A, E, R>
  ) => Fx<A, E2 | E3, R | R2>
  <A, E, R, E3, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<Cause.Cause<E3>, E2, R2>
  ): Fx<A, E2 | E3, R | R2>
} = dual(2, core.mapCauseEffect)

/**
 * @since 1.20.0
 */
export const mapErrorEffect: {
  <E3, E2, R2>(f: (e: E2) => Effect.Effect<E3, E3, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E2 | E3, R | R2>
  <A, E, R, E3, E2, R2>(fx: Fx<A, E, R>, f: (e: E) => Effect.Effect<E3, E2, R2>): Fx<A, E2 | E3, R | R2>
} = dual(2, core.mapErrorEffect)

/**
 * @since 1.20.0
 */
export const filterCauseEffect: {
  <E, E2, R2>(f: (cause: Cause.Cause<E>) => Effect.Effect<boolean, E2, R2>): <R, A>(
    fx: Fx<A, E, R>
  ) => Fx<A, E2, R | R2>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (cause: Cause.Cause<E>) => Effect.Effect<boolean, E2, R2>): Fx<A, E2, R | R2>
} = dual(2, core.filterCauseEffect)

/**
 * @since 1.20.0
 */
export const filterErrorEffect: {
  <E, E2, R2>(f: (e: E) => Effect.Effect<boolean, E2, R2>): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2, R | R2>
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, f: (e: E) => Effect.Effect<boolean, E2, R2>): Fx<A, E2, R | R2>
} = dual(2, core.filterErrorEffect)

/**
 * @since 1.20.0
 */
export const filterMapCauseEffect: {
  <E3, E2, R2>(f: (cause: Cause.Cause<E2>) => Effect.Effect<Option.Option<Cause.Cause<E3>>, E2, R2>): <A, E, R>(
    fx: Fx<A, E, R>
  ) => Fx<A, E2 | E3, R | R2>
  <A, E, R, E3, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<Option.Option<Cause.Cause<E3>>, E2, R2>
  ): Fx<A, E2 | E3, R | R2>
} = dual(2, core.filterMapCauseEffect)

/**
 * @since 1.20.0
 */
export const filterMapErrorEffect: {
  <E, E3, E2, R2>(
    f: (e: E) => Effect.Effect<Option.Option<E3>, E2, R2>
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2 | E3, R | R2>
  <A, E, R, E3, E2, R2>(fx: Fx<A, E, R>, f: (e: E) => Effect.Effect<Option.Option<E3>, E2, R2>): Fx<A, E2 | E3, R | R2>
} = dual(2, core.filterMapErrorEffect)

/**
 * @since 1.20.0
 */
export const loopCause: {
  <B, E, C>(
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => readonly [Cause.Cause<C>, B]
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A, C, R>

  <A, E, R, B, C>(
    fx: Fx<A, E, R>,
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => readonly [Cause.Cause<C>, B]
  ): Fx<A, C, R>
} = dual(3, core.loopCause)

/**
 * @since 1.20.0
 */
export const loopError: {
  <B, E, C>(seed: B, f: (b: B, e: E) => readonly [C, B]): <R, A>(fx: Fx<A, E, R>) => Fx<A, C, R>
  <A, E, R, B, C>(fx: Fx<A, E, R>, seed: B, f: (b: B, e: E) => readonly [C, B]): Fx<A, C, R>
} = dual(3, core.loopError)

/**
 * @since 1.20.0
 */
export const loopCauseEffect: {
  <B, E, E2, R2, C>(
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<readonly [Cause.Cause<C>, B], E2, R2>
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2 | C, R | R2>
  <A, E, R, B, E2, R2, C>(
    fx: Fx<A, E, R>,
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<readonly [Cause.Cause<C>, B], E2, R2>
  ): Fx<A, E2 | C, R | R2>
} = dual(3, core.loopCauseEffect)

/**
 * @since 1.20.0
 */
export const loopErrorEffect: {
  <B, E, E2, R2, C>(seed: B, f: (b: B, e: E) => Effect.Effect<readonly [C, B], E2, R2>): <R, A>(
    fx: Fx<A, E, R>
  ) => Fx<A, E2 | C, R | R2>
  <A, E, R, B, E2, R2, C>(
    fx: Fx<A, E, R>,
    seed: B,
    f: (b: B, e: E) => Effect.Effect<readonly [C, B], E2, R2>
  ): Fx<A, E2 | C, R | R2>
} = dual(3, core.loopErrorEffect)

/**
 * @since 1.20.0
 */
export const filterMapLoopCause: {
  <B, E, E2, R2, C>(
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<readonly [Option.Option<Cause.Cause<C>>, B], E2, R2>
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2 | C, R | R2>
  <A, E, R, B, C>(
    fx: Fx<A, E, R>,
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B]
  ): Fx<A, C, R>
} = dual(3, core.filterMapLoopCause)

/**
 * @since 1.20.0
 */
export const filterMapLoopError: {
  <B, E, E2, R2, C>(seed: B, f: (b: B, e: E) => Effect.Effect<readonly [Option.Option<C>, B], E2, R2>): <R, A>(
    fx: Fx<A, E, R>
  ) => Fx<A, E2 | C, R | R2>
  <A, E, R, B, C>(fx: Fx<A, E, R>, seed: B, f: (b: B, e: E) => readonly [Option.Option<C>, B]): Fx<A, C, R>
} = dual(3, core.filterMapLoopError)

/**
 * @since 1.20.0
 */
export const filterMapLoopCauseEffect: {
  <B, E, E2, R2, C>(
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<readonly [Option.Option<Cause.Cause<C>>, B], E2, R2>
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A, E2 | C, R | R2>
  <A, E, R, B, E2, R2, C>(
    fx: Fx<A, E, R>,
    seed: B,
    f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<readonly [Option.Option<Cause.Cause<C>>, B], E2, R2>
  ): Fx<A, E2 | C, R | R2>
} = dual(3, core.filterMapLoopCauseEffect)

/**
 * @since 1.20.0
 */
export const filterMapLoopErrorEffect: {
  <B, E, E2, R2, C>(seed: B, f: (b: B, e: E) => Effect.Effect<readonly [Option.Option<C>, B], E2, R2>): <R, A>(
    fx: Fx<A, E, R>
  ) => Fx<A, E2 | C, R | R2>
  <A, E, R, B, E2, R2, C>(
    fx: Fx<A, E, R>,
    seed: B,
    f: (b: B, e: E) => Effect.Effect<readonly [Option.Option<C>, B], E2, R2>
  ): Fx<A, E2 | C, R | R2>
} = dual(3, core.filterMapLoopErrorEffect)

/**
 * @since 1.20.0
 */
export const flatMapCauseWithStrategy: {
  <E, B, E2, R2>(
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    flattenStrategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A | B, E2, R | R2 | Scope.Scope>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    flattenStrategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): Fx<A | B, E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.flatMapCauseWithStrategy)

/**
 * @since 1.20.0
 */
export const flatMapErrorWithStrategy: {
  <E, B, E2, R2>(
    f: (e: E) => Fx<B, E2, R2>,
    flattenStrategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A | B, E2, R | R2 | Scope.Scope>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (e: E) => Fx<B, E2, R2>,
    flattenStrategy: FlattenStrategy,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy
  ): Fx<A | B, E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.flatMapErrorWithStrategy)

/**
 * @since 1.20.0
 */
export const switchMapCause: {
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, R | R2 | Scope.Scope>

  <E, B, E2, R2>(
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A | B, E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.switchMapCause)

/**
 * @since 1.20.0
 */
export const switchMapError: {
  <E, B, E2, R2>(
    f: (e: E) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A | B, E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (e: E) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.switchMapError)

/**
 * @since 1.20.0
 */
export const flatMapCause: {
  <E, B, E2, R2>(
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A | B, E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.flatMapCause)

/**
 * @since 1.20.0
 */
export const flatMapError: {
  <E, B, E2, R2>(
    f: (e: E) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A | B, E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (e: E) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.flatMapError)

/**
 * @since 1.20.0
 */
export const flatMapCauseConcurrently: {
  <E, B, E2, R2>(
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    concurrency: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A | B, E2, R | R2 | Scope.Scope>
  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    concurrency: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.flatMapCauseConcurrently)

/**
 * @since 1.20.0
 */
export const flatMapErrorConcurrently: {
  <E, B, E2, R2>(
    f: (e: E) => Fx<B, E2, R2>,
    concurrency: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A | B, E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (e: E) => Fx<B, E2, R2>,
    concurrency: number,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.flatMapErrorConcurrently)

/**
 * @since 1.20.0
 */
export const exhaustMapCause: {
  <E, B, E2, R2>(
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A | B, E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.exhaustMapCause)

/**
 * @since 1.20.0
 */
export const exhaustMapError: {
  <E, B, E2, R2>(
    f: (e: E) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A | B, E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (e: E) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.exhaustMapError)

/**
 * @since 1.20.0
 */
export const exhaustMapLatestCause: {
  <E, B, E2, R2>(
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A | B, E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.exhaustMapLatestCause)

/**
 * @since 1.20.0
 */
export const exhaustMapLatestError: {
  <E, B, E2, R2>(
    f: (e: E) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): <R, A>(fx: Fx<A, E, R>) => Fx<A | B, E2, R | R2 | Scope.Scope>

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (e: E) => Fx<B, E2, R2>,
    executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
  ): Fx<A | B, E2, R | R2 | Scope.Scope>
} = dual(isDataFirstFx, core.exhaustMapLatestError)

/**
 * @since 1.20.0
 */
export type MatchCauseOptions<E, A, B, E2, R2, C, E3, R3> = {
  readonly onFailure: (cause: Cause.Cause<E>) => Fx<B, E2, R2>
  readonly onSuccess: (a: A) => Fx<C, E3, R3>
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
}

/**
 * @since 1.20.0
 */
export type MatchErrorOptions<E, A, B, E2, R2, C, E3, R3> = {
  readonly onFailure: (e: E) => Fx<B, E2, R2>
  readonly onSuccess: (a: A) => Fx<C, E3, R3>
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
}

/**
 * @since 1.20.0
 */
export type MatchCauseOptionsEffect<E, A, B, E2, R2, C, E3, R3> = {
  readonly onFailure: (cause: Cause.Cause<E>) => Effect.Effect<B, E2, R2>
  readonly onSuccess: (a: A) => Effect.Effect<C, E3, R3>
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
}

/**
 * @since 1.20.0
 */
export type MatchErrorOptionsEffect<E, A, B, E2, R2, C, E3, R3> = {
  readonly onFailure: (e: E) => Effect.Effect<B, E2, R2>
  readonly onSuccess: (a: A) => Effect.Effect<C, E3, R3>
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
}

/**
 * @since 1.20.0
 */
export const matchCauseWithStrategy: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>

  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    flattenStrategy: FlattenStrategy,
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
} = dual(3, core.matchCauseWithStrategy)

/**
 * @since 1.20.0
 */
export const matchErrorWithStrategy: {
  <E, A, B, E2, R2, C, E3, R3>(
    { executionStrategy, onFailure, onSuccess }: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    flattenStrategy: FlattenStrategy,
    { executionStrategy, onFailure, onSuccess }: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
} = dual(3, core.matchErrorWithStrategy)

/**
 * @since 1.20.0
 */
export const matchCause: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>

  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
} = dual(2, core.matchCause)

/**
 * @since 1.20.0
 */
export const matchError: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
} = dual(2, core.matchError)

/**
 * @since 1.20.0
 */
export const matchCauseConcurrently: {
  <E, A, B, E2, R2, C, E3, R3>(
    concurrency: number,
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    concurrency: number,
    opts: core.MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
} = dual(3, core.matchCauseConcurrently)

/**
 * @since 1.20.0
 */
export const matchErrorConcurrently: {
  <E, A, B, E2, R2, C, E3, R3>(
    concurrency: number,
    opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    concurrency: number,
    opts: core.MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
} = dual(3, core.matchErrorConcurrently)

/**
 * @since 1.20.0
 */
export const switchMatchCause: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>

  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
} = dual(2, core.switchMatchCause)

/**
 * @since 2.0.0
 */
export const switchMatchCauseEffect: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchCauseOptionsEffect<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: MatchCauseOptionsEffect<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
} = dual(2, (fx, opts) =>
  switchMatchCause(fx, {
    onFailure: (e) => core.fromEffect(opts.onFailure(e)),
    onSuccess: (a) => core.fromEffect(opts.onSuccess(a))
  }))

/**
 * @since 1.20.0
 */
export const switchMatchError: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
} = dual(2, core.switchMatchError)

/**
 * @since 2.0.0
 */
export const switchMatchErrorEffect: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchErrorOptionsEffect<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: MatchErrorOptionsEffect<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
} = dual(2, (fx, opts) =>
  switchMatchError(fx, {
    onFailure: (e) => core.fromEffect(opts.onFailure(e)),
    onSuccess: (a) => core.fromEffect(opts.onSuccess(a))
  }))

/**
 * @since 1.20.0
 */
export const exhaustMatchCause: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>

  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
} = dual(2, core.exhaustMatchCause)

/**
 * @since 1.20.0
 */
export const exhaustMatchError: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: core.MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
} = dual(2, core.exhaustMatchError)

/**
 * @since 1.20.0
 */
export const exhaustMatchLatestCause: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>

  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, Scope.Scope | R | R2 | R3>
} = dual(2, core.exhaustMatchLatestCause)

/**
 * @since 1.20.0
 */
export const exhaustMatchLatestError: {
  <E, A, B, E2, R2, C, E3, R3>(
    opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): <R>(fx: Fx<A, E, R>) => Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    opts: core.MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
  ): Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope>
} = dual(2, core.exhaustMatchLatestError)

/**
 * @since 1.20.0
 */
export const exit: <A, E, R>(fx: Fx<A, E, R>) => Fx<Exit.Exit<A, E>, never, R> = core.exit

/**
 * @since 1.20.0
 */
export const either: <A, E, R>(fx: Fx<A, E, R>) => Fx<Either.Either<A, E>, never, R> = core.either

/**
 * @since 1.20.0
 */
export const tuple: <const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
) => Fx<{ readonly [K in keyof FX]: Fx.Success<FX[K]> }, Fx.Error<FX[number]>, Fx.Context<FX[number]>> = core.tuple

/**
 * @since 1.20.0
 */
export const struct: <const FX extends Readonly<Record<string, Fx<any, any, any>>>>(
  fx: FX
) => Fx<{ readonly [K in keyof FX]: Fx.Success<FX[K]> }, Fx.Error<FX[string]>, Fx.Context<FX[string]>> = core.struct

/**
 * @since 1.20.0
 */
export const all: {
  <const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fx: FX
  ): Fx<{ readonly [K in keyof FX]: Fx.Success<FX[K]> }, Fx.Error<FX[number]>, Fx.Context<FX[number]>>
  <const FX extends Readonly<Record<string, Fx<any, any, any>>>>(
    fx: FX
  ): Fx<{ readonly [K in keyof FX]: Fx.Success<FX[K]> }, Fx.Error<FX[string]>, Fx.Context<FX[string]>>
} = core.all

/**
 * @since 1.20.0
 */
export const toEnqueue: {
  <R2 = never, A = never>(
    queue: Ctx.Enqueue<R2, A> | Queue.Enqueue<A>
  ): <E, R>(fx: Fx<A, E, R>) => Effect.Effect<void, E, R | R2>
  <A, E, R, R2 = never>(fx: Fx<A, E, R>, queue: Ctx.Enqueue<R2, A> | Queue.Enqueue<A>): Effect.Effect<void, E, R | R2>
} = dual(2, core.toEnqueue)

/**
 * @since 1.20.0
 */
export const debounce: {
  (delay: Duration.DurationInput): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R | Scope.Scope>
  <A, E, R>(fx: Fx<A, E, R>, delay: Duration.DurationInput): Fx<A, E, R | Scope.Scope>
} = dual(2, core.debounce)

/**
 * @since 1.20.0
 */
export const throttle: {
  (delay: Duration.DurationInput): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R | Scope.Scope>
  <A, E, R>(fx: Fx<A, E, R>, delay: Duration.DurationInput): Fx<A, E, R | Scope.Scope>
} = dual(2, core.throttle)

/**
 * @since 1.20.0
 */
export const throttleLatest: {
  (delay: Duration.DurationInput): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R | Scope.Scope>
  <A, E, R>(fx: Fx<A, E, R>, delay: Duration.DurationInput): Fx<A, E, R | Scope.Scope>
} = dual(2, core.throttleLatest)

/**
 * @since 1.20.0
 */
export interface KeyedOptions<A, B, C, E2, R2> {
  readonly getKey: (a: A) => B
  readonly onValue: (ref: RefSubject<A>, key: B) => Fx<C, E2, R2>
  readonly debounce?: Duration.DurationInput
}

/**
 * @since 1.20.0
 */
export const keyed: {
  <A, B extends PropertyKey, E2, R2, C>(
    options: KeyedOptions<A, B, C, E2, R2>
  ): <E, R>(fx: Fx<ReadonlyArray<A>, E, R>) => Fx<ReadonlyArray<C>, E | E2, R | R2>

  <A, E, R, B extends PropertyKey, E2, R2, C>(
    fx: Fx<ReadonlyArray<A>, E, R>,
    options: KeyedOptions<A, B, C, E2, R2>
  ): Fx<ReadonlyArray<C>, E | E2, R | R2>
} = dual(2, coreKeyed.keyed)

/**
 * @since 1.20.0
 */
export interface WithKeyOptions<A, B, C, E2, R2> {
  readonly getKey: (a: A) => B
  readonly onValue: (ref: RefSubject<A>, key: B) => Fx<C, E2, R2>
}

/**
 * @since 1.20.0
 */
export const withKey: {
  <A, B extends PropertyKey, E2, R2, C>(
    options: WithKeyOptions<A, B, C, E2, R2>
  ): <E, R>(fx: Fx<A, E, R>) => Fx<C, E | E2, R | R2>

  <A, E, R, B extends PropertyKey, E2, R2, C>(
    fx: Fx<A, E, R>,
    options: WithKeyOptions<A, B, C, E2, R2>
  ): Fx<C, E | E2, R | R2>
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
  ): <E, R>(
    fx: Fx<A, E, R>
  ) => Fx<
    Fx.Success<ReturnType<Matchers[keyof Matchers]>>,
    E | Fx.Error<ReturnType<Matchers[keyof Matchers]>>,
    R | Fx.Context<ReturnType<Matchers[keyof Matchers]>>
  >

  <A extends { readonly _tag: string }, E, R, Matchers extends DefaultMatchersFrom<A>>(
    fx: Fx<A, E, R>,
    matchers: Matchers
  ): Fx<
    Fx.Success<ReturnType<Matchers[keyof Matchers]>>,
    E | Fx.Error<ReturnType<Matchers[keyof Matchers]>>,
    R | Fx.Context<ReturnType<Matchers[keyof Matchers]>>
  >
} = dual(
  2,
  function matchTags<A extends { readonly _tag: string }, E, R, Matchers extends DefaultMatchersFrom<A>>(
    fx: Fx<A, E, R>,
    matchers: Matchers
  ): Fx<
    Fx.Success<ReturnType<Matchers[keyof Matchers]>>,
    E | Fx.Error<ReturnType<Matchers[keyof Matchers]>>,
    R | Fx.Context<ReturnType<Matchers[keyof Matchers]>>
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
    value: RefSubject<Extract<A, { readonly _tag: Tag }>>
  ) => Fx<any, any, any>
}

/**
 * @since 1.20.0
 */
export const matchOption: {
  <A, B = never, E2 = never, R2 = never, C = never, E3 = never, R3 = never>(
    onNone: () => Fx<B, E2, R2>,
    onSome: (a: RefSubject<A>) => Fx<C, E3, R3>
  ): <E, R>(fx: Fx<Option.Option<A>, E, R>) => Fx<B | C, E | E2 | E3, R | R2 | R3 | Scope.Scope>

  <A, E, R, B = never, E2 = never, R2 = never, C = never, E3 = never, R3 = never>(
    fx: Fx<Option.Option<A>, E, R>,
    onNone: () => Fx<B, E2, R2>,
    onSome: (a: RefSubject<A>) => Fx<C, E3, R3>
  ): Fx<B | C, E | E2 | E3, R | R2 | R3 | Scope.Scope>
} = dual(
  3,
  function matchOption<A, E, R, B = never, E2 = never, R2 = never, C = never, E3 = never, R3 = never>(
    fx: Fx<Option.Option<A>, E, R>,
    onNone: () => Fx<B, E2, R2>,
    onSome: (a: RefSubject<A>) => Fx<C, E3, R3>
  ): Fx<B | C, E | E2 | E3, R | R2 | R3 | Scope.Scope> {
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
  <A, B = never, E2 = never, R2 = never>(
    orElse: () => Fx<B, E2, R2>
  ): <E, R>(fx: Fx<Option.Option<A>, E, R>) => Fx<A | B, E | E2, R | R2 | Scope.Scope>

  <A, E, R, B = never, E2 = never, R2 = never>(
    fx: Fx<Option.Option<A>, E, R>,
    orElse: () => Fx<B, E2, R2>
  ): Fx<A | B, E | E2, R | R2 | Scope.Scope>
} = dual(
  2,
  function getOrElse<A, E, R, B = never, E2 = never, R2 = never>(
    fx: Fx<Option.Option<A>, E, R>,
    orElse: () => Fx<B, E2, R2>
  ): Fx<A | B, E | E2, R | R2 | Scope.Scope> {
    return matchOption(fx, () => orElse(), (ref) => ref)
  }
)

/**
 * @since 1.20.0
 */
export const matchEither: {
  <E1, A, B = never, E2 = never, R2 = never, C = never, E3 = never, R3 = never>(
    onLeft: (e: RefSubject<E1>) => Fx<B, E2, R2>,
    onRight: (a: RefSubject<A>) => Fx<C, E3, R3>
  ): <E, R>(fx: Fx<Either.Either<A, E1>, E, R>) => Fx<B | C, E | E2 | E3, R | R2 | R3 | Scope.Scope>

  <R, E, E1, A, B = never, E2 = never, R2 = never, C = never, E3 = never, R3 = never>(
    fx: Fx<Either.Either<A, E1>, E, R>,
    onLeft: (e: RefSubject<E1>) => Fx<B, E2, R2>,
    onRight: (a: RefSubject<A>) => Fx<C, E3, R3>
  ): Fx<B | C, E | E2 | E3, R | R2 | R3 | Scope.Scope>
} = dual(
  3,
  function matchEither<R, E, E1, A, B = never, E2 = never, R2 = never, C = never, E3 = never, R3 = never>(
    fx: Fx<Either.Either<A, E1>, E, R>,
    onLeft: (e: RefSubject<E1>) => Fx<B, E2, R2>,
    onRight: (a: RefSubject<A>) => Fx<C, E3, R3>
  ): Fx<B | C, E | E2 | E3, R | R2 | R3 | Scope.Scope> {
    return matchTags(fx, {
      Left: (left) => onLeft(transform(left, (a) => a.left, (a) => Either.left(a) as Either.Left<E1, A>)),
      Right: (right) => onRight(transform(right, (s) => s.right, (value) => Either.right(value) as Either.Right<E1, A>))
    })
  }
)

/**
 * @since 1.20.0
 */
export const at: {
  (duration: Duration.DurationInput): <A>(value: A) => Fx<A>
  <A>(value: A, duration: Duration.DurationInput): Fx<A>
} = dual(
  2,
  <A>(value: A, duration: Duration.DurationInput): Fx<A> => fromEffect(Effect.delay(Effect.succeed(value), duration))
)

/**
 * @since 1.20.0
 */
export function drainLayer<FXS extends ReadonlyArray<Fx<any, never, any>>>(
  ...fxs: FXS
): Layer.Layer<never, never, Exclude<Fx.Context<FXS[number]>, Scope.Scope>> {
  return Layer.scopedDiscard(Effect.forkWithErrorHandler(core.drain(core.mergeAll(fxs)), Effect.logError))
}

/**
 * @since 1.20.0
 */
export const fork = <A, E, R>(fx: Fx<A, E, R>): Effect.Effect<Fiber.RuntimeFiber<void, E>, never, R> =>
  Effect.fork(drain(fx))

/**
 * @since 1.20.0
 */
export const forkScoped = <A, E, R>(
  fx: Fx<A, E, R>
): Effect.Effect<Fiber.RuntimeFiber<void, E>, never, R | Scope.Scope> => Effect.forkScoped(drain(fx))

/**
 * @since 1.20.0
 */
export const forkDaemon = <A, E, R>(fx: Fx<A, E, R>): Effect.Effect<Fiber.RuntimeFiber<void, E>, never, R> =>
  Effect.forkDaemon(drain(fx))

/**
 * @since 1.20.0
 */
export const forkIn: {
  (scope: Scope.Scope): <A, E, R>(fx: Fx<A, E, R>) => Effect.Effect<Fiber.RuntimeFiber<void, E>, never, R>
  <A, E, R>(fx: Fx<A, E, R>, scope: Scope.Scope): Effect.Effect<Fiber.RuntimeFiber<void, E>, never, R>
} = dual(2, <A, E, R>(
  fx: Fx<A, E, R>,
  scope: Scope.Scope
): Effect.Effect<Fiber.RuntimeFiber<void, E>, never, R> => Effect.forkIn(drain(fx), scope))

/**
 * @since 1.20.0
 */
export const fromAsyncIterable: <A>(iterable: AsyncIterable<A>) => Fx<A> = core.fromAsyncIterable

/**
 * @since 1.20.0
 */
export const partitionMap: {
  <A, B, C>(
    f: (a: A) => Either.Either<C, B>
  ): <E, R>(fx: Fx<A, E, R>) => readonly [Fx<B, E, Scope.Scope | R>, Fx<C, E, Scope.Scope | R>]
  <A, E, R, B, C>(
    fx: Fx<A, E, R>,
    f: (a: A) => Either.Either<C, B>
  ): readonly [Fx<B, E, Scope.Scope | R>, Fx<C, E, Scope.Scope | R>]
} = dual(2, function partitionMap<A, E, R, B, C>(
  fx: Fx<A, E, R>,
  f: (a: A) => Either.Either<C, B>
): readonly [Fx<B, E, R | Scope.Scope>, Fx<C, E, R | Scope.Scope>] {
  const source = coreShare.multicast(core.map(fx, f))

  return [
    core.filterMap(source, Either.getLeft),
    core.filterMap(source, Either.getRight)
  ]
})

/**
 * @since 1.20.0
 */
export const gen: <Y extends Effect.EffectGen<any, any, any>, FX extends Fx<any, any, any>>(
  f: (_: Effect.Adapter) => Generator<Y, FX, any>
) => Fx<
  Fx.Success<FX>,
  Effect.Effect.Error<Y["value"]> | Fx.Error<FX>,
  Effect.Effect.Context<Y["value"]> | Fx.Context<FX>
> = core.gen

/**
 * @since 1.20.0
 */
export const genScoped: <Y extends Effect.EffectGen<any, any, any>, FX extends Fx<any, any, any>>(
  f: (_: Effect.Adapter) => Generator<Y, FX, any>
) => Fx<
  Fx.Success<FX>,
  Effect.Effect.Error<Y["value"]> | Fx.Error<FX>,
  Exclude<Effect.Effect.Context<Y["value"]> | Fx.Context<FX>, Scope.Scope>
> = core.genScoped

/**
 * @since 1.20.0
 */
export const findFirst: {
  <A, B extends A>(refinement: Predicate.Refinement<A, B>): <E, R>(fx: Fx<A, E, R>) => Effect.Effect<B, E, R>
  <A>(predicate: Predicate.Predicate<A>): <E, R>(fx: Fx<A, E, R>) => Effect.Effect<A, E, R>
  <A, E, R, B extends A>(fx: Fx<A, E, R>, refinement: Predicate.Refinement<A, B>): Effect.Effect<B, E, R>
  <A, E, R>(fx: Fx<A, E, R>, predicate: Predicate.Predicate<A>): Effect.Effect<A, E, R>
} = dual(2, core.findFirst)

/**
 * @since 1.20.0
 */
export const first: <A, E, R>(fx: Fx<A, E, R>) => Effect.Effect<A, E, R> = core.first

/**
 * @since 1.20.0
 */
export const mergeFirst: {
  <B, E2, R2>(that: Fx<B, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A | B, E | E2, R | R2>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, that: Fx<B, E2, R2>): Fx<A, E | E2, R | R2>
} = dual(2, core.mergeFirst)

/**
 * @since 1.20.0
 */
export const mergeRace: {
  <B, E2, R2>(that: Fx<B, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A | B, E | E2, R | R2>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, that: Fx<B, E2, R2>): Fx<A | B, E | E2, R | R2>
} = dual(2, core.mergeRace)

/**
 * @since 1.20.0
 */
export const raceAll: <const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
) => Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>> = core.raceAll

/**
 * @since 1.20.0
 */
export const race: {
  <B, E2, R2>(that: Fx<B, E2, R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A | B, E | E2, R | R2>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, that: Fx<B, E2, R2>): Fx<A | B, E | E2, R | R2>
} = dual(2, core.race)

/**
 * @since 1.20.0
 */
export const snapshot: {
  <B, E, R, A, C>(sampled: Fx<B, E, R>, g: (a: A, b: B) => C): <E2, R2>(fx: Fx<A, E2, R2>) => Fx<C, E | E2, R | R2>
  <A, E, R, B, E2, R2, C>(fx: Fx<A, E, R>, sampled: Fx<B, E2, R2>, f: (a: A, b: B) => C): Fx<C, E | E2, R | R2>
} = dual(3, core.snapshot)

/**
 * @since 1.20.0
 */
export const sample: {
  <B, E, R>(sampled: Fx<B, E, R>): <E2, R2, A>(fx: Fx<A, E2, R2>) => Fx<B, E | E2, R | R2>
  <A, E, R, B, E2, R2>(fx: Fx<A, E, R>, sampled: Fx<B, E2, R2>): Fx<B, E | E2, R | R2>
} = dual(2, core.sample)

/**
 * @since 1.20.0
 */
export const snapshotEffect: {
  <B, E2, R2, A, C, E3, R3>(sampled: Fx<B, E2, R2>, g: (a: A, b: B) => Effect.Effect<C, E3, R3>): <E, R>(
    fx: Fx<A, E, R>
  ) => Fx<C, E | E2 | E3, R | R2 | R3>
  <A, E, R, B, E2, R2, C, E3, R3>(
    fx: Fx<A, E, R>,
    sampled: Fx<B, E2, R2>,
    f: (a: A, b: B) => Effect.Effect<C, E3, R3>
  ): Fx<C, E | E2 | E3, R | R2 | R3>
} = dual(3, core.snapshotEffect)

const if_: {
  <B, E2, R2, C, E3, R3>(options: { readonly onTrue: Fx<B, E2, R2>; readonly onFalse: Fx<C, E3, R3> }): <E, R>(
    bool: Fx<boolean, E, R>
  ) => Fx<B | C, E | E2 | E3, R | R2 | R3 | Scope.Scope>
  <B, E, R, E2, R2, C, E3, R3>(
    bool: Fx<boolean, E, R>,
    options: { readonly onTrue: Fx<B, E2, R2>; readonly onFalse: Fx<C, E3, R3> }
  ): Fx<B | C, E | E2 | E3, R | R2 | R3 | Scope.Scope>
} = dual(2, core.if)

export {
  /**
   * @since 1.20.0
   */
  if_ as if
}

/**
 * @since 1.20.0
 */
export const when: {
  <B, C>(
    options: { readonly onTrue: B; readonly onFalse: C }
  ): <E, R>(bool: Fx<boolean, E, R>) => Fx<B | C, E, R | Scope.Scope>
  <B, E, R, C>(
    bool: Fx<boolean, E, R>,
    options: { readonly onTrue: B; readonly onFalse: C }
  ): Fx<B | C, E, R | Scope.Scope>
} = dual(2, core.when)

/**
 * @since 1.20.0
 */
export const withEmitter = <A, E = never, E2 = never, R = never>(
  f: (emitter: Emitter.Emitter<A, E>) => Effect.Effect<unknown, E2, R>
): Fx<A, E | E2, R | Scope.Scope> => core.make<A, E | E2, R | Scope.Scope>((sink) => Emitter.withEmitter(sink, f))

/**
 * Create an Fx which will wait a specified duration of time where no
 * events have occurred before emitting a value.
 * @since 1.18.0
 */
export const delay: {
  (delay: DurationInput): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R | Scope.Scope>
  <A, E, R>(fx: Fx<A, E, R>, delay: DurationInput): Fx<A, E, R | Scope.Scope>
} = dual(2, function<A, E, R>(fx: Fx<A, E, R>, delay: DurationInput): Fx<A, E, R | Scope.Scope> {
  return core.flatMap(fx, (a) => core.fromEffect(Effect.delay(Effect.succeed(a), delay)))
})

/**
 * @since 1.20.0
 */
export const ensuring: {
  <R2>(finalizer: Effect.Effect<unknown, never, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E, R | R2>
  <A, E, R, R2>(self: Fx<A, E, R>, finalizer: Effect.Effect<unknown, never, R2>): Fx<A, E, R | R2>
} = dual(2, function<A, E, R, R2>(
  self: Fx<A, E, R>,
  finalizer: Effect.Effect<unknown, never, R2>
): Fx<A, E, R | R2> {
  return core.middleware(self, (effect) => Effect.ensuring(effect, finalizer))
})

/**
 * @since 1.20.0
 */
export const flip = <A, E, R>(fx: Fx<A, E, R>): Fx<E, A, R> =>
  core.make<E, A, R>((sink) =>
    fx.run(Sink.make(
      (cause) =>
        Either.match(Cause.failureOrCause(cause), {
          onLeft: (e) => sink.onSuccess(e),
          onRight: (c) => sink.onFailure(c)
        }),
      (a) => sink.onFailure(Cause.fail(a))
    ))
  )

/**
 * @since 1.20.0
 */
export const fromNullable = <A>(value: A | null | undefined | void): Fx<NonNullable<A>> => {
  if (value === null || value === undefined) {
    return core.empty
  } else {
    return core.succeed(value)
  }
}

/**
 * @since 1.20.0
 */
export function fromDequeue<A>(dequeue: Queue.Dequeue<A>): Fx<A>
export function fromDequeue<I, A>(dequeue: Ctx.Dequeue<I, A>): Fx<A, never, I>
export function fromDequeue<I, A>(dequeue: Ctx.Dequeue<I, A> | Queue.Dequeue<A>): Fx<A, never, I> {
  return core.make((sink) =>
    Effect.gen(function*(_) {
      while (yield* _(dequeueIsActive(dequeue))) {
        yield* _(dequeue.take, Effect.matchCauseEffect(sink))
      }
    })
  )
}

/**
 * @internal
 */
export function dequeueIsActive<I, A>(
  dequeue: Ctx.Dequeue<I, A> | Queue.Dequeue<A>
): Effect.Effect<boolean, never, I> {
  if (Queue.DequeueTypeId in dequeue) {
    return Effect.sync(() => dequeue.isActive())
  } else {
    return dequeue.isActive
  }
}

/**
 * @since 1.20.0
 */
export function fromPubSub<A>(pubSub: PubSub.PubSub<A>): Fx<A, never, Scope.Scope>
export function fromPubSub<I, A>(pubSub: Ctx.PubSub<I, A>): Fx<A, never, I | Scope.Scope>
export function fromPubSub<I, A>(pubSub: Ctx.PubSub<I, A> | PubSub.PubSub<A>): Fx<A, never, I | Scope.Scope> {
  return core.acquireUseRelease(
    pubSub.subscribe,
    (q) => fromDequeue(q),
    (d) => d.shutdown
  )
}

/**
 * @since 1.20.0
 */
export abstract class FxEffectBase<A, E, R, B, E2, R2> extends protos.FxEffectBase<A, E, R, B, E2, R2> {
  private _fx: Fx<A, E, R> | undefined

  /**
   * @since 1.20.0
   */
  run<R3>(sink: Sink.Sink<A, E, R3>): Effect.Effect<void, never, R | R3> {
    return (this._fx ||= this.toFx()).run(sink)
  }

  /**
   * @since 1.20.0
   */
  abstract toFx(): Fx<A, E, R>

  /**
   * @since 1.20.0
   */
  abstract toEffect(): Effect.Effect<B, E2, R2>
}

/**
 * @since 2.0.0
 */
export function promise<A>(f: (signal: AbortSignal) => Promise<A>) {
  return fromEffect(Effect.promise(f))
}

/**
 * @since 2.0.0
 */
export function promiseFx<A, E = never, R = never>(f: (signal: AbortSignal) => Promise<Fx<A, E, R>>) {
  return fromFxEffect(Effect.promise(f))
}
