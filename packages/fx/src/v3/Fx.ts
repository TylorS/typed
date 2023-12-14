import type { Effect, Fiber, Pipeable } from "effect"
import type * as Types from "effect/Types"
import * as strategies from "../internal/strategies.js"
import type { TypeId } from "../TypeId"
import type { Sink } from "./Sink"

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
