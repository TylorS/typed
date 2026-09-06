/**
 * Extensions to RefSubject for working with tuple values
 * @since 1.18.0
 */

import type * as Effect from "effect/Effect";
import { equals } from "effect/Equal";
import * as Equivalence_ from "effect/Equivalence";
import type { Equivalence } from "effect/Equivalence";
import { dual } from "effect/Function";
import type * as Scope from "effect/Scope";
import * as Tuple from "effect/Tuple";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

/**
 * A RefTuple is a RefSubject specialized over a tuple value.
 * @remarks
 * ## Why
 *
 * Defines tuple state with the same current-read, pushed-update, and synchronized-write contract
 * as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefTuple is a contract and performs no acquisition. Implementations retain the errors, services,
 * interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefTuple<
  in out T extends ReadonlyArray<unknown>,
  in out E = never,
  out R = never,
> extends RefSubject.RefSubject<T, E, R> {}

/**
 * Creates a new `RefTuple` from a tuple, `Effect`, or `Fx`.
 *
 * @remarks
 * ## Why
 *
 * Creates tuple state with equality suited to that Effect data type, so unchanged values do not
 * produce redundant pushed updates.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope. It owns initializer acquisition, live source subscriptions,
 * and cleanup; source failures and services stay on reads and pushes.
 *
 * @example
 * ```ts
 * import { Effect, Tuple } from "effect"
 * import * as RefTuple from "@typed/fx/RefTuple"
 *
 * const program = Effect.gen(function* () {
 *   const value = yield* RefTuple.make(Tuple.make(1, "hello", true))
 *   const current = yield* value
 *   console.log(current) // [1, "hello", true]
 * })
 * ```
 *
 * @since 1.18.0
 * @category Constructors
 */
export function make<T extends ReadonlyArray<unknown>, E = never, R = never>(
  initial: T | Effect.Effect<T, E, R> | Fx.Fx<T, E, R>,
  eq: Equivalence<T> = Equivalence_.make((a, b) => equals(a, b)),
): Effect.Effect<RefTuple<T, E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq });
}

/**
 * Set the value at a specific index in the current state of a RefTuple.
 * @remarks
 * ## Why
 *
 * Keeps set at atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running set at performs one serialized tuple transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const setAt: {
  <T extends ReadonlyArray<unknown>, I extends number>(
    index: I,
    value: T[I],
  ): <E, R>(ref: RefTuple<T, E, R>) => Effect.Effect<T, E, R>;
  <T extends ReadonlyArray<unknown>, I extends number, E, R>(
    ref: RefTuple<T, E, R>,
    index: I,
    value: T[I],
  ): Effect.Effect<T, E, R>;
} = dual(3, function setAt<
  T extends ReadonlyArray<unknown>,
  I extends number,
  E,
  R,
>(ref: RefTuple<T, E, R>, index: I, value: T[I]) {
  return RefSubject.update(ref, (self) => {
    const result = [...self] as unknown as T;
    result[index] = value;
    return result;
  });
});

/**
 * Update the value at a specific index in the current state of a RefTuple using a function.
 * @remarks
 * ## Why
 *
 * Keeps update at atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running update at performs one serialized tuple transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const updateAt: {
  <T extends ReadonlyArray<unknown>, I extends number>(
    index: I,
    f: (value: T[I]) => T[I],
  ): <E, R>(ref: RefTuple<T, E, R>) => Effect.Effect<T, E, R>;
  <T extends ReadonlyArray<unknown>, I extends number, E, R>(
    ref: RefTuple<T, E, R>,
    index: I,
    f: (value: T[I]) => T[I],
  ): Effect.Effect<T, E, R>;
} = dual(3, function updateAt<
  T extends ReadonlyArray<unknown>,
  I extends number,
  E,
  R,
>(ref: RefTuple<T, E, R>, index: I, f: (value: T[I]) => T[I]) {
  return RefSubject.update(ref, (self) => Tuple.evolve(self, { [index]: f } as any) as T);
});

// ========================================
// Computed
// ========================================

/**
 * Append an element to the end of the current state of a RefTuple.
 * @remarks
 * ## Why
 *
 * Expresses append element as one ordered tuple transition; readers never observe the intermediate
 * collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * The append element view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const appendElement: {
  <E>(
    element: E,
  ): <T extends ReadonlyArray<unknown>, Err, R>(
    ref: RefTuple<T, Err, R>,
  ) => RefSubject.Computed<[...T, E], Err, R>;
  <T extends ReadonlyArray<unknown>, E, Err, R>(
    ref: RefTuple<T, Err, R>,
    element: E,
  ): RefSubject.Computed<[...T, E], Err, R>;
} = dual(2, function appendElement<
  T extends ReadonlyArray<unknown>,
  E,
  Err,
  R,
>(ref: RefTuple<T, Err, R>, element: E) {
  return RefSubject.map(ref, (self) => Tuple.appendElement(self, element));
});

/**
 * Prepend an element to the beginning of the current state of a RefTuple.
 * @remarks
 * ## Why
 *
 * Expresses prepend element as one ordered tuple transition; readers never observe the
 * intermediate collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * The prepend element view retains no independent state. An Effect read samples the source once;
 * Fx observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const prependElement: {
  <E>(
    element: E,
  ): <T extends ReadonlyArray<unknown>, Err, R>(
    ref: RefTuple<T, Err, R>,
  ) => RefSubject.Computed<[E, ...T], Err, R>;
  <T extends ReadonlyArray<unknown>, E, Err, R>(
    ref: RefTuple<T, Err, R>,
    element: E,
  ): RefSubject.Computed<[E, ...T], Err, R>;
} = dual(2, function prependElement<
  T extends ReadonlyArray<unknown>,
  E,
  Err,
  R,
>(ref: RefTuple<T, Err, R>, element: E) {
  return RefSubject.map(ref, (self) => [element, ...self] as [E, ...T]);
});

/**
 * Get the element at a specific index from the current state of a RefTuple.
 * @since 1.18.0
 * @category Type utilities
 */
type Indices<T extends ReadonlyArray<unknown>> = Exclude<Partial<T>["length"], T["length"]>;

/**
 * Projects one statically valid tuple index as Computed state.
 *
 * @remarks
 * ## Why
 *
 * The index is constrained to the tuple's known indices, so every current value has that element.
 * The result is Computed, cannot become absent, and does not add `NoSuchElementError`.
 *
 * ## Ownership and lifetime
 *
 * The get view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const get: {
  <T extends ReadonlyArray<unknown>, I extends Indices<T> & keyof T>(
    index: I,
  ): <E, R>(ref: RefTuple<T, E, R>) => RefSubject.Computed<T[I], E, R>;
  <T extends ReadonlyArray<unknown>, I extends Indices<T> & keyof T, E, R>(
    ref: RefTuple<T, E, R>,
    index: I,
  ): RefSubject.Computed<T[I], E, R>;
} = dual(2, function get<
  T extends ReadonlyArray<unknown>,
  I extends Indices<T> & keyof T,
  E,
  R,
>(ref: RefTuple<T, E, R>, index: I) {
  return RefSubject.map(ref, (self) => Tuple.get(self, index));
});

/**
 * Get the length of the current state of a RefTuple.
 * @remarks
 * ## Why
 *
 * Makes length a live projection of the tuple; consumers can sample it now or observe it without
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
export const length = <T extends ReadonlyArray<unknown>, E, R>(
  ref: RefTuple<T, E, R>,
): RefSubject.Computed<number, E, R> => RefSubject.map(ref, (self) => self.length);

/**
 * Pick elements at specific indices from the current state of a RefTuple.
 * @remarks
 * ## Why
 *
 * Projects tuple state with pick for both current reads and future pushes, avoiding a second
 * mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The pick view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const pick: {
  <T extends ReadonlyArray<unknown>, const I extends ReadonlyArray<Indices<T>>>(
    indices: I,
  ): <E, R>(ref: RefTuple<T, E, R>) => RefSubject.Computed<Array<T[number]>, E, R>;
  <T extends ReadonlyArray<unknown>, const I extends ReadonlyArray<Indices<T>>, E, R>(
    ref: RefTuple<T, E, R>,
    indices: I,
  ): RefSubject.Computed<Array<T[number]>, E, R>;
} = dual(2, function pick<
  T extends ReadonlyArray<unknown>,
  const I extends ReadonlyArray<Indices<T>>,
  E,
  R,
>(ref: RefTuple<T, E, R>, indices: I) {
  return RefSubject.map(ref, (self) => Tuple.pick(self, indices));
});

/**
 * Omit elements at specific indices from the current state of a RefTuple.
 * @remarks
 * ## Why
 *
 * Projects tuple state with omit for both current reads and future pushes, avoiding a second
 * mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The omit view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const omit: {
  <T extends ReadonlyArray<unknown>, const I extends ReadonlyArray<Indices<T>>>(
    indices: I,
  ): <E, R>(ref: RefTuple<T, E, R>) => RefSubject.Computed<Array<T[number]>, E, R>;
  <T extends ReadonlyArray<unknown>, const I extends ReadonlyArray<Indices<T>>, E, R>(
    ref: RefTuple<T, E, R>,
    indices: I,
  ): RefSubject.Computed<Array<T[number]>, E, R>;
} = dual(2, function omit<
  T extends ReadonlyArray<unknown>,
  const I extends ReadonlyArray<Indices<T>>,
  E,
  R,
>(ref: RefTuple<T, E, R>, indices: I) {
  return RefSubject.map(ref, (self) => Tuple.omit(self, indices));
});
