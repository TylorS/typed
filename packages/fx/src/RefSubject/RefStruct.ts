/**
 * Extensions to RefSubject for working with struct values
 * @since 1.18.0
 */

import type * as Effect from "effect/Effect";
import { equals } from "effect/Equal";
import * as Equivalence_ from "effect/Equivalence";
import type { Equivalence } from "effect/Equivalence";
import { dual } from "effect/Function";
import type * as Scope from "effect/Scope";
import * as Struct from "effect/Struct";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

/**
 * A RefStruct is a RefSubject specialized over a struct value.
 * @remarks
 * ## Why
 *
 * Defines struct state with the same current-read, pushed-update, and synchronized-write contract
 * as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefStruct is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefStruct<
  in out S extends object,
  in out E = never,
  out R = never,
> extends RefSubject.RefSubject<S, E, R> {}

/**
 * Creates a new `RefStruct` from a struct, `Effect`, or `Fx`.
 *
 * @remarks
 * ## Why
 *
 * Creates struct state with equality suited to that Effect data type, so unchanged values do not
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
 * import * as RefStruct from "@typed/fx/RefStruct"
 *
 * const program = Effect.gen(function* () {
 *   const value = yield* RefStruct.make({ name: "John", age: 30 })
 *   const current = yield* value
 *   console.log(current) // { name: "John", age: 30 }
 * })
 * ```
 *
 * @since 1.18.0
 * @category Constructors
 */
export function make<S extends object, E = never, R = never>(
  initial: S | Effect.Effect<S, E, R> | Fx.Fx<S, E, R>,
  eq: Equivalence<S> = Equivalence_.make((a, b) => equals(a, b)),
): Effect.Effect<RefStruct<S, E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq });
}

/**
 * Set a property value in the current state of a RefStruct.
 * @remarks
 * ## Why
 *
 * Keeps set atomic with respect to competing RefSubject writes instead of splitting the read and
 * replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running set performs one serialized struct transition and resolves with its committed value. It
 * acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const set: {
  <S extends object, K extends keyof S>(
    key: K,
    value: S[K],
  ): <E, R>(ref: RefStruct<S, E, R>) => Effect.Effect<S, E, R>;
  <S extends object, K extends keyof S, E, R>(
    ref: RefStruct<S, E, R>,
    key: K,
    value: S[K],
  ): Effect.Effect<S, E, R>;
} = dual(3, function set<
  S extends object,
  K extends keyof S,
  E,
  R,
>(ref: RefStruct<S, E, R>, key: K, value: S[K]) {
  return RefSubject.update(
    ref,
    (self) => Struct.assign(self, { [key]: value } as unknown as Partial<S>) as S,
  );
});

/**
 * Update a property value in the current state of a RefStruct using a function.
 * @remarks
 * ## Why
 *
 * Keeps update atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running update performs one serialized struct transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const update: {
  <S extends object, K extends keyof S>(
    key: K,
    f: (value: S[K]) => S[K],
  ): <E, R>(ref: RefStruct<S, E, R>) => Effect.Effect<S, E, R>;
  <S extends object, K extends keyof S, E, R>(
    ref: RefStruct<S, E, R>,
    key: K,
    f: (value: S[K]) => S[K],
  ): Effect.Effect<S, E, R>;
} = dual(3, function update<
  S extends object,
  K extends keyof S,
  E,
  R,
>(ref: RefStruct<S, E, R>, key: K, f: (value: S[K]) => S[K]) {
  return RefSubject.update(ref, (self) => Struct.evolve(self, { [key]: f } as any) as S);
});

/**
 * Merge another struct into the current state of a RefStruct.
 * @remarks
 * ## Why
 *
 * Combines bulk struct changes in one committed value, giving subscribers one coherent update
 * rather than a partially applied sequence.
 *
 * ## Ownership and lifetime
 *
 * Running merge performs one serialized struct transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const merge: {
  <O extends object>(
    that: O,
  ): <S extends object, E, R>(ref: RefStruct<S, E, R>) => Effect.Effect<S, E, R>;
  <S extends object, O extends object, E, R>(
    ref: RefStruct<S, E, R>,
    that: O,
  ): Effect.Effect<S, E, R>;
} = dual(2, function merge<
  S extends object,
  O extends object,
  E,
  R,
>(ref: RefStruct<S, E, R>, that: O) {
  return RefSubject.update(ref, (self) => Struct.assign(self, that) as S);
});

// ========================================
// Computed
// ========================================

/**
 * Pick properties from the current state of a RefStruct.
 * @remarks
 * ## Why
 *
 * Projects struct state with pick for both current reads and future pushes, avoiding a second
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
  <S extends object, const Keys extends ReadonlyArray<keyof S>>(
    keys: Keys,
  ): <E, R>(ref: RefStruct<S, E, R>) => RefSubject.Computed<Pick<S, Keys[number]>, E, R>;
  <S extends object, const Keys extends ReadonlyArray<keyof S>, E, R>(
    ref: RefStruct<S, E, R>,
    keys: Keys,
  ): RefSubject.Computed<Pick<S, Keys[number]>, E, R>;
} = dual(2, function pick<
  S extends object,
  const Keys extends ReadonlyArray<keyof S>,
  E,
  R,
>(ref: RefStruct<S, E, R>, keys: Keys) {
  return RefSubject.map(ref, (self) => Struct.pick(self, keys));
});

/**
 * Omit properties from the current state of a RefStruct.
 * @remarks
 * ## Why
 *
 * Projects struct state with omit for both current reads and future pushes, avoiding a second
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
  <S extends object, const Keys extends ReadonlyArray<keyof S>>(
    keys: Keys,
  ): <E, R>(ref: RefStruct<S, E, R>) => RefSubject.Computed<Omit<S, Keys[number]>, E, R>;
  <S extends object, const Keys extends ReadonlyArray<keyof S>, E, R>(
    ref: RefStruct<S, E, R>,
    keys: Keys,
  ): RefSubject.Computed<Omit<S, Keys[number]>, E, R>;
} = dual(2, function omit<
  S extends object,
  const Keys extends ReadonlyArray<keyof S>,
  E,
  R,
>(ref: RefStruct<S, E, R>, keys: Keys) {
  return RefSubject.map(ref, (self) => Struct.omit(self, keys));
});

/**
 * Get a property value from the current state of a RefStruct.
 * @remarks
 * ## Why
 *
 * Projects a known property as Computed state, so current reads and future pushes stay linked to
 * the struct without copying that field into a second store.
 *
 * ## Ownership and lifetime
 *
 * The get view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as RefStruct from "@typed/fx/RefStruct"
 *
 * const program = Effect.scoped(Effect.gen(function* () {
 *   const account = yield* RefStruct.make({ name: "Ada", active: true })
 *   const name = RefStruct.get(account, "name")
 *   return yield* name
 * }))
 * ```
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const get: {
  <S extends object, const K extends keyof S>(
    key: K,
  ): <E, R>(ref: RefStruct<S, E, R>) => RefSubject.Computed<S[K], E, R>;
  <S extends object, const K extends keyof S, E, R>(
    ref: RefStruct<S, E, R>,
    key: K,
  ): RefSubject.Computed<S[K], E, R>;
} = dual(2, function get<
  S extends object,
  const K extends keyof S,
  E,
  R,
>(ref: RefStruct<S, E, R>, key: K) {
  return RefSubject.map(ref, (self) => Struct.get(self, key));
});

/**
 * Get the keys of the current state of a RefStruct.
 * @remarks
 * ## Why
 *
 * Projects struct state with keys for both current reads and future pushes, avoiding a second
 * mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The keys view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const keys = <S extends object, E, R>(
  ref: RefStruct<S, E, R>,
): RefSubject.Computed<Array<keyof S & string>, E, R> => RefSubject.map(ref, Struct.keys);

/**
 * Get the values of the current state of a RefStruct.
 * @remarks
 * ## Why
 *
 * Projects struct state with values for both current reads and future pushes, avoiding a second
 * mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The values view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const values = <S extends object, E, R>(
  ref: RefStruct<S, E, R>,
): RefSubject.Computed<Array<S[keyof S]>, E, R> =>
  RefSubject.map(ref, (self) => Object.values(self) as Array<S[keyof S]>);

/**
 * Get the entries of the current state of a RefStruct.
 * @remarks
 * ## Why
 *
 * Projects struct state with entries for both current reads and future pushes, avoiding a second
 * mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The entries view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const entries = <S extends object, E, R>(
  ref: RefStruct<S, E, R>,
): RefSubject.Computed<Array<[keyof S, S[keyof S]]>, E, R> =>
  RefSubject.map(ref, (self) => Object.entries(self) as Array<[keyof S, S[keyof S]]>);

/**
 * Check if the current state of a RefStruct has a property.
 * @remarks
 * ## Why
 *
 * Makes has a live projection of the struct; consumers can sample it now or observe it without
 * copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The has view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const has: {
  <S extends object, const K extends keyof S>(
    key: K,
  ): <E, R>(ref: RefStruct<S, E, R>) => RefSubject.Computed<boolean, E, R>;
  <S extends object, const K extends keyof S, E, R>(
    ref: RefStruct<S, E, R>,
    key: K,
  ): RefSubject.Computed<boolean, E, R>;
} = dual(2, function has<
  S extends object,
  const K extends keyof S,
  E,
  R,
>(ref: RefStruct<S, E, R>, key: K) {
  return RefSubject.map(ref, (self) => key in self);
});

/**
 * Get the size (number of properties) of the current state of a RefStruct.
 * @remarks
 * ## Why
 *
 * Makes size a live projection of the struct; consumers can sample it now or observe it without
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
export const size = <S extends object, E, R>(
  ref: RefStruct<S, E, R>,
): RefSubject.Computed<number, E, R> => RefSubject.map(ref, (self) => Object.keys(self).length);
