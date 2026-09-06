/**
 * Collection is the scoped registry shared by composite widgets. Registration order is not
 * navigation order: byDomOrder reads the mounted nodes with compareDocumentPosition, and each
 * register Effect removes its own item when that Effect's Scope closes.
 *
 * @remarks
 * The module keeps policy, state transitions, and DOM rendering separable so applications can use
 * the state and pure operations without mounting UI, or supply custom hosts without replacing native
 * events and browser-owned focus.
 *
 * @since 1.0.0
 * @category Architecture overview
 * @packageDocumentation
 */
import * as Effect from "effect/Effect";
import * as Equal from "effect/Equal";
import * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import * as Equivalence from "effect/Equivalence";

/**
 * Public Collection.Item behavioral model.
 *
 * @remarks
 * ## Why
 *
 * The public model lets custom composites reuse Collection's deterministic policy without copying
 * an internal shape.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { Item } from "@typed/ui/Collection";` Extend the [Collection.makeState
 * runnable setup](/reference/%40typed%2Fui%2FCollection%23makeState). A registered value can retain
 * its real DOM identity:
 * `const item: Item<string> = { id: "save", value: "save", element: document.createElement("button") }`.
 * @since 1.0.0
 * @category Item metadata
 */
export interface Item<Value = unknown, Element extends object = globalThis.Element> {
  /**
   * Stable id used for collection identity and ARIA relationships.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly id: string;
  /**
   * Mounted element handle used for DOM ordering, focus, and scrolling.
   * @since 1.0.0
   * @category Item registration
   */
  readonly element?: Element;
  /**
   * Flag used by collection movement and widget handlers to skip activation by default.
   * @since 1.0.0
   * @category Availability
   */
  readonly disabled?: boolean;
  /**
   * Whether the item participates as a submenu entry.
   * @since 1.0.0
   * @category Nested menus
   */
  readonly submenu?: boolean;
  /**
   * Search text used by typeahead independently of rendered markup.
   * @since 1.0.0
   * @category Typeahead
   */
  readonly textValue?: string;
  /**
   * Current semantic value selected or edited by the widget.
   * @since 1.0.0
   * @category Item metadata
   */
  readonly value?: Value;
}

/**
 * Complete renderer-independent state for Collection.
 *
 * @remarks
 * ## Why
 *
 * Applications can inspect, update, and test Collection behavior without mounting or coupling the
 * state to a renderer.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { State } from "@typed/ui/Collection";` Extend the [Collection.makeState
 * runnable setup](/reference/%40typed%2Fui%2FCollection%23makeState). Collection state is an
 * immutable sequence: `const snapshot: State<string> = [{ id: "save", value: "save" }]`.
 * @since 1.0.0
 * @category Collection state
 */
export type State<Value = unknown, Element extends object = globalThis.Element> = readonly Item<
  Value,
  Element
>[];

/**
 * Creates hydrated Collection state. The collection starts with the supplied immutable item array,
 * or empty.
 *
 * @remarks
 * ## Why
 *
 * State and collection ownership can be composed and tested independently from any renderer.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect creates the RefSubject when run. That state is renderer-independent;
 * collection registrations belong to the separate Scope that runs register or ref, not to state
 * creation.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as Collection from "@typed/ui/Collection";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* Collection.makeState<string>();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category Collection state
 */
export function makeState<Value = unknown, Element extends object = globalThis.Element>(
  initial: State<Value, Element> = [],
): Effect.Effect<RefSubject.RefSubject<State<Value, Element>>, never, Scope.Scope> {
  // DOM elements are runtime handles; structural equality would traverse browser internals.
  return RefSubject.make(initial, { eq: Equivalence.Array(itemEquivalence<Value, Element>()) });
}

/**
 * Upserts an item immediately and installs a finalizer in the Scope that runs this Effect; the
 * finalizer removes only that exact registration.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Collection's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * Registration is owned by the Scope in which the registration Effect runs. Closing that Scope
 * removes the exact registered item; creating the collection or state does not own this cleanup.
 *
 * ## Example
 *
 * Import with `import { register } from "@typed/ui/Collection";` Extend the [Collection.makeState
 * runnable setup](/reference/%40typed%2Fui%2FCollection%23makeState). Inside the linked Effect
 * program invoke `yield* register(collection, { id: "save", value: "save" })`, then read the
 * collection to observe the inserted item.
 * @since 1.0.0
 * @category Item registration
 */
export function register<Value, Element extends object, E, R>(
  collection: RefSubject.RefSubject<State<Value, Element>, E, R>,
  item: Item<Value, Element>,
): Effect.Effect<void, E, R | Scope.Scope> {
  return Effect.gen(function* () {
    yield* RefSubject.update(collection, (items) => upsert(items, item)).pipe(Effect.asVoid);

    const services = yield* Effect.context<R>();
    const scope = yield* Effect.scope;
    yield* Scope.addFinalizer(
      scope,
      unregisterRegistered(collection, item).pipe(
        Effect.provide(services),
        Effect.ignore({ log: true }),
      ),
    );
  });
}

/**
 * Registers a mounted element and removes it automatically with the Scope in which the returned
 * Effect is run.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Collection's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * Registration is owned by the Scope in which the registration Effect runs. Closing that Scope
 * removes the exact registered item; creating the collection or state does not own this cleanup.
 *
 * ## Example
 *
 * Import with `import { ref } from "@typed/ui/Collection";` Extend the [Collection.makeState
 * runnable setup](/reference/%40typed%2Fui%2FCollection%23makeState). Inside the linked Effect
 * program create `const attach = ref(collection, { id: "save", value: "save" })`, then run `yield*
 * attach(document.createElement("button"))` and read the collection before Scope close.
 * @since 1.0.0
 * @category Item registration
 */

export function ref<Value, Element extends object, E, R>(
  collection: RefSubject.RefSubject<State<Value, Element>, E, R>,
  item: Omit<Item<Value, Element>, "element">,
): (element: Element) => Effect.Effect<void, E, R | Scope.Scope> {
  return Effect.fn((element) => register(collection, { ...item, element }));
}

/**
 * Removes every registered item with the supplied id and retains the remaining order.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Collection's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * ## Example
 *
 * Import with `import { unregister } from "@typed/ui/Collection";` Extend the [Collection.makeState
 * runnable setup](/reference/%40typed%2Fui%2FCollection%23makeState). Inside the linked Effect
 * program first register `"save"`, run `yield* unregister(collection, "save")`, then read the
 * collection to observe that only the matching id was removed.
 * @since 1.0.0
 * @category Item registration
 */
export function unregister<Value, Element extends object, E, R>(
  collection: RefSubject.RefSubject<State<Value, Element>, E, R>,
  id: string,
): Effect.Effect<void, E, R> {
  return RefSubject.update(collection, (items) => items.filter((item) => item.id !== id)).pipe(
    Effect.asVoid,
  );
}

/**
 * Returns a new array excluding only items whose disabled flag is exactly true.
 *
 * @remarks
 * ## Why
 *
 * Separating this deterministic policy from event wiring lets applications test it directly and
 * reuse it in custom composites.
 *
 * ## Ownership and lifetime
 *
 * This is a synchronous calculation. It acquires no resources and does not mutate the input array,
 * state, event, or DOM.
 *
 * @example
 * ```ts
 * import * as Collection from "@typed/ui/Collection";
 *
 * const enabled = Collection.enabledItems([{ id: "a" }, { id: "b", disabled: true }]);
 * ```
 * @since 1.0.0
 * @category Collection ordering
 */
export function enabledItems<ItemType extends Item<unknown, object>>(
  items: readonly ItemType[],
): readonly ItemType[] {
  return items.filter((item) => item.disabled !== true);
}

/**
 * Returns a sorted copy using compareDocumentPosition; items without comparable mounted elements
 * retain an equivalent ordering position.
 *
 * @remarks
 * ## Why
 *
 * Separating this deterministic policy from event wiring lets applications test it directly and
 * reuse it in custom composites.
 *
 * ## Ownership and lifetime
 *
 * This is a synchronous calculation. It acquires no resources and does not mutate the input array,
 * state, event, or DOM.
 *
 * @example
 * ```ts
 * import * as Collection from "@typed/ui/Collection";
 *
 * const ordered = Collection.byDomOrder([{ id: "body", element: document.body }]);
 * ```
 * @since 1.0.0
 * @category Collection ordering
 */
export function byDomOrder<ItemType extends Item<unknown, object>>(
  items: readonly ItemType[],
): readonly ItemType[] {
  return items.toSorted((left, right) => {
    if (left.element === undefined || right.element === undefined) return 0;

    const compareDocumentPosition = Reflect.get(left.element, "compareDocumentPosition");
    if (typeof compareDocumentPosition !== "function") return 0;
    const position = compareDocumentPosition.call(left.element, right.element) as number;
    if (position & 2) return 1;
    if (position & 4) return -1;
    return 0;
  });
}

function unregisterRegistered<Value, Element extends object, E, R>(
  collection: RefSubject.RefSubject<State<Value, Element>, E, R>,
  item: Item<Value, Element>,
): Effect.Effect<void, E, R> {
  return RefSubject.update(collection, (items) =>
    items.filter((current) => current.id !== item.id || current !== item),
  ).pipe(Effect.asVoid);
}

function upsert<Value, Element extends object>(
  items: State<Value, Element>,
  item: Item<Value, Element>,
): State<Value, Element> {
  const index = items.findIndex((current) => current.id === item.id);
  return index === -1 ? [...items, item] : items.toSpliced(index, 1, item);
}

function itemEquivalence<Value, Element extends object>(): Equivalence.Equivalence<
  Item<Value, Element>
> {
  return Equivalence.make(
    (left, right) =>
      left.id === right.id &&
      left.element === right.element &&
      left.disabled === right.disabled &&
      left.submenu === right.submenu &&
      left.textValue === right.textValue &&
      Equal.equals(left.value, right.value),
  );
}
