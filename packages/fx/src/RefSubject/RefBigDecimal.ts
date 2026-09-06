/**
 * Extensions to RefSubject for working with BigDecimal values
 * @since 1.18.0
 */

import * as BigDecimal from "effect/BigDecimal";
import type * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

/**
 * A RefBigDecimal is a RefSubject specialized over a BigDecimal value.
 * @remarks
 * ## Why
 *
 * Defines big decimal state with the same current-read, pushed-update, and synchronized-write
 * contract as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefBigDecimal is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefBigDecimal<in out E = never, out R = never> extends RefSubject.RefSubject<
  BigDecimal.BigDecimal,
  E,
  R
> {}

/**
 * Creates a new `RefBigDecimal` from a BigDecimal, `Effect`, or `Fx`.
 *
 * @remarks
 * ## Why
 *
 * Creates big decimal state with equality suited to that Effect data type, so unchanged values do
 * not produce redundant pushed updates.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope. It owns initializer acquisition, live source subscriptions,
 * and cleanup; source failures and services stay on reads and pushes.
 *
 * @example
 * ```ts
 * import { Effect, BigDecimal } from "effect"
 * import * as RefBigDecimal from "@typed/fx/RefBigDecimal"
 *
 * const program = Effect.gen(function* () {
 *   const value = yield* RefBigDecimal.make(BigDecimal.fromStringUnsafe("123.45"))
 *   const current = yield* value
 *   console.log(current) // BigDecimal(123.45)
 * })
 * ```
 *
 * @since 1.18.0
 * @category Constructors
 */
export function make<E = never, R = never>(
  initial:
    | BigDecimal.BigDecimal
    | Effect.Effect<BigDecimal.BigDecimal, E, R>
    | Fx.Fx<BigDecimal.BigDecimal, E, R>,
): Effect.Effect<RefBigDecimal<E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq: BigDecimal.Equivalence });
}

// ========================================
// Computed
// ========================================

/**
 * Add a BigDecimal to the current state of a RefBigDecimal.
 * @remarks
 * ## Why
 *
 * Add a BigDecimal to the current state of a RefBigDecimal. The operation remains attached to the
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
    that: BigDecimal.BigDecimal,
  ): <E, R>(ref: RefBigDecimal<E, R>) => RefSubject.Computed<BigDecimal.BigDecimal, E, R>;
  <E, R>(
    ref: RefBigDecimal<E, R>,
    that: BigDecimal.BigDecimal,
  ): RefSubject.Computed<BigDecimal.BigDecimal, E, R>;
} = dual(2, function add<E, R>(ref: RefBigDecimal<E, R>, that: BigDecimal.BigDecimal) {
  return RefSubject.map(ref, (self) => BigDecimal.sum(self, that));
});

/**
 * Subtract a BigDecimal from the current state of a RefBigDecimal.
 * @remarks
 * ## Why
 *
 * Subtract a BigDecimal from the current state of a RefBigDecimal. The operation remains attached
 * to the RefSubject's versioned state boundary.
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
    that: BigDecimal.BigDecimal,
  ): <E, R>(ref: RefBigDecimal<E, R>) => RefSubject.Computed<BigDecimal.BigDecimal, E, R>;
  <E, R>(
    ref: RefBigDecimal<E, R>,
    that: BigDecimal.BigDecimal,
  ): RefSubject.Computed<BigDecimal.BigDecimal, E, R>;
} = dual(2, function subtract<E, R>(ref: RefBigDecimal<E, R>, that: BigDecimal.BigDecimal) {
  return RefSubject.map(ref, (self) => BigDecimal.subtract(self, that));
});

/**
 * Multiply the current state of a RefBigDecimal by a BigDecimal.
 * @remarks
 * ## Why
 *
 * Multiply the current state of a RefBigDecimal by a BigDecimal. The operation remains attached to
 * the RefSubject's versioned state boundary.
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
  (
    that: BigDecimal.BigDecimal,
  ): <E, R>(ref: RefBigDecimal<E, R>) => RefSubject.Computed<BigDecimal.BigDecimal, E, R>;
  <E, R>(
    ref: RefBigDecimal<E, R>,
    that: BigDecimal.BigDecimal,
  ): RefSubject.Computed<BigDecimal.BigDecimal, E, R>;
} = dual(2, function multiply<E, R>(ref: RefBigDecimal<E, R>, that: BigDecimal.BigDecimal) {
  return RefSubject.map(ref, (self) => BigDecimal.multiply(self, that));
});

/**
 * Divide the current state of a RefBigDecimal by a BigDecimal.
 * @remarks
 * ## Why
 *
 * Divide the current state of a RefBigDecimal by a BigDecimal. The operation remains attached to
 * the RefSubject's versioned state boundary.
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
    that: BigDecimal.BigDecimal,
  ): <E, R>(
    ref: RefBigDecimal<E, R>,
  ) => RefSubject.Computed<BigDecimal.BigDecimal | undefined, E, R>;
  <E, R>(
    ref: RefBigDecimal<E, R>,
    that: BigDecimal.BigDecimal,
  ): RefSubject.Computed<BigDecimal.BigDecimal | undefined, E, R>;
} = dual(2, function divide<E, R>(ref: RefBigDecimal<E, R>, that: BigDecimal.BigDecimal) {
  return RefSubject.map(ref, (self) => BigDecimal.divide(self, that));
});

/**
 * Get the absolute value of the current state of a RefBigDecimal.
 * @remarks
 * ## Why
 *
 * Get the absolute value of the current state of a RefBigDecimal. The operation remains attached
 * to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The abs view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Arithmetic queries
 */
export const abs = <E, R>(
  ref: RefBigDecimal<E, R>,
): RefSubject.Computed<BigDecimal.BigDecimal, E, R> => RefSubject.map(ref, BigDecimal.abs);

/**
 * Negate the current state of a RefBigDecimal.
 * @remarks
 * ## Why
 *
 * Negate the current state of a RefBigDecimal. The operation remains attached to the RefSubject's
 * versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The negate view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Arithmetic queries
 */
export const negate = <E, R>(
  ref: RefBigDecimal<E, R>,
): RefSubject.Computed<BigDecimal.BigDecimal, E, R> => RefSubject.map(ref, BigDecimal.negate);

/**
 * Round the current state of a RefBigDecimal.
 * @remarks
 * ## Why
 *
 * Round the current state of a RefBigDecimal. The operation remains attached to the RefSubject's
 * versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The round view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Arithmetic queries
 */
export const round: {
  (options?: {
    scale?: number;
    mode?: BigDecimal.RoundingMode;
  }): <E, R>(ref: RefBigDecimal<E, R>) => RefSubject.Computed<BigDecimal.BigDecimal, E, R>;
  <E, R>(
    ref: RefBigDecimal<E, R>,
    options?: { scale?: number; mode?: BigDecimal.RoundingMode },
  ): RefSubject.Computed<BigDecimal.BigDecimal, E, R>;
} = dual(2, function round<
  E,
  R,
>(ref: RefBigDecimal<E, R>, options?: { scale?: number; mode?: BigDecimal.RoundingMode }) {
  return RefSubject.map(ref, (self) => BigDecimal.round(self, options));
});

/**
 * Truncate the current state of a RefBigDecimal.
 * @remarks
 * ## Why
 *
 * Truncate the current state of a RefBigDecimal. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The truncate view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Arithmetic queries
 */
export const truncate: {
  (
    scale?: number,
  ): <E, R>(ref: RefBigDecimal<E, R>) => RefSubject.Computed<BigDecimal.BigDecimal, E, R>;
  <E, R>(
    ref: RefBigDecimal<E, R>,
    scale?: number,
  ): RefSubject.Computed<BigDecimal.BigDecimal, E, R>;
} = dual(2, function truncate<E, R>(ref: RefBigDecimal<E, R>, scale?: number) {
  return RefSubject.map(ref, (self) => BigDecimal.truncate(self, scale));
});

/**
 * Calculate the ceiling of the current state of a RefBigDecimal.
 * @remarks
 * ## Why
 *
 * Calculate the ceiling of the current state of a RefBigDecimal. The operation remains attached to
 * the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The ceil view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Arithmetic queries
 */
export const ceil: {
  (
    scale?: number,
  ): <E, R>(ref: RefBigDecimal<E, R>) => RefSubject.Computed<BigDecimal.BigDecimal, E, R>;
  <E, R>(
    ref: RefBigDecimal<E, R>,
    scale?: number,
  ): RefSubject.Computed<BigDecimal.BigDecimal, E, R>;
} = dual(2, function ceil<E, R>(ref: RefBigDecimal<E, R>, scale?: number) {
  return RefSubject.map(ref, (self) => BigDecimal.ceil(self, scale));
});

/**
 * Calculate the floor of the current state of a RefBigDecimal.
 * @remarks
 * ## Why
 *
 * Calculate the floor of the current state of a RefBigDecimal. The operation remains attached to
 * the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The floor view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Arithmetic queries
 */
export const floor: {
  (
    scale?: number,
  ): <E, R>(ref: RefBigDecimal<E, R>) => RefSubject.Computed<BigDecimal.BigDecimal, E, R>;
  <E, R>(
    ref: RefBigDecimal<E, R>,
    scale?: number,
  ): RefSubject.Computed<BigDecimal.BigDecimal, E, R>;
} = dual(2, function floor<E, R>(ref: RefBigDecimal<E, R>, scale?: number) {
  return RefSubject.map(ref, (self) => BigDecimal.floor(self, scale));
});

/**
 * Check if the current state of a RefBigDecimal is zero.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefBigDecimal is zero. The operation remains attached to the
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
export const isZero = <E, R>(ref: RefBigDecimal<E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, BigDecimal.isZero);

/**
 * Check if the current state of a RefBigDecimal is negative.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefBigDecimal is negative. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The is negative view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isNegative = <E, R>(ref: RefBigDecimal<E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, BigDecimal.isNegative);

/**
 * Check if the current state of a RefBigDecimal is positive.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefBigDecimal is positive. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The is positive view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isPositive = <E, R>(ref: RefBigDecimal<E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, BigDecimal.isPositive);

/**
 * Check if the current state of a RefBigDecimal is an integer.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefBigDecimal is an integer. The operation remains attached to
 * the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The is integer view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isInteger = <E, R>(ref: RefBigDecimal<E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, BigDecimal.isInteger);

/**
 * Get the sign of the current state of a RefBigDecimal.
 * @remarks
 * ## Why
 *
 * Get the sign of the current state of a RefBigDecimal. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The sign view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const sign = <E, R>(ref: RefBigDecimal<E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, BigDecimal.sign);

/**
 * Check if the current state of a RefBigDecimal is less than a BigDecimal.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefBigDecimal is less than a BigDecimal. The operation remains
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
  (
    that: BigDecimal.BigDecimal,
  ): <E, R>(ref: RefBigDecimal<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefBigDecimal<E, R>, that: BigDecimal.BigDecimal): RefSubject.Computed<boolean, E, R>;
} = dual(2, function isLessThan<E, R>(ref: RefBigDecimal<E, R>, that: BigDecimal.BigDecimal) {
  return RefSubject.map(ref, (self) => BigDecimal.isLessThan(self, that));
});

/**
 * Check if the current state of a RefBigDecimal is greater than a BigDecimal.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefBigDecimal is greater than a BigDecimal. The operation
 * remains attached to the RefSubject's versioned state boundary.
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
  (
    that: BigDecimal.BigDecimal,
  ): <E, R>(ref: RefBigDecimal<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefBigDecimal<E, R>, that: BigDecimal.BigDecimal): RefSubject.Computed<boolean, E, R>;
} = dual(2, function isGreaterThan<E, R>(ref: RefBigDecimal<E, R>, that: BigDecimal.BigDecimal) {
  return RefSubject.map(ref, (self) => BigDecimal.isGreaterThan(self, that));
});

/**
 * Check if the current state of a RefBigDecimal equals a BigDecimal.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefBigDecimal equals a BigDecimal. The operation remains
 * attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The equals view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Arithmetic queries
 */
export const equals: {
  (
    that: BigDecimal.BigDecimal,
  ): <E, R>(ref: RefBigDecimal<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefBigDecimal<E, R>, that: BigDecimal.BigDecimal): RefSubject.Computed<boolean, E, R>;
} = dual(2, function equals<E, R>(ref: RefBigDecimal<E, R>, that: BigDecimal.BigDecimal) {
  return RefSubject.map(ref, (self) => BigDecimal.equals(self, that));
});
