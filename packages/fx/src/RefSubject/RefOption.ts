/**
 * Extensions to RefSubject for working with Option values
 * @since 1.18.0
 */

import type * as Effect from "effect/Effect";
import * as Equivalence_ from "effect/Equivalence";
import type { Equivalence } from "effect/Equivalence";
import { dual } from "effect/Function";
import * as Option from "effect/Option";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

/**
 * A RefOption is a RefSubject specialized over an Option value.
 * @remarks
 * ## Why
 *
 * Defines option state with the same current-read, pushed-update, and synchronized-write contract
 * as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefOption is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefOption<in out A, in out E = never, out R = never> extends RefSubject.RefSubject<
  Option.Option<A>,
  E,
  R
> {}

/**
 * Creates a new `RefOption` from an Option, `Effect`, or `Fx`.
 *
 * @remarks
 * ## Why
 *
 * Creates option state with equality suited to that Effect data type, so unchanged values do not
 * produce redundant pushed updates.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope. It owns initializer acquisition, live source subscriptions,
 * and cleanup; source failures and services stay on reads and pushes.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as RefOption from "@typed/fx/RefOption"
 *
 * const program = Effect.gen(function* () {
 *   const value = yield* RefOption.make(Option.some(42))
 *   const current = yield* value
 *   console.log(current) // { _tag: "Some", value: 42 }
 * })
 * ```
 *
 * @since 1.18.0
 * @category Constructors
 */
export function make<A, E = never, R = never>(
  initial: Option.Option<A> | Effect.Effect<Option.Option<A>, E, R> | Fx.Fx<Option.Option<A>, E, R>,
  eq: Equivalence<A> = Equivalence_.strictEqual(),
): Effect.Effect<RefOption<A, E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq: Option.makeEquivalence(eq) });
}

/**
 * Set the current state of a RefOption to Some(value).
 * @remarks
 * ## Why
 *
 * Keeps set some atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running set some performs one serialized option transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const setSome: {
  <A>(value: A): <E, R>(ref: RefOption<A, E, R>) => Effect.Effect<Option.Option<A>, E, R>;
  <A, E, R>(ref: RefOption<A, E, R>, value: A): Effect.Effect<Option.Option<A>, E, R>;
} = dual(2, function setSome<A, E, R>(ref: RefOption<A, E, R>, value: A) {
  return RefSubject.set(ref, Option.some(value));
});

/**
 * Set the current state of a RefOption to None.
 * @remarks
 * ## Why
 *
 * Keeps set none atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running set none performs one serialized option transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const setNone = <A, E, R>(ref: RefOption<A, E, R>): Effect.Effect<Option.Option<A>, E, R> =>
  RefSubject.set(ref, Option.none());

// ========================================
// Computed
// ========================================

/**
 * Map the value inside the Option of a RefOption.
 * @remarks
 * ## Why
 *
 * Projects option state with map for both current reads and future pushes, avoiding a second
 * mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The map view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const map: {
  <A, B>(
    f: (a: A) => B,
  ): <E, R>(ref: RefOption<A, E, R>) => RefSubject.Computed<Option.Option<B>, E, R>;
  <A, E, R, B>(
    ref: RefOption<A, E, R>,
    f: (a: A) => B,
  ): RefSubject.Computed<Option.Option<B>, E, R>;
} = dual(2, function map<A, E, R, B>(ref: RefOption<A, E, R>, f: (a: A) => B) {
  return RefSubject.map(ref, (self) => Option.map(self, f));
});

/**
 * FlatMap the value inside the Option of a RefOption.
 * @remarks
 * ## Why
 *
 * Projects the optional value with `Option.flatMap` for both a current read and later source
 * pushes; it never changes the RefOption itself.
 *
 * ## Ownership and lifetime
 *
 * The flat map view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const flatMap: {
  <A, B>(
    f: (a: A) => Option.Option<B>,
  ): <E, R>(ref: RefOption<A, E, R>) => RefSubject.Computed<Option.Option<B>, E, R>;
  <A, E, R, B>(
    ref: RefOption<A, E, R>,
    f: (a: A) => Option.Option<B>,
  ): RefSubject.Computed<Option.Option<B>, E, R>;
} = dual(2, function flatMap<A, E, R, B>(ref: RefOption<A, E, R>, f: (a: A) => Option.Option<B>) {
  return RefSubject.map(ref, (self) => Option.flatMap(self, f));
});

/**
 * Filter the value inside the Option of a RefOption.
 * @remarks
 * ## Why
 *
 * Projects option state with filter for both current reads and future pushes, avoiding a second
 * mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The filter view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const filter: {
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefOption<A, E, R>) => RefSubject.Computed<Option.Option<A>, E, R>;
  <A, E, R>(
    ref: RefOption<A, E, R>,
    predicate: (a: A) => boolean,
  ): RefSubject.Computed<Option.Option<A>, E, R>;
} = dual(2, function filter<A, E, R>(ref: RefOption<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, (self) => Option.filter(self, predicate));
});

/**
 * Get the value from the Option or use a fallback value.
 * @remarks
 * ## Why
 *
 * Resolves `None` with the supplied fallback for both current reads and later pushes. The result is
 * Computed, never absent, and does not add `NoSuchElementError`.
 *
 * ## Ownership and lifetime
 *
 * The get or else view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const getOrElse: {
  <A>(fallback: () => A): <E, R>(ref: RefOption<A, E, R>) => RefSubject.Computed<A, E, R>;
  <A, E, R>(ref: RefOption<A, E, R>, fallback: () => A): RefSubject.Computed<A, E, R>;
} = dual(2, function getOrElse<A, E, R>(ref: RefOption<A, E, R>, fallback: () => A) {
  return RefSubject.map(ref, (self) => Option.getOrElse(self, fallback));
});

/**
 * Check if the current state of a RefOption is Some.
 * @remarks
 * ## Why
 *
 * Exposes whether the current Option is Some as Computed state, keeping the boolean synchronized
 * with every later source version.
 *
 * ## Ownership and lifetime
 *
 * The is some view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isSome = <A, E, R>(ref: RefOption<A, E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, Option.isSome);

/**
 * Check if the current state of a RefOption is None.
 * @remarks
 * ## Why
 *
 * Exposes whether the current Option is None as Computed state, without caching a second boolean
 * beside the source Option.
 *
 * ## Ownership and lifetime
 *
 * The is none view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isNone = <A, E, R>(ref: RefOption<A, E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, Option.isNone);

/**
 * Check if the current state of a RefOption contains a value.
 * @remarks
 * ## Why
 *
 * Makes contains a live projection of the option; consumers can sample it now or observe it
 * without copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The contains view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const contains: {
  <A>(value: A): <E, R>(ref: RefOption<A, E, R>) => RefSubject.Computed<boolean, E, R>;
  <A, E, R>(ref: RefOption<A, E, R>, value: A): RefSubject.Computed<boolean, E, R>;
} = dual(2, function contains<A, E, R>(ref: RefOption<A, E, R>, value: A) {
  return RefSubject.map(ref, (self) => Option.contains(self, value));
});

/**
 * Check if the value inside the Option satisfies a predicate.
 * @remarks
 * ## Why
 *
 * Makes exists a live projection of the option; consumers can sample it now or observe it without
 * copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The exists view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const exists: {
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefOption<A, E, R>) => RefSubject.Computed<boolean, E, R>;
  <A, E, R>(
    ref: RefOption<A, E, R>,
    predicate: (a: A) => boolean,
  ): RefSubject.Computed<boolean, E, R>;
} = dual(2, function exists<A, E, R>(ref: RefOption<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, (self) => Option.exists(self, predicate));
});

// ========================================
// Filtered
// ========================================

/**
 * Get the value from the Option as a Filtered (fails if None).
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of get value as Filtered state, so absence stays explicit
 * while later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The get value view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const getValue = <A, E, R>(ref: RefOption<A, E, R>): RefSubject.Filtered<A, E, R> =>
  RefSubject.compact(ref);
