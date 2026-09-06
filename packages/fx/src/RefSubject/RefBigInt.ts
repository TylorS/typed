/**
 * Extensions to RefSubject for working with BigInt values
 * @since 1.18.0
 */

import * as BigInt_ from "effect/BigInt";
import type * as Effect from "effect/Effect";
import * as Equivalence_ from "effect/Equivalence";
import type { Equivalence } from "effect/Equivalence";
import { dual } from "effect/Function";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

/**
 * A RefBigInt is a RefSubject specialized over a BigInt value.
 * @remarks
 * ## Why
 *
 * Defines big int state with the same current-read, pushed-update, and synchronized-write contract
 * as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefBigInt is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefBigInt<in out E = never, out R = never> extends RefSubject.RefSubject<
  bigint,
  E,
  R
> {}

/**
 * Creates a new `RefBigInt` from a BigInt, `Effect`, or `Fx`.
 *
 * @remarks
 * ## Why
 *
 * Creates big int state with equality suited to that Effect data type, so unchanged values do not
 * produce redundant pushed updates.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope. It owns initializer acquisition, live source subscriptions,
 * and cleanup; source failures and services stay on reads and pushes.
 *
 * @example
 * ```ts
 * import { Effect, BigInt } from "effect"
 * import * as RefBigInt from "@typed/fx/RefBigInt"
 *
 * const program = Effect.gen(function* () {
 *   const value = yield* RefBigInt.make(BigInt.BigInt(123))
 *   const current = yield* value
 *   console.log(current) // 123n
 * })
 * ```
 *
 * @since 1.18.0
 * @category Constructors
 */
export function make<E = never, R = never>(
  initial: bigint | Effect.Effect<bigint, E, R> | Fx.Fx<bigint, E, R>,
  eq: Equivalence<bigint> = Equivalence_.strictEqual(),
): Effect.Effect<RefBigInt<E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq });
}

// ========================================
// Computed
// ========================================

/**
 * Add a BigInt to the current state of a RefBigInt.
 * @remarks
 * ## Why
 *
 * Add a BigInt to the current state of a RefBigInt. The operation remains attached to the
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
  (that: bigint): <E, R>(ref: RefBigInt<E, R>) => RefSubject.Computed<bigint, E, R>;
  <E, R>(ref: RefBigInt<E, R>, that: bigint): RefSubject.Computed<bigint, E, R>;
} = dual(2, function add<E, R>(ref: RefBigInt<E, R>, that: bigint) {
  return RefSubject.map(ref, (self) => BigInt_.sum(self, that));
});

/**
 * Subtract a BigInt from the current state of a RefBigInt.
 * @remarks
 * ## Why
 *
 * Subtract a BigInt from the current state of a RefBigInt. The operation remains attached to the
 * RefSubject's versioned state boundary.
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
  (that: bigint): <E, R>(ref: RefBigInt<E, R>) => RefSubject.Computed<bigint, E, R>;
  <E, R>(ref: RefBigInt<E, R>, that: bigint): RefSubject.Computed<bigint, E, R>;
} = dual(2, function subtract<E, R>(ref: RefBigInt<E, R>, that: bigint) {
  return RefSubject.map(ref, (self) => BigInt_.subtract(self, that));
});

/**
 * Multiply the current state of a RefBigInt by a BigInt.
 * @remarks
 * ## Why
 *
 * Multiply the current state of a RefBigInt by a BigInt. The operation remains attached to the
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
  (that: bigint): <E, R>(ref: RefBigInt<E, R>) => RefSubject.Computed<bigint, E, R>;
  <E, R>(ref: RefBigInt<E, R>, that: bigint): RefSubject.Computed<bigint, E, R>;
} = dual(2, function multiply<E, R>(ref: RefBigInt<E, R>, that: bigint) {
  return RefSubject.map(ref, (self) => BigInt_.multiply(self, that));
});

/**
 * Divide the current state of a RefBigInt by a BigInt.
 * @remarks
 * ## Why
 *
 * Divide the current state of a RefBigInt by a BigInt. The operation remains attached to the
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
  (that: bigint): <E, R>(ref: RefBigInt<E, R>) => RefSubject.Computed<bigint | undefined, E, R>;
  <E, R>(ref: RefBigInt<E, R>, that: bigint): RefSubject.Computed<bigint | undefined, E, R>;
} = dual(2, function divide<E, R>(ref: RefBigInt<E, R>, that: bigint) {
  return RefSubject.map(ref, (self) => BigInt_.divide(self, that));
});

/**
 * Get the remainder of dividing the current state of a RefBigInt by a BigInt.
 * @remarks
 * ## Why
 *
 * Get the remainder of dividing the current state of a RefBigInt by a BigInt. The operation
 * remains attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The mod view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Arithmetic queries
 */
export const mod: {
  (that: bigint): <E, R>(ref: RefBigInt<E, R>) => RefSubject.Computed<bigint, E, R>;
  <E, R>(ref: RefBigInt<E, R>, that: bigint): RefSubject.Computed<bigint, E, R>;
} = dual(2, function mod<E, R>(ref: RefBigInt<E, R>, that: bigint) {
  return RefSubject.map(ref, (self) => BigInt_.remainder(self, that));
});

/**
 * Get the absolute value of the current state of a RefBigInt.
 * @remarks
 * ## Why
 *
 * Get the absolute value of the current state of a RefBigInt. The operation remains attached to
 * the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The abs view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Arithmetic queries
 */
export const abs = <E, R>(ref: RefBigInt<E, R>): RefSubject.Computed<bigint, E, R> =>
  RefSubject.map(ref, BigInt_.abs);

/**
 * Negate the current state of a RefBigInt.
 * @remarks
 * ## Why
 *
 * Negate the current state of a RefBigInt. The operation remains attached to the RefSubject's
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
export const negate = <E, R>(ref: RefBigInt<E, R>): RefSubject.Computed<bigint, E, R> =>
  RefSubject.map(ref, (self) => -self);

/**
 * Check if the current state of a RefBigInt is zero.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefBigInt is zero. The operation remains attached to the
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
export const isZero = <E, R>(ref: RefBigInt<E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, (self) => self === BigInt_.BigInt(0));

/**
 * Check if the current state of a RefBigInt is negative.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefBigInt is negative. The operation remains attached to the
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
export const isNegative = <E, R>(ref: RefBigInt<E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, (self) => self < BigInt_.BigInt(0));

/**
 * Check if the current state of a RefBigInt is positive.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefBigInt is positive. The operation remains attached to the
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
export const isPositive = <E, R>(ref: RefBigInt<E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, (self) => self > BigInt_.BigInt(0));

/**
 * Check if the current state of a RefBigInt is less than a BigInt.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefBigInt is less than a BigInt. The operation remains attached
 * to the RefSubject's versioned state boundary.
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
  (that: bigint): <E, R>(ref: RefBigInt<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefBigInt<E, R>, that: bigint): RefSubject.Computed<boolean, E, R>;
} = dual(2, function isLessThan<E, R>(ref: RefBigInt<E, R>, that: bigint) {
  return RefSubject.map(ref, (self) => BigInt_.isLessThan(self, that));
});

/**
 * Check if the current state of a RefBigInt is greater than a BigInt.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefBigInt is greater than a BigInt. The operation remains
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
  (that: bigint): <E, R>(ref: RefBigInt<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefBigInt<E, R>, that: bigint): RefSubject.Computed<boolean, E, R>;
} = dual(2, function isGreaterThan<E, R>(ref: RefBigInt<E, R>, that: bigint) {
  return RefSubject.map(ref, (self) => BigInt_.isGreaterThan(self, that));
});

/**
 * Check if the current state of a RefBigInt equals a BigInt.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefBigInt equals a BigInt. The operation remains attached to the
 * RefSubject's versioned state boundary.
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
  (that: bigint): <E, R>(ref: RefBigInt<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefBigInt<E, R>, that: bigint): RefSubject.Computed<boolean, E, R>;
} = dual(2, function equals<E, R>(ref: RefBigInt<E, R>, that: bigint) {
  return RefSubject.map(ref, (self) => self === that);
});
