/**
 * Extensions to RefSubject for working with string values
 * @since 1.18.0
 */

import type * as Effect from "effect/Effect";
import * as Equivalence_ from "effect/Equivalence";
import type { Equivalence } from "effect/Equivalence";
import { dual } from "effect/Function";
import type * as Scope from "effect/Scope";
import * as String_ from "effect/String";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

const isRefStringDataFirst = (args: IArguments) => RefSubject.isRefSubject(args[0]);

/**
 * A RefString is a RefSubject specialized over a string value.
 * @remarks
 * ## Why
 *
 * Defines string state with the same current-read, pushed-update, and synchronized-write contract
 * as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefString is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefString<in out E = never, out R = never> extends RefSubject.RefSubject<
  string,
  E,
  R
> {}

/**
 * Creates a new `RefString` from a string, `Effect`, or `Fx`.
 *
 * @remarks
 * ## Why
 *
 * Creates string state with equality suited to that Effect data type, so unchanged values do not
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
 * import * as RefString from "@typed/fx/RefString"
 *
 * const program = Effect.gen(function* () {
 *   const value = yield* RefString.make("hello")
 *   const current = yield* value
 *   console.log(current) // "hello"
 * })
 * ```
 *
 * @since 1.18.0
 * @category Constructors
 */
export function make<E = never, R = never>(
  initial: string | Effect.Effect<string, E, R> | Fx.Fx<string, E, R>,
  eq: Equivalence<string> = Equivalence_.strictEqual(),
): Effect.Effect<RefString<E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq });
}

// ========================================
// Computed
// ========================================

/**
 * Concatenate a string to the current state of a RefString.
 * @remarks
 * ## Why
 *
 * Concatenate a string to the current state of a RefString. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The concat view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const concat: {
  (that: string): <E, R>(ref: RefString<E, R>) => RefSubject.Computed<string, E, R>;
  <E, R>(ref: RefString<E, R>, that: string): RefSubject.Computed<string, E, R>;
} = dual(2, function concat<E, R>(ref: RefString<E, R>, that: string) {
  return RefSubject.map(ref, (self) => String_.concat(self, that));
});

/**
 * Convert the current state of a RefString to uppercase.
 * @remarks
 * ## Why
 *
 * Convert the current state of a RefString to uppercase. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The to upper case view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const toUpperCase = <E, R>(ref: RefString<E, R>): RefSubject.Computed<string, E, R> =>
  RefSubject.map(ref, String_.toUpperCase);

/**
 * Convert the current state of a RefString to lowercase.
 * @remarks
 * ## Why
 *
 * Convert the current state of a RefString to lowercase. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The to lower case view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const toLowerCase = <E, R>(ref: RefString<E, R>): RefSubject.Computed<string, E, R> =>
  RefSubject.map(ref, String_.toLowerCase);

/**
 * Trim whitespace from both ends of the current state of a RefString.
 * @remarks
 * ## Why
 *
 * Trim whitespace from both ends of the current state of a RefString. The operation remains
 * attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The trim view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const trim = <E, R>(ref: RefString<E, R>): RefSubject.Computed<string, E, R> =>
  RefSubject.map(ref, String_.trim);

/**
 * Trim whitespace from the start of the current state of a RefString.
 * @remarks
 * ## Why
 *
 * Trim whitespace from the start of the current state of a RefString. The operation remains
 * attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The trim start view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const trimStart = <E, R>(ref: RefString<E, R>): RefSubject.Computed<string, E, R> =>
  RefSubject.map(ref, String_.trimStart);

/**
 * Trim whitespace from the end of the current state of a RefString.
 * @remarks
 * ## Why
 *
 * Trim whitespace from the end of the current state of a RefString. The operation remains attached
 * to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The trim end view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const trimEnd = <E, R>(ref: RefString<E, R>): RefSubject.Computed<string, E, R> =>
  RefSubject.map(ref, String_.trimEnd);

/**
 * Replace the first occurrence of a substring or pattern in the current state of a RefString.
 * @remarks
 * ## Why
 *
 * Keeps replace atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * The replace view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const replace: {
  (
    searchValue: string | RegExp,
    replaceValue: string,
  ): <E, R>(ref: RefString<E, R>) => RefSubject.Computed<string, E, R>;
  <E, R>(
    ref: RefString<E, R>,
    searchValue: string | RegExp,
    replaceValue: string,
  ): RefSubject.Computed<string, E, R>;
} = dual(3, function replace<
  E,
  R,
>(ref: RefString<E, R>, searchValue: string | RegExp, replaceValue: string) {
  return RefSubject.map(ref, String_.replace(searchValue, replaceValue));
});

/**
 * Replace all occurrences of a substring or pattern in the current state of a RefString.
 * @remarks
 * ## Why
 *
 * Keeps replace all atomic with respect to competing RefSubject writes instead of splitting the
 * read and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * The replace all view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const replaceAll: {
  (
    searchValue: string | RegExp,
    replaceValue: string,
  ): <E, R>(ref: RefString<E, R>) => RefSubject.Computed<string, E, R>;
  <E, R>(
    ref: RefString<E, R>,
    searchValue: string | RegExp,
    replaceValue: string,
  ): RefSubject.Computed<string, E, R>;
} = dual(3, function replaceAll<
  E,
  R,
>(ref: RefString<E, R>, searchValue: string | RegExp, replaceValue: string) {
  return RefSubject.map(ref, String_.replaceAll(searchValue, replaceValue));
});

/**
 * Check if the current state of a RefString is empty.
 * @remarks
 * ## Why
 *
 * Makes is empty a live projection of the string; consumers can sample it now or observe it
 * without copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The is empty view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isEmpty = <E, R>(ref: RefString<E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, String_.isEmpty);

/**
 * Check if the current state of a RefString is non-empty.
 * @remarks
 * ## Why
 *
 * Makes is non empty a live projection of the string; consumers can sample it now or observe it
 * without copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The is non empty view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isNonEmpty = <E, R>(ref: RefString<E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, String_.isNonEmpty);

/**
 * Get the length of the current state of a RefString.
 * @remarks
 * ## Why
 *
 * Makes length a live projection of the string; consumers can sample it now or observe it without
 * copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The length view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const length = <E, R>(ref: RefString<E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, String_.length);

/**
 * Check if the current state of a RefString starts with a substring.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefString starts with a substring. The operation remains
 * attached to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The starts with view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const startsWith: {
  (
    searchString: string,
    position?: number,
  ): <E, R>(ref: RefString<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(
    ref: RefString<E, R>,
    searchString: string,
    position?: number,
  ): RefSubject.Computed<boolean, E, R>;
} = dual(isRefStringDataFirst, function startsWith<
  E,
  R,
>(ref: RefString<E, R>, searchString: string, position?: number) {
  return RefSubject.map(ref, String_.startsWith(searchString, position));
});

/**
 * Check if the current state of a RefString ends with a substring.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefString ends with a substring. The operation remains attached
 * to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The ends with view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const endsWith: {
  (
    searchString: string,
    position?: number,
  ): <E, R>(ref: RefString<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(
    ref: RefString<E, R>,
    searchString: string,
    position?: number,
  ): RefSubject.Computed<boolean, E, R>;
} = dual(isRefStringDataFirst, function endsWith<
  E,
  R,
>(ref: RefString<E, R>, searchString: string, position?: number) {
  return RefSubject.map(ref, String_.endsWith(searchString, position));
});

/**
 * Check if the current state of a RefString includes a substring.
 * @remarks
 * ## Why
 *
 * Check if the current state of a RefString includes a substring. The operation remains attached
 * to the RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The includes view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const includes: {
  (
    searchString: string,
    position?: number,
  ): <E, R>(ref: RefString<E, R>) => RefSubject.Computed<boolean, E, R>;
  <E, R>(
    ref: RefString<E, R>,
    searchString: string,
    position?: number,
  ): RefSubject.Computed<boolean, E, R>;
} = dual(isRefStringDataFirst, function includes<
  E,
  R,
>(ref: RefString<E, R>, searchString: string, position?: number) {
  return RefSubject.map(ref, String_.includes(searchString, position));
});

/**
 * Extract a section of the current state of a RefString.
 * @remarks
 * ## Why
 *
 * Extract a section of the current state of a RefString. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The slice view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const slice: {
  (start?: number, end?: number): <E, R>(ref: RefString<E, R>) => RefSubject.Computed<string, E, R>;
  <E, R>(ref: RefString<E, R>, start?: number, end?: number): RefSubject.Computed<string, E, R>;
} = dual(isRefStringDataFirst, function slice<
  E,
  R,
>(ref: RefString<E, R>, start?: number, end?: number) {
  return RefSubject.map(ref, String_.slice(start, end));
});
