/**
 * Extensions to RefSubject for working with arrays of values
 * @since 1.18.0
 */

import * as ReadonlyArray from "effect/Array";
import type * as Effect from "effect/Effect";
import { equals } from "effect/Equal";
import * as Equivalence_ from "effect/Equivalence";
import type { Equivalence } from "effect/Equivalence";
import { dual } from "effect/Function";
import * as Option from "effect/Option";
import type * as Order from "effect/Order";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";
import { Result } from "effect";

/**
 * A RefArray is a RefSubject that is specialized over an array of values.
 * @remarks
 * ## Why
 *
 * Defines array state with the same current-read, pushed-update, and synchronized-write contract
 * as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefArray is a contract and performs no acquisition. Implementations retain the errors, services,
 * interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefArray<in out A, in out E = never, out R = never> extends RefSubject.RefSubject<
  ReadonlyArray<A>,
  E,
  R
> {}

/**
 * Creates a new `RefArray` from an array, `Effect`, or `Fx`.
 *
 * @remarks
 * ## Why
 *
 * Creates array state with equality suited to that Effect data type, so unchanged values do not
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
 * import * as RefArray from "@typed/fx/RefArray"
 *
 * // From a plain array
 * const program1 = Effect.gen(function* () {
 *   const items = yield* RefArray.make([1, 2, 3])
 *   const values = yield* items
 *   console.log(values) // [1, 2, 3]
 * })
 *
 * // From an Effect
 * const program2 = Effect.gen(function* () {
 *   const items = yield* RefArray.make(
 *     Effect.succeed(["a", "b", "c"])
 *   )
 *   const values = yield* items
 *   console.log(values) // ["a", "b", "c"]
 * })
 * ```
 *
 * @since 1.18.0
 * @category Constructors
 */
export function make<A, E = never, R = never>(
  initial: ReadonlyArray<A> | Effect.Effect<ReadonlyArray<A>, E, R> | Fx.Fx<ReadonlyArray<A>, E, R>,
  eq: Equivalence<A> = equals,
): Effect.Effect<RefArray<A, E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq: Equivalence_.Array(eq) });
}

/**
 * Prepend a value to the current state of a RefArray.
 * @remarks
 * ## Why
 *
 * Expresses prepend as one ordered array transition; readers never observe the intermediate
 * collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * Running prepend performs one serialized array transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const prepend: {
  <A>(value: A): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>;
  <A, E, R>(ref: RefArray<A, E, R>, value: A): Effect.Effect<ReadonlyArray<A>, E, R>;
} = dual(2, function prepend<A, E, R>(ref: RefArray<A, E, R>, value: A) {
  return RefSubject.update(ref, ReadonlyArray.prepend(value));
});

/**
 * Prepend an iterable of values to the current state of a RefArray.
 * @remarks
 * ## Why
 *
 * Expresses prepend all as one ordered array transition; readers never observe the intermediate
 * collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * Running prepend all performs one serialized array transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const prependAll: {
  <A>(value: Iterable<A>): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>;
  <A, E, R>(ref: RefArray<A, E, R>, value: Iterable<A>): Effect.Effect<ReadonlyArray<A>, E, R>;
} = dual(2, function prependAll<A, E, R>(ref: RefArray<A, E, R>, value: Iterable<A>) {
  return RefSubject.update(ref, ReadonlyArray.prependAll(value));
});

/**
 * Append a value to the current state of a RefArray.
 * @remarks
 * ## Why
 *
 * Expresses append as one ordered array transition; readers never observe the intermediate
 * collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * Running append performs one serialized array transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const append: {
  <A>(value: A): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>;
  <A, E, R>(ref: RefArray<A, E, R>, value: A): Effect.Effect<ReadonlyArray<A>, E, R>;
} = dual(2, function append<A, E, R>(ref: RefArray<A, E, R>, value: A) {
  return RefSubject.update(ref, ReadonlyArray.append(value));
});

/**
 * Append an iterable of values to the current state of a RefArray.
 * @remarks
 * ## Why
 *
 * Expresses append all as one ordered array transition; readers never observe the intermediate
 * collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * Running append all performs one serialized array transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const appendAll: {
  <A>(value: Iterable<A>): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>;
  <A, E, R>(ref: RefArray<A, E, R>, value: Iterable<A>): Effect.Effect<ReadonlyArray<A>, E, R>;
} = dual(2, function appendAll<A, E, R>(ref: RefArray<A, E, R>, value: Iterable<A>) {
  return RefSubject.update(ref, ReadonlyArray.appendAll(value));
});

/**
 * Drop the first `n` values from a RefArray.
 * @remarks
 * ## Why
 *
 * Applies drop to the committed array value and publishes only the result, preserving its element
 * order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running drop performs one serialized array transition and resolves with its committed value. It
 * acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const drop: {
  (n: number): <A, E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>;
  <A, E, R>(ref: RefArray<A, E, R>, n: number): Effect.Effect<ReadonlyArray<A>, E, R>;
} = dual(2, function drop<A, E, R>(ref: RefArray<A, E, R>, n: number) {
  return RefSubject.update(ref, ReadonlyArray.drop(n));
});

/**
 * Drop the last `n` values from a RefArray.
 * @remarks
 * ## Why
 *
 * Applies drop right to the committed array value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running drop right performs one serialized array transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const dropRight: {
  (n: number): <A, E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>;
  <A, E, R>(ref: RefArray<A, E, R>, n: number): Effect.Effect<ReadonlyArray<A>, E, R>;
} = dual(2, function dropRight<A, E, R>(ref: RefArray<A, E, R>, n: number) {
  return RefSubject.update(ref, ReadonlyArray.dropRight(n));
});

/**
 * Drop values from a RefArray while a predicate is true.
 * @remarks
 * ## Why
 *
 * Applies drop while to the committed array value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running drop while performs one serialized array transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const dropWhile: {
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>;
  <A, E, R>(
    ref: RefArray<A, E, R>,
    predicate: (a: unknown) => boolean,
  ): Effect.Effect<ReadonlyArray<A>, E, R>;
} = dual(2, function dropWhile<
  A,
  E,
  R,
>(ref: RefArray<A, E, R>, predicate: (a: unknown) => boolean) {
  return RefSubject.update(ref, ReadonlyArray.dropWhile(predicate));
});

/**
 * Filter the values of a RefArray using a predicate creating a Computed value.
 * @remarks
 * ## Why
 *
 * Projects array state with filter values for both current reads and future pushes, avoiding a
 * second mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The filter values view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const filterValues: {
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<ReadonlyArray<A>, E, R>;
  <A, E, R>(
    ref: RefArray<A, E, R>,
    predicate: (a: A) => boolean,
  ): RefSubject.Computed<ReadonlyArray<A>, E, R>;
} = dual(2, function filterValues<A, E, R>(ref: RefArray<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, ReadonlyArray.filter(predicate));
});

/**
 * Get a value contained a particular index of a RefArray.
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of get index as Filtered state, so absence stays explicit
 * while later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The get index view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const getIndex: {
  (index: number): <A, E, R>(ref: RefArray<A, E, R>) => RefSubject.Filtered<A, E, R>;
  <A, E, R>(ref: RefArray<A, E, R>, index: number): RefSubject.Filtered<A, E, R>;
} = dual(2, function getIndex<A, E, R>(ref: RefArray<A, E, R>, index: number) {
  return RefSubject.filterMap(ref, ReadonlyArray.get(index));
});

/**
 * Group the values of a RefArray by a key.
 * @remarks
 * ## Why
 *
 * Projects array state with group by for both current reads and future pushes, avoiding a second
 * mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The group by view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const groupBy: {
  <A>(
    f: (a: A) => string,
  ): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<R, E, Record<string, ReadonlyArray<A>>>;
  <A, E, R>(
    ref: RefArray<A, E, R>,
    f: (a: A) => string,
  ): RefSubject.Computed<R, E, Record<string, ReadonlyArray<A>>>;
} = dual(2, function groupBy<A, E, R>(ref: RefArray<A, E, R>, f: (a: A) => string) {
  return RefSubject.map(ref, ReadonlyArray.groupBy(f));
});

/**
 * Insert a value at a particular index of a RefArray.
 * @remarks
 * ## Why
 *
 * Expresses insert at as one ordered array transition; readers never observe the intermediate
 * collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * Running insert at performs one serialized array transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const insertAt: {
  <A>(index: number, a: A): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>;
  <A, E, R>(ref: RefArray<A, E, R>, index: number, a: A): Effect.Effect<ReadonlyArray<A>, E, R>;
} = dual(3, function insertAt<A, E, R>(ref: RefArray<A, E, R>, index: number, a: A) {
  return RefSubject.update(ref, (as) =>
    Option.getOrElse(ReadonlyArray.insertAt(as, index, a), () => [...as, a]),
  );
});

/**
 * Check to see if a RefArray is empty.
 * @remarks
 * ## Why
 *
 * Makes is empty a live projection of the array; consumers can sample it now or observe it without
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
export const isEmpty = <A, E, R>(ref: RefArray<A, E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, ReadonlyArray.isReadonlyArrayEmpty);

/**
 * Check to see if a RefArray is non-empty.
 * @remarks
 * ## Why
 *
 * Makes is non empty a live projection of the array; consumers can sample it now or observe it
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
export const isNonEmpty = <A, E, R>(ref: RefArray<A, E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, ReadonlyArray.isReadonlyArrayNonEmpty);

/**
 * Get the current length of a RefArray.
 * @remarks
 * ## Why
 *
 * Makes length a live projection of the array; consumers can sample it now or observe it without
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
export const length = <A, E, R>(ref: RefArray<A, E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, ReadonlyArray.length);

/**
 * Map (Endomorphic) the values of a RefArray.
 * @remarks
 * ## Why
 *
 * The implementation applies the endomorphic map through `RefSubject.update`, replacing the
 * writable RefArray in one serialized transition. The published Computed return type does not
 * describe that runtime behavior.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed array and retains the ref's E and R channels.
 * ## Known API defect
 *
 * The public overloads currently declare `Computed<ReadonlyArray<A>, E, R>`, but the implementation
 * returns the update Effect from `RefSubject.update`. This documentation reports the shipped mismatch;
 * changing that signature or runtime behavior requires a separate compatibility decision.
 *
 * @since 1.18.0
 * @category State updates
 */
export const map: {
  <A>(
    f: (a: A, index: number) => A,
  ): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<ReadonlyArray<A>, E, R>;
  <A, E, R>(
    ref: RefArray<A, E, R>,
    f: (a: A, index: number) => A,
  ): RefSubject.Computed<ReadonlyArray<A>, E, R>;
} = dual(2, function mapValues<A, E, R>(ref: RefArray<A, E, R>, f: (a: A, index: number) => A) {
  return RefSubject.update(ref, ReadonlyArray.map(f));
});

/**
 * Map the values with their indexes of a RefArray.
 * @remarks
 * ## Why
 *
 * Projects array state with map values for both current reads and future pushes, avoiding a second
 * mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The map values view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const mapValues: {
  <A, B>(
    f: (a: A, index: number) => B,
  ): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<ReadonlyArray<B>, E, R>;
  <A, E, R, B>(
    ref: RefArray<A, E, R>,
    f: (a: A, index: number) => B,
  ): RefSubject.Computed<ReadonlyArray<B>, E, R>;
} = dual(2, function mapValues<A, E, R, B>(ref: RefArray<A, E, R>, f: (a: A, index: number) => B) {
  return RefSubject.map(ref, ReadonlyArray.map(f));
});

/**
 * Modify the value at a particular index of a RefArray.
 * @remarks
 * ## Why
 *
 * Keeps modify at atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running modify at performs one serialized array transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const modifyAt: {
  <A>(
    index: number,
    f: (a: A) => A,
  ): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>;
  <A, E, R>(
    ref: RefArray<A, E, R>,
    index: number,
    f: (a: A) => A,
  ): Effect.Effect<ReadonlyArray<A>, E, R>;
} = dual(3, function modifyAt<A, E, R>(ref: RefArray<A, E, R>, index: number, f: (a: A) => A) {
  return RefSubject.update(ref, (values) =>
    Option.getOrElse(ReadonlyArray.modify(values, index, f), () => values),
  );
});

/**
 * Partition the values of a RefArray using a predicate.
 * @remarks
 * ## Why
 *
 * Partition the values of a RefArray using a predicate. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The partition view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const partition: {
  <A, B extends A>(
    predicate: (a: A) => a is B,
  ): <E, R>(
    ref: RefArray<A, E, R>,
  ) => RefSubject.Computed<R, E, readonly [ReadonlyArray<B>, ReadonlyArray<A>]>;
  <A, E, R>(
    ref: RefArray<A, E, R>,
    predicate: (a: A) => boolean,
  ): RefSubject.Computed<never, E, readonly [ReadonlyArray<A>, ReadonlyArray<A>]>;
} = dual(2, function partition<A, E, R>(ref: RefArray<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, (array) =>
    ReadonlyArray.partition(array, Result.liftPredicate(predicate, Result.fail)),
  );
});

/**
 * Reduce the values of a RefArray to a single value.
 * @remarks
 * ## Why
 *
 * Makes reduce a live projection of the array; consumers can sample it now or observe it without
 * copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The reduce view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const reduce: {
  <A, B>(
    b: B,
    f: (b: B, a: A, index: number) => B,
  ): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<B, E, R>;
  <A, E, R, B>(
    ref: RefArray<A, E, R>,
    b: B,
    f: (b: B, a: A, index: number) => B,
  ): RefSubject.Computed<B, E, R>;
} = dual(3, function reduce<
  A,
  E,
  R,
  B,
>(ref: RefArray<A, E, R>, b: B, f: (b: B, a: A, index: number) => B) {
  return RefSubject.map(ref, ReadonlyArray.reduce(b, f));
});

/**
 * Reduce the values of a RefArray to a single value in reverse order.
 * @remarks
 * ## Why
 *
 * Makes reduce right a live projection of the array; consumers can sample it now or observe it
 * without copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The reduce right view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const reduceRight: {
  <A, B>(
    b: B,
    f: (b: B, a: A, index: number) => B,
  ): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<B, E, R>;
  <A, E, R, B>(
    ref: RefArray<A, E, R>,
    b: B,
    f: (b: B, a: A, index: number) => B,
  ): RefSubject.Computed<B, E, R>;
} = dual(3, function reduceRight<
  A,
  E,
  R,
  B,
>(ref: RefArray<A, E, R>, b: B, f: (b: B, a: A, index: number) => B) {
  return RefSubject.map(ref, ReadonlyArray.reduceRight(b, f));
});

/**
 * Replace a value at a particular index of a RefArray.
 * @remarks
 * ## Why
 *
 * Keeps replace at atomic with respect to competing RefSubject writes instead of splitting the
 * read and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running replace at performs one serialized array transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const replaceAt: {
  <A>(index: number, a: A): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>;
  <A, E, R>(ref: RefArray<A, E, R>, index: number, a: A): Effect.Effect<ReadonlyArray<A>, E, R>;
} = dual(3, function replaceAt<A, E, R>(ref: RefArray<A, E, R>, index: number, a: A) {
  return RefSubject.update(ref, (values) =>
    Option.getOrElse(ReadonlyArray.replace(values, index, a), () => values),
  );
});

/**
 * Rotate the values of a RefArray by `n` places. Helpful for things like carousels.
 * @remarks
 * ## Why
 *
 * Derives the reordered array through its Effect collection operation while retaining RefSubject
 * equality and version tracking.
 *
 * ## Ownership and lifetime
 *
 * Running rotate performs one serialized array transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const rotate: {
  (n: number): <A, E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>;
  <A, E, R>(ref: RefArray<A, E, R>, n: number): Effect.Effect<ReadonlyArray<A>, E, R>;
} = dual(2, function rotate<A, E, R>(ref: RefArray<A, E, R>, n: number) {
  return RefSubject.update(ref, ReadonlyArray.rotate(n));
});

/**
 * Sort the values of a RefArray using a provided Order.
 * @remarks
 * ## Why
 *
 * Derives the reordered array through its Effect collection operation while retaining RefSubject
 * equality and version tracking.
 *
 * ## Ownership and lifetime
 *
 * Running sort by performs one serialized array transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const sortBy: {
  <A>(
    orders: Iterable<Order.Order<A>>,
  ): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>;
  <A, E, R>(
    ref: RefArray<A, E, R>,
    orders: Iterable<Order.Order<A>>,
  ): Effect.Effect<ReadonlyArray<A>, E, R>;
} = dual(2, function sortBy<A, E, R>(ref: RefArray<A, E, R>, orders: Iterable<Order.Order<A>>) {
  return RefSubject.update(ref, ReadonlyArray.sortBy(...orders));
});

/**
 * Take the first `n` values from a RefArray.
 * @remarks
 * ## Why
 *
 * Applies take to the committed array value and publishes only the result, preserving its element
 * order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running take performs one serialized array transition and resolves with its committed value. It
 * acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const take: {
  (n: number): <A, E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>;
  <A, E, R>(ref: RefArray<A, E, R>, n: number): Effect.Effect<ReadonlyArray<A>, E, R>;
} = dual(2, function take<A, E, R>(ref: RefArray<A, E, R>, n: number) {
  return RefSubject.update(ref, ReadonlyArray.take(n));
});

/**
 * Take the last `n` values from a RefArray.
 * @remarks
 * ## Why
 *
 * Applies take right to the committed array value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running take right performs one serialized array transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const takeRight: {
  (n: number): <A, E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>;
  <A, E, R>(ref: RefArray<A, E, R>, n: number): Effect.Effect<ReadonlyArray<A>, E, R>;
} = dual(2, function takeRight<A, E, R>(ref: RefArray<A, E, R>, n: number) {
  return RefSubject.update(ref, ReadonlyArray.takeRight(n));
});

/**
 * Take values from a RefArray while a predicate is true.
 * @remarks
 * ## Why
 *
 * Applies take while to the committed array value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running take while performs one serialized array transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const takeWhile: {
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>;
  <A, E, R>(
    ref: RefArray<A, E, R>,
    predicate: (a: unknown) => boolean,
  ): Effect.Effect<ReadonlyArray<A>, E, R>;
} = dual(2, function takeWhile<
  A,
  E,
  R,
>(ref: RefArray<A, E, R>, predicate: (a: unknown) => boolean) {
  return RefSubject.update(ref, ReadonlyArray.takeWhile(predicate));
});

/**
 * Remove any duplicate values from a RefArray.
 * @remarks
 * ## Why
 *
 * Derives the reordered array through its Effect collection operation while retaining RefSubject
 * equality and version tracking.
 *
 * ## Ownership and lifetime
 *
 * Running dedupe with performs one serialized array transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const dedupeWith =
  <A>(valueEq: Equivalence<A>) =>
  <E, R>(ref: RefArray<A, E, R>): Effect.Effect<ReadonlyArray<A>, E, R> =>
    RefSubject.update(ref, ReadonlyArray.dedupeWith(valueEq));

/**
 * Gets the last element of a `RefArray` as a `Filtered`.
 *
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of last as Filtered state, so absence stays explicit while
 * later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The last view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefArray from "@typed/fx/RefArray"
 *
 * const program = Effect.gen(function* () {
 *   const items = yield* RefArray.make([1, 2, 3, 4, 5])
 *
 *   const last = RefArray.last(items)
 *   const value = yield* last
 *   console.log(value) // 5
 *
 *   // If array becomes empty, Filtered will fail
 *   yield* RefArray.set(items, [])
 *   // yield* last would fail with NoSuchElementError
 * })
 * ```
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const last = <A, E, R>(ref: RefArray<A, E, R>): RefSubject.Filtered<A, E, R> =>
  RefSubject.filterMap(ref, ReadonlyArray.last);

/**
 * Gets the first element of a `RefArray` as a `Filtered`.
 *
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of head as Filtered state, so absence stays explicit while
 * later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The head view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefArray from "@typed/fx/RefArray"
 *
 * const program = Effect.gen(function* () {
 *   const items = yield* RefArray.make([1, 2, 3, 4, 5])
 *
 *   const head = RefArray.head(items)
 *   const value = yield* head
 *   console.log(value) // 1
 *
 *   // If array becomes empty, Filtered will fail
 *   yield* RefArray.set(items, [])
 *   // yield* head would fail with NoSuchElementError
 * })
 * ```
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const head = <A, E, R>(ref: RefArray<A, E, R>): RefSubject.Filtered<A, E, R> =>
  RefSubject.filterMap(ref, ReadonlyArray.head);
