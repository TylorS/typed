/**
 * Extensions to RefSubject for working with DateTime values
 * @since 1.18.0
 */

import * as DateTime from "effect/DateTime";
import type * as Duration from "effect/Duration";
import type * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

/**
 * A RefDateTime is a RefSubject specialized over a DateTime value.
 * @remarks
 * ## Why
 *
 * Defines date time state with the same current-read, pushed-update, and synchronized-write
 * contract as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefDateTime is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefDateTime<in out E = never, out R = never> extends RefSubject.RefSubject<
  DateTime.DateTime,
  E,
  R
> {}

/**
 * Creates a new `RefDateTime` from a DateTime, `Effect`, or `Fx`.
 *
 * @remarks
 * ## Why
 *
 * Creates date time state with equality suited to that Effect data type, so unchanged values do
 * not produce redundant pushed updates.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope. It owns initializer acquisition, live source subscriptions,
 * and cleanup; source failures and services stay on reads and pushes.
 *
 * @example
 * ```ts
 * import { Effect, DateTime } from "effect"
 * import * as RefDateTime from "@typed/fx/RefDateTime"
 *
 * const program = Effect.gen(function* () {
 *   const value = yield* RefDateTime.make(DateTime.nowUnsafe())
 *   const current = yield* value
 *   console.log(current) // DateTime(...)
 * })
 * ```
 *
 * @since 1.18.0
 * @category Constructors
 */
export function make<E = never, R = never>(
  initial:
    | DateTime.DateTime
    | Effect.Effect<DateTime.DateTime, E, R>
    | Fx.Fx<DateTime.DateTime, E, R>,
): Effect.Effect<RefDateTime<E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq: DateTime.Equivalence });
}

// ========================================
// Computed
// ========================================

/**
 * Add a Duration to the current state of a RefDateTime.
 * @remarks
 * ## Why
 *
 * Add a Duration to the current state of a RefDateTime. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The add view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Date arithmetic
 */
export const add: {
  (
    parts: Partial<{
      readonly millis?: number;
      readonly seconds?: number;
      readonly minutes?: number;
      readonly hours?: number;
      readonly days?: number;
      readonly weeks?: number;
      readonly months?: number;
      readonly years?: number;
    }>,
  ): <E, R>(ref: RefDateTime<E, R>) => RefSubject.Computed<DateTime.DateTime, E, R>;
  <E, R>(
    ref: RefDateTime<E, R>,
    parts: Partial<{
      readonly millis?: number;
      readonly seconds?: number;
      readonly minutes?: number;
      readonly hours?: number;
      readonly days?: number;
      readonly weeks?: number;
      readonly months?: number;
      readonly years?: number;
    }>,
  ): RefSubject.Computed<DateTime.DateTime, E, R>;
} = dual(
  2,
  function add<E, R>(
    ref: RefDateTime<E, R>,
    parts: Partial<{
      readonly millis?: number;
      readonly seconds?: number;
      readonly minutes?: number;
      readonly hours?: number;
      readonly days?: number;
      readonly weeks?: number;
      readonly months?: number;
      readonly years?: number;
    }>,
  ) {
    return RefSubject.map(ref, (self) => DateTime.add(self, parts));
  },
);

/**
 * Add a Duration to the current state of a RefDateTime.
 * @remarks
 * ## Why
 *
 * Add a Duration to the current state of a RefDateTime. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The add duration view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Date arithmetic
 */
export const addDuration: {
  (
    duration: Duration.Input,
  ): <E, R>(ref: RefDateTime<E, R>) => RefSubject.Computed<DateTime.DateTime, E, R>;
  <E, R>(
    ref: RefDateTime<E, R>,
    duration: Duration.Input,
  ): RefSubject.Computed<DateTime.DateTime, E, R>;
} = dual(2, function addDuration<E, R>(ref: RefDateTime<E, R>, duration: Duration.Input) {
  return RefSubject.map(ref, (self) => DateTime.addDuration(self, duration));
});

/**
 * Subtract a Duration from the current state of a RefDateTime.
 * @remarks
 * ## Why
 *
 * Subtract a Duration from the current state of a RefDateTime. The operation remains attached to
 * the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The subtract view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Date arithmetic
 */
export const subtract: {
  (
    parts: Partial<{
      readonly millis?: number;
      readonly seconds?: number;
      readonly minutes?: number;
      readonly hours?: number;
      readonly days?: number;
      readonly weeks?: number;
      readonly months?: number;
      readonly years?: number;
    }>,
  ): <E, R>(ref: RefDateTime<E, R>) => RefSubject.Computed<DateTime.DateTime, E, R>;
  <E, R>(
    ref: RefDateTime<E, R>,
    parts: Partial<{
      readonly millis?: number;
      readonly seconds?: number;
      readonly minutes?: number;
      readonly hours?: number;
      readonly days?: number;
      readonly weeks?: number;
      readonly months?: number;
      readonly years?: number;
    }>,
  ): RefSubject.Computed<DateTime.DateTime, E, R>;
} = dual(
  2,
  function subtract<E, R>(
    ref: RefDateTime<E, R>,
    parts: Partial<{
      readonly millis?: number;
      readonly seconds?: number;
      readonly minutes?: number;
      readonly hours?: number;
      readonly days?: number;
      readonly weeks?: number;
      readonly months?: number;
      readonly years?: number;
    }>,
  ) {
    return RefSubject.map(ref, (self) => DateTime.subtract(self, parts));
  },
);

/**
 * Subtract a Duration from the current state of a RefDateTime.
 * @remarks
 * ## Why
 *
 * Subtract a Duration from the current state of a RefDateTime. The operation remains attached to
 * the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The subtract duration view retains no independent state. An Effect read samples the source once;
 * Fx observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Date arithmetic
 */
export const subtractDuration: {
  (
    duration: Duration.Input,
  ): <E, R>(ref: RefDateTime<E, R>) => RefSubject.Computed<DateTime.DateTime, E, R>;
  <E, R>(
    ref: RefDateTime<E, R>,
    duration: Duration.Input,
  ): RefSubject.Computed<DateTime.DateTime, E, R>;
} = dual(2, function subtractDuration<E, R>(ref: RefDateTime<E, R>, duration: Duration.Input) {
  return RefSubject.map(ref, (self) => DateTime.subtractDuration(self, duration));
});

/**
 * Get the epoch milliseconds of the current state of a RefDateTime.
 * @remarks
 * ## Why
 *
 * Get the epoch milliseconds of the current state of a RefDateTime. The operation remains attached
 * to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The epoch millis view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Date formatting
 */
export const epochMillis = <E, R>(ref: RefDateTime<E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, (self) => DateTime.toEpochMillis(self));

/**
 * Format the current state of a RefDateTime.
 * @remarks
 * ## Why
 *
 * Format the current state of a RefDateTime. The operation remains attached to the RefSubject's
 * versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The format view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Date formatting
 */
export const format: {
  (
    options?: Intl.DateTimeFormatOptions & {
      readonly locale?: string | undefined;
    },
  ): <E, R>(ref: RefDateTime<E, R>) => RefSubject.Computed<string, E, R>;
  <E, R>(
    ref: RefDateTime<E, R>,
    options?: Intl.DateTimeFormatOptions & {
      readonly locale?: string | undefined;
    },
  ): RefSubject.Computed<string, E, R>;
} = dual(
  2,
  function format<E, R>(
    ref: RefDateTime<E, R>,
    options?: Intl.DateTimeFormatOptions & {
      readonly locale?: string | undefined;
    },
  ) {
    return RefSubject.map(ref, (self) => DateTime.format(self, options));
  },
);

/**
 * Check if the current state of a RefDateTime is before another DateTime.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefDateTime is before another DateTime. The operation remains
 * attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The is before view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isBefore: {
  (that: DateTime.DateTime): <E, R>(ref: RefDateTime<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefDateTime<E, R>, that: DateTime.DateTime): RefSubject.Computed<boolean, E, R>;
} = dual(2, function isBefore<E, R>(ref: RefDateTime<E, R>, that: DateTime.DateTime) {
  return RefSubject.map(ref, (self) => DateTime.isLessThan(self, that));
});

/**
 * Check if the current state of a RefDateTime is after another DateTime.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefDateTime is after another DateTime. The operation remains
 * attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The is after view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isAfter: {
  (that: DateTime.DateTime): <E, R>(ref: RefDateTime<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefDateTime<E, R>, that: DateTime.DateTime): RefSubject.Computed<boolean, E, R>;
} = dual(2, function isAfter<E, R>(ref: RefDateTime<E, R>, that: DateTime.DateTime) {
  return RefSubject.map(ref, (self) => DateTime.isGreaterThan(self, that));
});

/**
 * Check if the current state of a RefDateTime equals another DateTime.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefDateTime equals another DateTime. The operation remains
 * attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The is equal view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isEqual: {
  (that: DateTime.DateTime): <E, R>(ref: RefDateTime<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(ref: RefDateTime<E, R>, that: DateTime.DateTime): RefSubject.Computed<boolean, E, R>;
} = dual(2, function isEqual<E, R>(ref: RefDateTime<E, R>, that: DateTime.DateTime) {
  return RefSubject.map(ref, (self) => DateTime.Equivalence(self, that));
});
