/**
 * Extensions to RefSubject for working with Duration values
 * @since 1.18.0
 */

import * as Duration from "effect/Duration";
import type * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

/**
 * A RefDuration is a RefSubject specialized over a Duration value.
 * @remarks
 * ## Why
 *
 * Defines duration state with the same current-read, pushed-update, and synchronized-write
 * contract as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefDuration is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefDuration<in out E = never, out R = never> extends RefSubject.RefSubject<
  Duration.Duration,
  E,
  R
> {}

/**
 * Creates a new `RefDuration` from a Duration, `Effect`, or `Fx`.
 *
 * @remarks
 * ## Why
 *
 * Creates duration state with equality suited to that Effect data type, so unchanged values do not
 * produce redundant pushed updates.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope. It owns initializer acquisition, live source subscriptions,
 * and cleanup; source failures and services stay on reads and pushes.
 *
 * @example
 * ```ts
 * import { Effect, Duration } from "effect"
 * import * as RefDuration from "@typed/fx/RefDuration"
 *
 * const program = Effect.gen(function* () {
 *   const value = yield* RefDuration.make(Duration.seconds(5))
 *   const current = yield* value
 *   console.log(current) // Duration(...)
 * })
 * ```
 *
 * @since 1.18.0
 * @category Constructors
 */
export function make<E = never, R = never>(
  initial:
    | Duration.Duration
    | Effect.Effect<Duration.Duration, E, R>
    | Fx.Fx<Duration.Duration, E, R>,
): Effect.Effect<RefDuration<E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq: Duration.Equivalence });
}

// ========================================
// Computed
// ========================================

/**
 * Add a Duration to the current state of a RefDuration.
 * @remarks
 * ## Why
 *
 * Add a Duration to the current state of a RefDuration. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The add view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Arithmetic queries
 */
export const add: {
  (
    that: Duration.Duration,
  ): <E, R>(ref: RefDuration<E, R>) => RefSubject.Computed<Duration.Duration, E, R>;
  <E, R>(
    ref: RefDuration<E, R>,
    that: Duration.Duration,
  ): RefSubject.Computed<Duration.Duration, E, R>;
} = dual(2, function add<E, R>(ref: RefDuration<E, R>, that: Duration.Duration) {
  return RefSubject.map(ref, (self) => Duration.sum(self, that));
});

/**
 * Subtract a Duration from the current state of a RefDuration.
 * @remarks
 * ## Why
 *
 * Subtract a Duration from the current state of a RefDuration. The operation remains attached to
 * the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The subtract view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Arithmetic queries
 */
export const subtract: {
  (
    that: Duration.Duration,
  ): <E, R>(ref: RefDuration<E, R>) => RefSubject.Computed<Duration.Duration, E, R>;
  <E, R>(
    ref: RefDuration<E, R>,
    that: Duration.Duration,
  ): RefSubject.Computed<Duration.Duration, E, R>;
} = dual(2, function subtract<E, R>(ref: RefDuration<E, R>, that: Duration.Duration) {
  return RefSubject.map(ref, (self) => Duration.subtract(self, that));
});

/**
 * Multiply the current state of a RefDuration by a number.
 * @remarks
 * ## Why
 *
 * Multiply the current state of a RefDuration by a number. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The multiply view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Arithmetic queries
 */
export const multiply: {
  (that: number): <E, R>(ref: RefDuration<E, R>) => RefSubject.Computed<Duration.Duration, E, R>;
  <E, R>(ref: RefDuration<E, R>, that: number): RefSubject.Computed<Duration.Duration, E, R>;
} = dual(2, function multiply<E, R>(ref: RefDuration<E, R>, that: number) {
  return RefSubject.map(ref, (self) => Duration.times(self, that));
});

/**
 * Divide the current state of a RefDuration by a number.
 * @remarks
 * ## Why
 *
 * Divide the current state of a RefDuration by a number. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The divide view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Arithmetic queries
 */
export const divide: {
  (
    that: number,
  ): <E, R>(ref: RefDuration<E, R>) => RefSubject.Computed<Duration.Duration | undefined, E, R>;
  <E, R>(
    ref: RefDuration<E, R>,
    that: number,
  ): RefSubject.Computed<Duration.Duration | undefined, E, R>;
} = dual(2, function divide<E, R>(ref: RefDuration<E, R>, that: number) {
  return RefSubject.map(ref, (self) => Duration.divide(self, that));
});

/**
 * Check if the current state of a RefDuration is zero.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefDuration is zero. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The is zero view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isZero = <E, R>(ref: RefDuration<E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, Duration.isZero);

/**
 * Check if the current state of a RefDuration is less than a Duration.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefDuration is less than a Duration. The operation remains
 * attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The is less than view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isLessThan: {
  (that: Duration.Duration): <E, R>(ref: RefDuration<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefDuration<E, R>, that: Duration.Duration): RefSubject.Computed<boolean, E, R>;
} = dual(2, function isLessThan<E, R>(ref: RefDuration<E, R>, that: Duration.Duration) {
  return RefSubject.map(ref, (self) => Duration.isLessThan(self, that));
});

/**
 * Check if the current state of a RefDuration is greater than a Duration.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefDuration is greater than a Duration. The operation remains
 * attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The is greater than view retains no independent state. An Effect read samples the source once;
 * Fx observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isGreaterThan: {
  (that: Duration.Duration): <E, R>(ref: RefDuration<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefDuration<E, R>, that: Duration.Duration): RefSubject.Computed<boolean, E, R>;
} = dual(2, function isGreaterThan<E, R>(ref: RefDuration<E, R>, that: Duration.Duration) {
  return RefSubject.map(ref, (self) => Duration.isGreaterThan(self, that));
});

/**
 * Get the milliseconds value of the current state of a RefDuration.
 * @remarks
 * ## Why
 *
 * Get the milliseconds value of the current state of a RefDuration. The operation remains attached
 * to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The millis view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Unit conversions
 */
export const millis = <E, R>(ref: RefDuration<E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, Duration.toMillis);

/**
 * Get the seconds value of the current state of a RefDuration.
 * @remarks
 * ## Why
 *
 * Get the seconds value of the current state of a RefDuration. The operation remains attached to
 * the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The seconds view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Unit conversions
 */
export const seconds = <E, R>(ref: RefDuration<E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, Duration.toSeconds);

/**
 * Get the minutes value of the current state of a RefDuration.
 * @remarks
 * ## Why
 *
 * Get the minutes value of the current state of a RefDuration. The operation remains attached to
 * the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The minutes view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Unit conversions
 */
export const minutes = <E, R>(ref: RefDuration<E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, Duration.toMinutes);

/**
 * Get the hours value of the current state of a RefDuration.
 * @remarks
 * ## Why
 *
 * Get the hours value of the current state of a RefDuration. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The hours view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Unit conversions
 */
export const hours = <E, R>(ref: RefDuration<E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, Duration.toHours);

/**
 * Get the days value of the current state of a RefDuration.
 * @remarks
 * ## Why
 *
 * Get the days value of the current state of a RefDuration. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The days view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Unit conversions
 */
export const days = <E, R>(ref: RefDuration<E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, Duration.toDays);
