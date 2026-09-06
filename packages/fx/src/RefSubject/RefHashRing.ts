/**
 * Extensions to RefSubject for working with HashRing values
 * @since 1.18.0
 */

import type * as Effect from "effect/Effect";
import { equals } from "effect/Equal";
import { dual } from "effect/Function";
import * as HashRing from "effect/HashRing";
import * as Option from "effect/Option";
import type * as PrimaryKey from "effect/PrimaryKey";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

/**
 * A RefHashRing is a RefSubject specialized over a HashRing.
 * @remarks
 * ## Why
 *
 * Defines hash ring state with the same current-read, pushed-update, and synchronized-write
 * contract as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefHashRing is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefHashRing<
  in out A extends PrimaryKey.PrimaryKey,
  in out E = never,
  out R = never,
> extends RefSubject.RefSubject<HashRing.HashRing<A>, E, R> {}

/**
 * Creates a new `RefHashRing` from a HashRing, `Effect`, or `Fx`.
 * @remarks
 * ## Why
 *
 * Creates hash ring state with equality suited to that Effect data type, so unchanged values do
 * not produce redundant pushed updates.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope. It owns initializer acquisition, live source subscriptions,
 * and cleanup; source failures and services stay on reads and pushes.
 *
 * @since 1.18.0
 * @category Constructors
 */
export function make<A extends PrimaryKey.PrimaryKey, E = never, R = never>(
  initial:
    | HashRing.HashRing<A>
    | Effect.Effect<HashRing.HashRing<A>, E, R>
    | Fx.Fx<HashRing.HashRing<A>, E, R>,
): Effect.Effect<RefHashRing<A, E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq: equals });
}

/**
 * Creates a new empty RefHashRing.
 * @remarks
 * ## Why
 *
 * Creates a new empty RefHashRing. The operation remains attached to the RefSubject's versioned
 * state boundary.
 *
 * ## Ownership and lifetime
 *
 * Running empty performs one serialized hash ring transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category Constructors
 */
export function empty<A extends PrimaryKey.PrimaryKey, E = never, R = never>(options?: {
  readonly baseWeight?: number;
}): Effect.Effect<RefHashRing<A, E>, never, R | Scope.Scope> {
  return RefSubject.make(HashRing.make<A>(options), { eq: equals });
}

// Helper to copy a HashRing before mutation
function copyRing<A extends PrimaryKey.PrimaryKey>(
  ring: HashRing.HashRing<A>,
): HashRing.HashRing<A> {
  const newRing = HashRing.make<A>({ baseWeight: ring.baseWeight });
  return HashRing.addMany(newRing, ring);
}

// ========================================
// Combinators
// ========================================

/**
 * Add a node to the HashRing.
 * @remarks
 * ## Why
 *
 * Add a node to the HashRing. The operation remains attached to the RefSubject's versioned state
 * boundary.
 *
 * ## Ownership and lifetime
 *
 * Running add performs one serialized hash ring transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const add: {
  <A extends PrimaryKey.PrimaryKey>(
    node: A,
    options?: { readonly weight?: number },
  ): <E, R>(ref: RefHashRing<A, E, R>) => Effect.Effect<HashRing.HashRing<A>, E, R>;
  <A extends PrimaryKey.PrimaryKey, E, R>(
    ref: RefHashRing<A, E, R>,
    node: A,
    options?: { readonly weight?: number },
  ): Effect.Effect<HashRing.HashRing<A>, E, R>;
} = dual(
  (args) => RefSubject.isRefSubject(args[0]),
  function add<A extends PrimaryKey.PrimaryKey, E, R>(
    ref: RefHashRing<A, E, R>,
    node: A,
    options?: { readonly weight?: number },
  ) {
    return RefSubject.update(ref, (ring) => HashRing.add(copyRing(ring), node, options));
  },
);

/**
 * Add multiple nodes to the HashRing.
 * @remarks
 * ## Why
 *
 * Add multiple nodes to the HashRing. The operation remains attached to the RefSubject's versioned
 * state boundary.
 *
 * ## Ownership and lifetime
 *
 * Running add many performs one serialized hash ring transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const addMany: {
  <A extends PrimaryKey.PrimaryKey>(
    nodes: Iterable<A>,
    options?: { readonly weight?: number },
  ): <E, R>(ref: RefHashRing<A, E, R>) => Effect.Effect<HashRing.HashRing<A>, E, R>;
  <A extends PrimaryKey.PrimaryKey, E, R>(
    ref: RefHashRing<A, E, R>,
    nodes: Iterable<A>,
    options?: { readonly weight?: number },
  ): Effect.Effect<HashRing.HashRing<A>, E, R>;
} = dual(
  (args) => RefSubject.isRefSubject(args[0]),
  function addMany<A extends PrimaryKey.PrimaryKey, E, R>(
    ref: RefHashRing<A, E, R>,
    nodes: Iterable<A>,
    options?: { readonly weight?: number },
  ) {
    return RefSubject.update(ref, (ring) => HashRing.addMany(copyRing(ring), nodes, options));
  },
);

/**
 * Remove a node from the HashRing.
 * @remarks
 * ## Why
 *
 * Applies remove to the committed hash ring value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running remove performs one serialized hash ring transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const remove: {
  <A extends PrimaryKey.PrimaryKey>(
    node: A,
  ): <E, R>(ref: RefHashRing<A, E, R>) => Effect.Effect<HashRing.HashRing<A>, E, R>;
  <A extends PrimaryKey.PrimaryKey, E, R>(
    ref: RefHashRing<A, E, R>,
    node: A,
  ): Effect.Effect<HashRing.HashRing<A>, E, R>;
} = dual(2, function remove<
  A extends PrimaryKey.PrimaryKey,
  E,
  R,
>(ref: RefHashRing<A, E, R>, node: A) {
  return RefSubject.update(ref, (ring) => HashRing.remove(copyRing(ring), node));
});

// ========================================
// Computed
// ========================================

/**
 * Check if a node exists in the HashRing.
 * @remarks
 * ## Why
 *
 * Makes has a live projection of the hash ring; consumers can sample it now or observe it without
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
  <A extends PrimaryKey.PrimaryKey>(
    node: A,
  ): <E, R>(ref: RefHashRing<A, E, R>) => RefSubject.Computed<boolean, E, R>;
  <A extends PrimaryKey.PrimaryKey, E, R>(
    ref: RefHashRing<A, E, R>,
    node: A,
  ): RefSubject.Computed<boolean, E, R>;
} = dual(2, function has<
  A extends PrimaryKey.PrimaryKey,
  E,
  R,
>(ref: RefHashRing<A, E, R>, node: A) {
  return RefSubject.map(ref, HashRing.has(node));
});

/**
 * Get the number of nodes in the HashRing.
 * @remarks
 * ## Why
 *
 * Makes size a live projection of the hash ring; consumers can sample it now or observe it without
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
export const size = <A extends PrimaryKey.PrimaryKey, E, R>(
  ref: RefHashRing<A, E, R>,
): RefSubject.Computed<number, E, R> => RefSubject.map(ref, (ring) => ring.nodes.size);

/**
 * Check if the HashRing is empty.
 * @remarks
 * ## Why
 *
 * Makes is empty a live projection of the hash ring; consumers can sample it now or observe it
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
export const isEmpty = <A extends PrimaryKey.PrimaryKey, E, R>(
  ref: RefHashRing<A, E, R>,
): RefSubject.Computed<boolean, E, R> => RefSubject.map(ref, (ring) => ring.nodes.size === 0);

/**
 * Get the node which should handle a given input string as a Computed.
 * Returns undefined if the ring is empty.
 * @remarks
 * ## Why
 *
 * Projects the selected node for current reads and later pushes. An empty ring is represented by
 * `undefined` inside the Computed value; it does not become Filtered or add `NoSuchElementError`.
 *
 * ## Ownership and lifetime
 *
 * The get node view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const getNode: {
  (
    input: string,
  ): <A extends PrimaryKey.PrimaryKey, E, R>(
    ref: RefHashRing<A, E, R>,
  ) => RefSubject.Computed<A | undefined, E, R>;
  <A extends PrimaryKey.PrimaryKey, E, R>(
    ref: RefHashRing<A, E, R>,
    input: string,
  ): RefSubject.Computed<A | undefined, E, R>;
} = dual(2, function getNode<
  A extends PrimaryKey.PrimaryKey,
  E,
  R,
>(ref: RefHashRing<A, E, R>, input: string) {
  return RefSubject.map(ref, (ring) => HashRing.get(ring, input));
});

/**
 * Get shard distribution across nodes.
 * @remarks
 * ## Why
 *
 * Projects the shard distribution for current reads and later pushes. An empty ring is represented
 * by `undefined` inside the Computed value; it does not become Filtered or add
 * `NoSuchElementError`.
 *
 * ## Ownership and lifetime
 *
 * The get shards view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const getShards: {
  (
    count: number,
  ): <A extends PrimaryKey.PrimaryKey, E, R>(
    ref: RefHashRing<A, E, R>,
  ) => RefSubject.Computed<Array<A> | undefined, E, R>;
  <A extends PrimaryKey.PrimaryKey, E, R>(
    ref: RefHashRing<A, E, R>,
    count: number,
  ): RefSubject.Computed<Array<A> | undefined, E, R>;
} = dual(2, function getShards<
  A extends PrimaryKey.PrimaryKey,
  E,
  R,
>(ref: RefHashRing<A, E, R>, count: number) {
  return RefSubject.map(ref, (ring) => HashRing.getShards(ring, count));
});

/**
 * Get all nodes as an array.
 * @remarks
 * ## Why
 *
 * Projects hash ring state with values for both current reads and future pushes, avoiding a second
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
export const values = <A extends PrimaryKey.PrimaryKey, E, R>(
  ref: RefHashRing<A, E, R>,
): RefSubject.Computed<Array<A>, E, R> => RefSubject.map(ref, (ring) => Array.from(ring));

// ========================================
// Filtered
// ========================================

/**
 * Get the node which should handle a given input string as a Filtered.
 * Fails if the ring is empty.
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of get as Filtered state, so absence stays explicit while
 * later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The get view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const get: {
  (
    input: string,
  ): <A extends PrimaryKey.PrimaryKey, E, R>(
    ref: RefHashRing<A, E, R>,
  ) => RefSubject.Filtered<A, E, R>;
  <A extends PrimaryKey.PrimaryKey, E, R>(
    ref: RefHashRing<A, E, R>,
    input: string,
  ): RefSubject.Filtered<A, E, R>;
} = dual(2, function get<
  A extends PrimaryKey.PrimaryKey,
  E,
  R,
>(ref: RefHashRing<A, E, R>, input: string) {
  return RefSubject.filterMap(ref, (ring) => Option.fromUndefinedOr(HashRing.get(ring, input)));
});
