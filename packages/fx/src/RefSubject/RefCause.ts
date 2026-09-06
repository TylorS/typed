/**
 * Extensions to RefSubject for working with Cause values
 * @since 1.18.0
 */

import * as Cause from "effect/Cause";
import type * as Effect from "effect/Effect";
import { equals } from "effect/Equal";
import * as Equivalence_ from "effect/Equivalence";
import type { Equivalence } from "effect/Equivalence";
import { dual } from "effect/Function";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

/**
 * A RefCause is a RefSubject specialized over a Cause value.
 * @remarks
 * ## Why
 *
 * Defines cause state with the same current-read, pushed-update, and synchronized-write contract
 * as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefCause is a contract and performs no acquisition. Implementations retain the errors, services,
 * interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefCause<
  in out E,
  in out Err = never,
  out R = never,
> extends RefSubject.RefSubject<Cause.Cause<E>, Err, R> {}

/**
 * Creates a new `RefCause` from a Cause, `Effect`, or `Fx`.
 *
 * @remarks
 * ## Why
 *
 * Creates cause state with equality suited to that Effect data type, so unchanged values do not
 * produce redundant pushed updates.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope. It owns initializer acquisition, live source subscriptions,
 * and cleanup; source failures and services stay on reads and pushes.
 *
 * @example
 * ```ts
 * import { Effect, Cause } from "effect"
 * import * as RefCause from "@typed/fx/RefCause"
 *
 * const program = Effect.gen(function* () {
 *   const value = yield* RefCause.make(Cause.fail("error"))
 *   const current = yield* value
 *   console.log(current) // Cause(...)
 * })
 * ```
 *
 * @since 1.18.0
 * @category Constructors
 */
export function make<E = never, Err = never, R = never>(
  initial: Cause.Cause<E> | Effect.Effect<Cause.Cause<E>, Err, R> | Fx.Fx<Cause.Cause<E>, Err, R>,
  eq: Equivalence<Cause.Cause<E>> = equals,
): Effect.Effect<RefCause<E, Err>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq: Equivalence_.make(eq) });
}

/**
 * Set the current state of a RefCause to a Fail cause.
 * @remarks
 * ## Why
 *
 * Keeps set fail atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running set fail performs one serialized cause transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const setFail: {
  <E>(error: E): <Err, R>(ref: RefCause<E, Err, R>) => Effect.Effect<Cause.Cause<E>, Err, R>;
  <E, Err, R>(ref: RefCause<E, Err, R>, error: E): Effect.Effect<Cause.Cause<E>, Err, R>;
} = dual(2, function setFail<E, Err, R>(ref: RefCause<E, Err, R>, error: E) {
  return RefSubject.set(ref, Cause.fail(error));
});

/**
 * Set the current state of a RefCause to a Die cause.
 * @remarks
 * ## Why
 *
 * Keeps set die atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running set die performs one serialized cause transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const setDie: {
  (defect: unknown): <E, Err, R>(ref: RefCause<E, Err, R>) => Effect.Effect<Cause.Cause<E>, Err, R>;
  <E, Err, R>(ref: RefCause<E, Err, R>, defect: unknown): Effect.Effect<Cause.Cause<E>, Err, R>;
} = dual(2, function setDie<E, Err, R>(ref: RefCause<E, Err, R>, defect: unknown) {
  return RefSubject.set(ref, Cause.die(defect));
});

/**
 * Set the current state of a RefCause to an Interrupt cause.
 * @remarks
 * ## Why
 *
 * Keeps set interrupt atomic with respect to competing RefSubject writes instead of splitting the
 * read and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running set interrupt performs one serialized cause transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const setInterrupt: {
  (
    fiberId?: number,
  ): <E, Err, R>(ref: RefCause<E, Err, R>) => Effect.Effect<Cause.Cause<E>, Err, R>;
  <E, Err, R>(ref: RefCause<E, Err, R>, fiberId?: number): Effect.Effect<Cause.Cause<E>, Err, R>;
} = dual(2, function setInterrupt<E, Err, R>(ref: RefCause<E, Err, R>, fiberId?: number) {
  return RefSubject.set(ref, Cause.interrupt(fiberId));
});

// ========================================
// Computed
// ========================================

/**
 * Check if the current state of a RefCause has a Fail.
 * @remarks
 * ## Why
 *
 * Makes has fails a live projection of the cause; consumers can sample it now or observe it
 * without copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The has fails view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const hasFails = <E, Err, R>(
  ref: RefCause<E, Err, R>,
): RefSubject.Computed<boolean, Err, R> => RefSubject.map(ref, Cause.hasFails);

/**
 * Check if the current state of a RefCause has a Die.
 * @remarks
 * ## Why
 *
 * Makes has dies a live projection of the cause; consumers can sample it now or observe it without
 * copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The has dies view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const hasDies = <E, Err, R>(
  ref: RefCause<E, Err, R>,
): RefSubject.Computed<boolean, Err, R> => RefSubject.map(ref, Cause.hasDies);

/**
 * Check if the current state of a RefCause has an Interrupt.
 * @remarks
 * ## Why
 *
 * Makes has interrupts a live projection of the cause; consumers can sample it now or observe it
 * without copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The has interrupts view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const hasInterrupts = <E, Err, R>(
  ref: RefCause<E, Err, R>,
): RefSubject.Computed<boolean, Err, R> => RefSubject.map(ref, Cause.hasInterrupts);

/**
 * Check if the current state of a RefCause is empty.
 * @remarks
 * ## Why
 *
 * Makes is empty a live projection of the cause; consumers can sample it now or observe it without
 * copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The is empty view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isEmpty = <E, Err, R>(
  ref: RefCause<E, Err, R>,
): RefSubject.Computed<boolean, Err, R> => RefSubject.map(ref, (self) => self.reasons.length === 0);

/**
 * Get the size (number of failures) of the current state of a RefCause.
 * @remarks
 * ## Why
 *
 * Makes size a live projection of the cause; consumers can sample it now or observe it without
 * copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The size view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const size = <E, Err, R>(ref: RefCause<E, Err, R>): RefSubject.Computed<number, Err, R> =>
  RefSubject.map(ref, (self) => self.reasons.length);

/**
 * Get the reasons array of the current state of a RefCause.
 * @remarks
 * ## Why
 *
 * Get the reasons array of the current state of a RefCause. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The reasons view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const reasons = <E, Err, R>(
  ref: RefCause<E, Err, R>,
): RefSubject.Computed<ReadonlyArray<Cause.Reason<E>>, Err, R> =>
  RefSubject.map(ref, (self) => self.reasons);
