import * as Equal from "effect/Equal";
import type * as Equivalence from "effect/Equivalence";
import { identity } from "effect/Function";

/** An immutable, ordered collection of keyed collection changes.
 *
 * @remarks
 * ## Why
 *
 * Materializing the changes lets a caller inspect or batch the complete transition before applying
 * it. The array contains removals in old-index order followed by additions, moves, and in-place
 * updates in new-index order.
 *
 * ## Ownership and lifetime
 *
 * The array and records are newly allocated values. They acquire no Scope and retain only the
 * values and keys placed in each record.
 *
 * @since 1.0.0
 * @category models
 * @stability internal-but-published
 */
export type DiffResult<A, B> = ReadonlyArray<Diff<A, B>>;

/** A single keyed collection change produced by `diff` or `diffIterator`.
 *
 * @remarks
 * ## Why
 *
 * The discriminated union makes structural changes exhaustive without requiring a renderer or
 * collection implementation. Indices refer to the original array for removals and move sources,
 * and to the new array for additions, updates, and move destinations.
 *
 * ## Ownership and lifetime
 *
 * A change record is inert data with no services, cleanup, or retained resources beyond its value
 * and key.
 *
 * @since 1.0.0
 * @category models
 * @stability internal-but-published
 */
export type Diff<A, B> = Add<A, B> | Remove<A, B> | Update<A, B> | Moved<A, B>;

/** Describes a key that is present only in the new array.
 *
 * @remarks
 * ## Why
 *
 * Additions carry the new value, destination index, and identity key so a consumer can allocate
 * exactly one keyed lifetime at the correct position.
 *
 * ## Ownership and lifetime
 *
 * This immutable record acquires no resources.
 *
 * @example
 * ```ts
 * import type { Add } from "@typed/fx/Fx/internal/diff"
 *
 * const patch: Add<string, string> = { _tag: "Add", value: "A", index: 0, key: "a" }
 * ```
 *
 * @since 1.0.0
 * @category models
 * @stability internal-but-published
 */
export interface Add<A, B> {
  /** Discriminates an addition from the other patch variants.
   *
   * @remarks
   * ## Why
   * Enables exhaustive change dispatch without inspecting indices or values.
   *
   * ## Ownership and lifetime
   * Immutable string metadata retained by the record.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly _tag: "Add";
  /** Index occupied by the value in the new array.
   *
   * @remarks
   * ## Why
   * Identifies the destination for the newly allocated keyed lifetime.
   *
   * ## Ownership and lifetime
   * Immutable numeric metadata with no resources.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly index: number;
  /** Value from the new array.
   *
   * @remarks
   * ## Why
   * Supplies the payload from which a consumer initializes the new keyed state.
   *
   * ## Ownership and lifetime
   * The record retains this reference but does not otherwise own it.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly value: A;
  /** Identity returned by `getKey`.
   *
   * @remarks
   * ## Why
   * Associates allocation with the stable identity used by subsequent transitions.
   *
   * ## Ownership and lifetime
   * The record retains this key but acquires no resource.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly key: B;
}

/** Constructs an immutable `Add` change record.
 *
 * @remarks
 * ## Why
 *
 * Central construction keeps the discriminant and index meaning consistent for diff consumers.
 *
 * ## Ownership and lifetime
 *
 * Allocates one plain object and acquires no services or Scope.
 *
 * @example
 * ```ts
 * import { add } from "@typed/fx/Fx/internal/diff"
 *
 * const patch = add({ id: "a" }, 0, "a")
 * ```
 *
 * @since 1.0.0
 * @category constructors
 * @stability internal-but-published
 */
export const add = <A, B>(value: A, index: number, key: B): Add<A, B> => ({
  _tag: "Add",
  index,
  value,
  key,
});

/** Describes a key that is present only in the old array.
 *
 * @remarks
 * ## Why
 *
 * Removals retain the old value and index so consumers can close the exact keyed lifetime that no
 * longer appears in the new collection.
 *
 * ## Ownership and lifetime
 *
 * This immutable record performs no cleanup itself and acquires no resources.
 *
 * @example
 * ```ts
 * import type { Remove } from "@typed/fx/Fx/internal/diff"
 *
 * const patch: Remove<string, string> = { _tag: "Remove", value: "A", index: 0, key: "a" }
 * ```
 *
 * @since 1.0.0
 * @category models
 * @stability internal-but-published
 */
export interface Remove<A, B> {
  /** Discriminates a removal from the other patch variants.
   *
   * @remarks
   * ## Why
   * Enables exhaustive change dispatch and directs the consumer to cleanup.
   *
   * ## Ownership and lifetime
   * Immutable string metadata retained by the record.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly _tag: "Remove";
  /** Index occupied by the value in the old array.
   *
   * @remarks
   * ## Why
   * Locates the keyed state before the structural transition is applied.
   *
   * ## Ownership and lifetime
   * Immutable numeric metadata with no resources.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly index: number;
  /** Value from the old array.
   *
   * @remarks
   * ## Why
   * Preserves the removed payload for cleanup or auditing logic.
   *
   * ## Ownership and lifetime
   * The record retains this reference but does not perform its cleanup.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly value: A;
  /** Identity returned by `getKey`.
   *
   * @remarks
   * ## Why
   * Selects the exact keyed lifetime that must be removed.
   *
   * ## Ownership and lifetime
   * The record retains this key but acquires no resource.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly key: B;
}

/** Constructs an immutable `Remove` change record.
 *
 * @remarks
 * ## Why
 *
 * Central construction preserves the old-index convention expected by keyed consumers.
 *
 * ## Ownership and lifetime
 *
 * Allocates one plain object and acquires no services or Scope.
 *
 * @example
 * ```ts
 * import { remove } from "@typed/fx/Fx/internal/diff"
 *
 * const patch = remove({ id: "a" }, 0, "a")
 * ```
 *
 * @since 1.0.0
 * @category constructors
 * @stability internal-but-published
 */
export const remove = <A, B>(value: A, index: number, key: B): Remove<A, B> => ({
  _tag: "Remove",
  index,
  value,
  key,
});

/** Describes a key that stayed at one index but whose value is not equivalent.
 *
 * @remarks
 * ## Why
 *
 * An in-place update lets consumers preserve identity and lifetime while publishing the new value
 * to the existing keyed state.
 *
 * ## Ownership and lifetime
 *
 * This immutable record performs no mutation itself and acquires no resources.
 *
 * @example
 * ```ts
 * import type { Update } from "@typed/fx/Fx/internal/diff"
 *
 * const patch: Update<number, string> = { _tag: "Update", value: 2, index: 0, key: "a" }
 * ```
 *
 * @since 1.0.0
 * @category models
 * @stability internal-but-published
 */
export interface Update<A, B> {
  /** Discriminates an in-place update from the other patch variants.
   *
   * @remarks
   * ## Why
   * Directs consumers to publish a new value without reallocating keyed state.
   *
   * ## Ownership and lifetime
   * Immutable string metadata retained by the record.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly _tag: "Update";
  /** Shared index in the old and new arrays.
   *
   * @remarks
   * ## Why
   * Confirms that identity remained at one position and only its value changed.
   *
   * ## Ownership and lifetime
   * Immutable numeric metadata with no resources.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly index: number;
  /** Value from the new array.
   *
   * @remarks
   * ## Why
   * Supplies the replacement payload for the existing keyed state.
   *
   * ## Ownership and lifetime
   * The record retains this reference but does not otherwise own it.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly value: A;
  /** Identity returned by `getKey`.
   *
   * @remarks
   * ## Why
   * Selects the exact keyed state that receives the new value.
   *
   * ## Ownership and lifetime
   * The record retains this key but acquires no resource.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly key: B;
}

/** Constructs an immutable `Update` change record.
 *
 * @remarks
 * ## Why
 *
 * Central construction preserves the shared-index convention expected by keyed consumers.
 *
 * ## Ownership and lifetime
 *
 * Allocates one plain object and acquires no services or Scope.
 *
 * @example
 * ```ts
 * import { update } from "@typed/fx/Fx/internal/diff"
 *
 * const patch = update({ id: "a", value: 2 }, 0, "a")
 * ```
 *
 * @since 1.0.0
 * @category constructors
 * @stability internal-but-published
 */
export const update = <A, B>(value: A, index: number, key: B): Update<A, B> => ({
  _tag: "Update",
  index,
  value,
  key,
});

/** Describes a key whose index changed between the old and new arrays.
 *
 * @remarks
 * ## Why
 *
 * Moves preserve keyed identity across reordering. The record carries the new value even when that
 * value also changed; a moved key does not produce a separate `Update` record.
 *
 * ## Ownership and lifetime
 *
 * This immutable record moves nothing by itself and acquires no resources.
 *
 * @example
 * ```ts
 * import type { Moved } from "@typed/fx/Fx/internal/diff"
 *
 * const patch: Moved<string, string> = {
 *   _tag: "Moved", value: "A", index: 0, to: 1, key: "a"
 * }
 * ```
 *
 * @since 1.0.0
 * @category models
 * @stability internal-but-published
 */
export interface Moved<A, B> {
  /** Discriminates a move from the other patch variants.
   *
   * @remarks
   * ## Why
   * Directs consumers to preserve the keyed lifetime while changing position.
   *
   * ## Ownership and lifetime
   * Immutable string metadata retained by the record.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly _tag: "Moved";
  /** Index occupied by the key in the old array.
   *
   * @remarks
   * ## Why
   * Locates the existing keyed state before reordering.
   *
   * ## Ownership and lifetime
   * Immutable numeric metadata with no resources.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly index: number;
  /** Index occupied by the key in the new array.
   *
   * @remarks
   * ## Why
   * Names the destination while keeping the source index separately available.
   *
   * ## Ownership and lifetime
   * Immutable numeric metadata with no resources.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly to: number;
  /** Value from the new array.
   *
   * @remarks
   * ## Why
   * Allows one move record to carry a simultaneously changed payload.
   *
   * ## Ownership and lifetime
   * The record retains this reference but does not otherwise own it.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly value: A;
  /** Identity returned by `getKey`.
   *
   * @remarks
   * ## Why
   * Preserves stable identity across the positional transition.
   *
   * ## Ownership and lifetime
   * The record retains this key but acquires no resource.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly key: B;
}

/** Constructs an immutable `Moved` change record.
 *
 * @remarks
 * ## Why
 *
 * Central construction keeps source and destination index meanings explicit.
 *
 * ## Ownership and lifetime
 *
 * Allocates one plain object and acquires no services or Scope.
 *
 * @example
 * ```ts
 * import { moved } from "@typed/fx/Fx/internal/diff"
 *
 * const patch = moved({ id: "a" }, 0, 1, "a")
 * ```
 *
 * @since 1.0.0
 * @category constructors
 * @stability internal-but-published
 */
export const moved = <A, B>(value: A, from: number, to: number, key: B): Moved<A, B> => ({
  _tag: "Moved",
  index: from,
  to,
  value,
  key,
});

/** Configuration and optional index caches for keyed diffing.
 *
 * @remarks
 * ## Why
 *
 * Callers with an existing key index can avoid rebuilding either map, while callers with structured
 * values can define identity independently from value equivalence.
 *
 * ## Ownership and lifetime
 *
 * `diff` and `diffIterator` borrow the functions and maps for one synchronous traversal. They do
 * not mutate supplied maps. Keys must be unique within each array; duplicate keys overwrite earlier
 * entries in a map and make the resulting changes ambiguous.
 *
 * @since 1.0.0
 * @category models
 * @stability internal-but-published
 */
export type DiffOptions<A, B extends PropertyKey> = {
  /** Extracts the stable identity key for one value.
   *
   * @remarks
   * ## Why
   * Separates collection identity from payload equality and position.
   *
   * ## Ownership and lifetime
   * Borrowed for the synchronous diff traversal and not retained afterward.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly getKey: (a: A) => B;
  /** Determines whether same-key values at the same index require an `Update`.
   *
   * @remarks
   * ## Why
   * Lets domain equality suppress updates without changing key identity.
   *
   * ## Ownership and lifetime
   * Borrowed for the synchronous comparison pass and not retained afterward.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly eq?: Equivalence.Equivalence<A>;
  /** Optional map from old-array keys to old indices.
   *
   * @remarks
   * ## Why
   * Reusing a previous index avoids rebuilding it when the caller already tracks old identity.
   *
   * ## Ownership and lifetime
   * Borrowed read-only for one traversal; the diff does not mutate or retain the map.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly previousKeyMap?: Map<PropertyKey, number> | undefined;
  /** Optional map from new-array keys to new indices.
   *
   * @remarks
   * ## Why
   * Lets callers validate and index new keys once before diffing and applying changes.
   *
   * ## Ownership and lifetime
   * Borrowed read-only for one traversal; the diff does not mutate or retain the map.
   *
   * @since 1.0.0
   * @category fields
   */
  readonly keyMap?: Map<PropertyKey, number> | undefined;
};

/** Computes all additions, removals, moves, and same-index updates between two keyed arrays.
 *
 * @remarks
 * ## Why
 *
 * Key identity lets higher-level operators preserve one child state and lifetime across collection
 * updates rather than reconstructing every item when positions change.
 *
 * ## Ownership and lifetime
 *
 * The function is synchronous and acquires no Scope. Unless supplied, it allocates an index map for
 * each non-empty array plus the result records. Empty-array fast paths allocate only their result
 * records. Supplied maps are borrowed and never mutated.
 *
 * ## Ordering, equality, and complexity
 *
 * Removals are emitted first in old order. The second pass emits additions, moves, and then
 * same-position updates in new order. A moved value is represented only as `Moved`, even when its
 * payload changed. Equality defaults to Effect's structural `Equal.equals`. With valid maps the
 * scan is O(old length + new length); building maps has the same time and space bound. Key
 * extraction and equality costs are additional. Keys must be unique in each array.
 *
 * @example
 * ```ts
 * import { diff } from "@typed/fx/Fx/internal/diff"
 *
 * const changes = diff(
 *   [{ id: "a", value: 1 }, { id: "b", value: 2 }],
 *   [{ id: "b", value: 3 }, { id: "c", value: 4 }],
 *   { getKey: ({ id }) => id }
 * )
 * ```
 *
 * @since 1.0.0
 * @category advanced
 * @stability internal-but-published
 */
export function diff<A extends PropertyKey>(
  oldValue: ReadonlyArray<A>,
  newValue: ReadonlyArray<A>,
  options?: Omit<DiffOptions<A, A>, "getKey">,
): DiffResult<A, A>;

export function diff<A, B extends PropertyKey>(
  oldValue: ReadonlyArray<A>,
  newValue: ReadonlyArray<A>,
  options: DiffOptions<A, B>,
): DiffResult<A, B>;

export function diff<A, B extends PropertyKey>(
  a: ReadonlyArray<A>,
  b: ReadonlyArray<A>,
  options: Partial<DiffOptions<A, B>> = {},
): DiffResult<A, B> {
  const getKey = options.getKey ?? (identity as NonNullable<typeof options.getKey>);

  // Fast-path for empty arrays.
  if (a.length === 0) return b.map((value, i) => add(value, i, getKey(value)));
  if (b.length === 0) return a.map((value, i) => remove(value, i, getKey(value)));

  const eq = options.eq ?? Equal.equals;
  const diff: Array<Diff<A, B>> = [];
  const oldKeyMap = options.previousKeyMap ?? getKeyMap(a, getKey);
  const keyMap = options.keyMap ?? getKeyMap(b, getKey);

  for (let i = 0; i < a.length; ++i) {
    const aValue = a[i];
    const key = getKey(aValue);
    const bIndex = keyMap.get(key);
    if (bIndex === undefined) {
      diff.push(remove(aValue, i, key));
    }
  }

  for (let i = 0; i < b.length; ++i) {
    const bValue = b[i];
    const key = getKey(bValue);
    const aIndex = oldKeyMap.get(key);
    if (aIndex === undefined) {
      diff.push(add(bValue, i, key));
    } else {
      if (aIndex !== i) {
        diff.push(moved(bValue, aIndex, i, key));
      } else if (!eq(a[aIndex], bValue)) {
        diff.push(update(bValue, i, key));
      }
    }
  }

  return diff;
}

/** Lazily yields keyed collection changes using the same two-pass ordering as `diff`.
 *
 * @remarks
 * ## Why
 *
 * A generator lets callers apply or stop consuming changes without first materializing the result
 * array.
 *
 * ## Ownership and lifetime
 *
 * Creating the generator defers all work. On first iteration it builds any missing key maps and
 * retains the two arrays, maps, and functions until iteration completes or the generator is
 * released. It acquires no Scope and mutates none of its inputs.
 *
 * ## Ordering, equality, and complexity
 *
 * Removals are yielded first in old order, followed by additions, moves, and same-index updates in
 * new order. Unlike `diff`, equality defaults to `Object.is`. Total traversal is O(old length + new
 * length), with O(old length + new length) map space when maps are not supplied. Keys must be unique.
 *
 * @example
 * ```ts
 * import { diffIterator } from "@typed/fx/Fx/internal/diff"
 *
 * for (const change of diffIterator(["a", "b"], ["b", "c"])) {
 *   console.log(change._tag, change.key)
 * }
 * ```
 *
 * @since 1.0.0
 * @category advanced
 * @stability internal-but-published
 */
export function diffIterator<A extends PropertyKey>(
  oldValue: ReadonlyArray<A>,
  newValue: ReadonlyArray<A>,
  options?: Omit<DiffOptions<A, A>, "getKey">,
): Generator<Diff<A, A>>;

export function diffIterator<A, B extends PropertyKey>(
  oldValue: ReadonlyArray<A>,
  newValue: ReadonlyArray<A>,
  options: DiffOptions<A, B>,
): Generator<Diff<A, B>>;

export function* diffIterator<A, B extends PropertyKey>(
  a: ReadonlyArray<A>,
  b: ReadonlyArray<A>,
  options: Partial<DiffOptions<A, B>> = {},
): Generator<Diff<A, B>> {
  const { eq = Object.is, getKey = identity as any } = options;
  const oldKeyMap = options.previousKeyMap ?? getKeyMap(a, getKey);
  const keyMap = options.keyMap ?? getKeyMap(b, getKey);

  for (let i = 0; i < a.length; ++i) {
    const aValue = a[i];
    const key = getKey(aValue);
    const bIndex = keyMap.get(key);
    if (bIndex === undefined) {
      yield remove(aValue, i, key);
    }
  }

  for (let i = 0; i < b.length; ++i) {
    const bValue = b[i];
    const key = getKey(bValue);
    const aIndex = oldKeyMap.get(key);
    if (aIndex === undefined) {
      yield add(bValue, i, key);
    } else {
      if (aIndex !== i) {
        yield moved(bValue, aIndex, i, key);
      } else if (!eq(a[aIndex], bValue)) {
        yield update(bValue, i, key);
      }
    }
  }
}

/** Builds a map from each extracted key to its current array index.
 *
 * @remarks
 * ## Why
 *
 * Exposing map construction lets repeated diff callers cache the previous array's index and avoid
 * re-extracting those keys on the next transition.
 *
 * ## Ownership and lifetime
 *
 * The returned map is newly allocated and retains each key until released. The input array is read
 * once and not retained by the map. Duplicate keys are not rejected: the last occurrence wins, so
 * callers that require an unambiguous diff must validate uniqueness separately.
 *
 * The operation is O(n) time and O(n) space, plus the cost of `getKey` and Map hashing.
 *
 * @example
 * ```ts
 * import { getKeyMap } from "@typed/fx/Fx/internal/diff"
 *
 * const map = getKeyMap([{ id: "a" }, { id: "b" }], ({ id }) => id)
 * map.get("b") // 1
 * ```
 *
 * @since 1.0.0
 * @category advanced
 * @stability internal-but-published
 */
export function getKeyMap<A>(
  a: ReadonlyArray<A>,
  getKey: (a: A) => PropertyKey,
): Map<PropertyKey, number> {
  const keyMap = new Map<PropertyKey, number>();
  const len = a.length;
  for (let i = 0; i < len; ++i) {
    keyMap.set(getKey(a[i]), i);
  }
  return keyMap;
}
