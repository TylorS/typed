/**
 * Extensions to RefSubject for working with boolean values
 * @since 1.18.0
 */

import * as Boolean_ from "effect/Boolean";
import type * as Effect from "effect/Effect";
import * as Equivalence_ from "effect/Equivalence";
import type { Equivalence } from "effect/Equivalence";
import { dual } from "effect/Function";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

/**
 * A RefBoolean is a RefSubject specialized over a boolean value.
 * @remarks
 * ## Why
 *
 * Defines boolean state with the same current-read, pushed-update, and synchronized-write contract
 * as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefBoolean is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefBoolean<in out E = never, out R = never> extends RefSubject.RefSubject<
  boolean,
  E,
  R
> {}

/**
 * Creates a new `RefBoolean` from a boolean, `Effect`, or `Fx`.
 *
 * @remarks
 * ## Why
 *
 * Creates boolean state with equality suited to that Effect data type, so unchanged values do not
 * produce redundant pushed updates.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope. It owns initializer acquisition, live source subscriptions,
 * and cleanup; source failures and services stay on reads and pushes.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefBoolean from "@typed/fx/RefBoolean"
 *
 * const program = Effect.gen(function* () {
 *   const value = yield* RefBoolean.make(true)
 *   const current = yield* value
 *   console.log(current) // true
 * })
 * ```
 *
 * @since 1.18.0
 * @category Constructors
 */
export function make<E = never, R = never>(
  initial: boolean | Effect.Effect<boolean, E, R> | Fx.Fx<boolean, E, R>,
  eq: Equivalence<boolean> = Equivalence_.strictEqual(),
): Effect.Effect<RefBoolean<E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq });
}

/**
 * Toggle the current state of a RefBoolean.
 * @remarks
 * ## Why
 *
 * Keeps toggle atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running toggle performs one serialized boolean transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const toggle = <E, R>(ref: RefBoolean<E, R>): Effect.Effect<boolean, E, R> =>
  RefSubject.update(ref, Boolean_.not);

/**
 * Set the current state of a RefBoolean to true.
 * @remarks
 * ## Why
 *
 * Keeps set true atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running set true performs one serialized boolean transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const setTrue = <E, R>(ref: RefBoolean<E, R>): Effect.Effect<boolean, E, R> =>
  RefSubject.set(ref, true);

/**
 * Set the current state of a RefBoolean to false.
 * @remarks
 * ## Why
 *
 * Keeps set false atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running set false performs one serialized boolean transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const setFalse = <E, R>(ref: RefBoolean<E, R>): Effect.Effect<boolean, E, R> =>
  RefSubject.set(ref, false);

// ========================================
// Computed
// ========================================

/**
 * Apply AND operation with a boolean to the current state of a RefBoolean.
 * @remarks
 * ## Why
 *
 * Apply AND operation with a boolean to the current state of a RefBoolean. The operation remains
 * attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The and view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const and: {
  (that: boolean): <E, R>(ref: RefBoolean<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefBoolean<E, R>, that: boolean): RefSubject.Computed<boolean, E, R>;
} = dual(2, function and<E, R>(ref: RefBoolean<E, R>, that: boolean) {
  return RefSubject.map(ref, (self) => Boolean_.and(self, that));
});

/**
 * Apply OR operation with a boolean to the current state of a RefBoolean.
 * @remarks
 * ## Why
 *
 * Apply OR operation with a boolean to the current state of a RefBoolean. The operation remains
 * attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The or view retains no independent state. An Effect read samples the source once; Fx observation
 * follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const or: {
  (that: boolean): <E, R>(ref: RefBoolean<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefBoolean<E, R>, that: boolean): RefSubject.Computed<boolean, E, R>;
} = dual(2, function or<E, R>(ref: RefBoolean<E, R>, that: boolean) {
  return RefSubject.map(ref, (self) => Boolean_.or(self, that));
});

/**
 * Apply NOT operation to the current state of a RefBoolean.
 * @remarks
 * ## Why
 *
 * Apply NOT operation to the current state of a RefBoolean. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The not view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const not = <E, R>(ref: RefBoolean<E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, Boolean_.not);

/**
 * Apply XOR operation with a boolean to the current state of a RefBoolean.
 * @remarks
 * ## Why
 *
 * Apply XOR operation with a boolean to the current state of a RefBoolean. The operation remains
 * attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The xor view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const xor: {
  (that: boolean): <E, R>(ref: RefBoolean<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefBoolean<E, R>, that: boolean): RefSubject.Computed<boolean, E, R>;
} = dual(2, function xor<E, R>(ref: RefBoolean<E, R>, that: boolean) {
  return RefSubject.map(ref, (self) => Boolean_.xor(self, that));
});

/**
 * Apply NAND operation with a boolean to the current state of a RefBoolean.
 * @remarks
 * ## Why
 *
 * Apply NAND operation with a boolean to the current state of a RefBoolean. The operation remains
 * attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The nand view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const nand: {
  (that: boolean): <E, R>(ref: RefBoolean<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefBoolean<E, R>, that: boolean): RefSubject.Computed<boolean, E, R>;
} = dual(2, function nand<E, R>(ref: RefBoolean<E, R>, that: boolean) {
  return RefSubject.map(ref, (self) => Boolean_.nand(self, that));
});

/**
 * Apply NOR operation with a boolean to the current state of a RefBoolean.
 * @remarks
 * ## Why
 *
 * Apply NOR operation with a boolean to the current state of a RefBoolean. The operation remains
 * attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The nor view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const nor: {
  (that: boolean): <E, R>(ref: RefBoolean<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefBoolean<E, R>, that: boolean): RefSubject.Computed<boolean, E, R>;
} = dual(2, function nor<E, R>(ref: RefBoolean<E, R>, that: boolean) {
  return RefSubject.map(ref, (self) => Boolean_.nor(self, that));
});

/**
 * Apply EQV (XNOR) operation with a boolean to the current state of a RefBoolean.
 * @remarks
 * ## Why
 *
 * Apply EQV (XNOR) operation with a boolean to the current state of a RefBoolean. The operation
 * remains attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The eqv view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const eqv: {
  (that: boolean): <E, R>(ref: RefBoolean<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefBoolean<E, R>, that: boolean): RefSubject.Computed<boolean, E, R>;
} = dual(2, function eqv<E, R>(ref: RefBoolean<E, R>, that: boolean) {
  return RefSubject.map(ref, (self) => Boolean_.eqv(self, that));
});

/**
 * Apply implication operation with a boolean to the current state of a RefBoolean.
 * @remarks
 * ## Why
 *
 * Apply implication operation with a boolean to the current state of a RefBoolean. The operation
 * remains attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The implies view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const implies: {
  (that: boolean): <E, R>(ref: RefBoolean<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefBoolean<E, R>, that: boolean): RefSubject.Computed<boolean, E, R>;
} = dual(2, function implies<E, R>(ref: RefBoolean<E, R>, that: boolean) {
  return RefSubject.map(ref, (self) => Boolean_.implies(self, that));
});

/**
 * Check if the current state of a RefBoolean is true.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefBoolean is true. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The is true view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isTrue = <E, R>(ref: RefBoolean<E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, (self) => self === true);

/**
 * Check if the current state of a RefBoolean is false.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefBoolean is false. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The is false view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isFalse = <E, R>(ref: RefBoolean<E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, (self) => self === false);
