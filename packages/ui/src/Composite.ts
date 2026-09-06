/**
 * Composite contains the reusable policy behind roving tabindex and virtual focus. Its pure
 * helpers define orientation, RTL, wrapping, disabled-item, typeahead, and DOM-order rules; Effect
 * helpers perform focus and scrolling only when run.
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
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import * as Collection from "./Collection.js";

/**
 * Supported composite movement axes.
 *
 * @remarks
 * ## Why
 *
 * The public model lets custom composites reuse Composite's deterministic policy without copying
 * an internal shape.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { Orientation } from "@typed/ui/Composite";` Extend the
 * [Composite.makeState runnable setup](/reference/%40typed%2Fui%2FComposite%23makeState). Choose an
 * axis policy explicitly: `const orientation: Orientation = "horizontal"`.
 * @since 1.0.0
 * @category Directional movement
 */
export type Orientation = "horizontal" | "vertical" | "both";
/**
 * Logical movement operations independent of physical key names.
 *
 * @remarks
 * ## Why
 *
 * The public model lets custom composites reuse Composite's deterministic policy without copying
 * an internal shape.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { Move } from "@typed/ui/Composite";` Extend the [Composite.makeState
 * runnable setup](/reference/%40typed%2Fui%2FComposite%23makeState). Choose a supported movement
 * operation explicitly: `const direction: Move = "next"`.
 * @since 1.0.0
 * @category Directional movement
 */
export type Move = "next" | "previous" | "first" | "last";

/**
 * Complete renderer-independent state for Composite.
 *
 * @remarks
 * ## Why
 *
 * Applications can inspect, update, and test Composite behavior without mounting or coupling the
 * state to a renderer.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { State } from "@typed/ui/Composite";` Extend the [Composite.makeState
 * runnable setup](/reference/%40typed%2Fui%2FComposite%23makeState). Inside the linked program,
 * `const snapshot: State = yield* state` exposes focus, orientation, looping, RTL, and
 * virtual-focus policy.
 * @since 1.0.0
 * @category Active item state
 */
export interface State {
  /**
   * Id currently active for keyboard navigation; null means no active item.
   * @since 1.0.0
   * @category Active item state
   */
  readonly activeId: string | null;
  /**
   * Axis used to interpret Arrow-key movement.
   * @since 1.0.0
   * @category Directional movement
   */
  readonly orientation: Orientation;
  /**
   * Whether movement wraps between the first and last enabled items.
   * @since 1.0.0
   * @category Directional movement
   */
  readonly loop: boolean;
  /**
   * Whether horizontal Arrow-key meaning is reversed for right-to-left layout.
   * @since 1.0.0
   * @category Directional movement
   */
  readonly rtl: boolean;
  /**
   * Whether DOM focus remains on the root and activeId is exposed via aria-activedescendant.
   * @since 1.0.0
   * @category Keyboard focus
   */
  readonly virtualFocus: boolean;
}

/**
 * Initial Composite values. activeId defaults to null, orientation to horizontal, loop to true,
 * RTL and virtual focus to false.
 *
 * @remarks
 * ## Why
 *
 * Making initialization explicit documents hydration-sensitive defaults and lets servers and
 * clients construct matching state.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { InitialState } from "@typed/ui/Composite";` Extend the
 * [Composite.makeState runnable setup](/reference/%40typed%2Fui%2FComposite%23makeState). Construct
 * policy explicitly with
 * `const initial: InitialState = { activeId: null, orientation: "vertical", loop: false, rtl: false, virtualFocus: true }; const state = yield* Composite.makeState(initial)`.
 * @since 1.0.0
 * @category Active item state
 */
export interface InitialState {
  /**
   * Id currently active for keyboard navigation; null means no active item.
   * @since 1.0.0
   * @category Active item state
   */
  readonly activeId?: string | null;
  /**
   * Axis used to interpret Arrow-key movement.
   * @since 1.0.0
   * @category Directional movement
   */
  readonly orientation?: Orientation;
  /**
   * Whether movement wraps between the first and last enabled items.
   * @since 1.0.0
   * @category Directional movement
   */
  readonly loop?: boolean;
  /**
   * Whether horizontal Arrow-key meaning is reversed for right-to-left layout.
   * @since 1.0.0
   * @category Directional movement
   */
  readonly rtl?: boolean;
  /**
   * Whether DOM focus remains on the root and activeId is exposed via aria-activedescendant.
   * @since 1.0.0
   * @category Keyboard focus
   */
  readonly virtualFocus?: boolean;
}

/**
 * State, collection, and disabled-item policy consumed by Composite movement helpers.
 *
 * @remarks
 * ## Why
 *
 * Keeping both RefSubjects and the disabled-item policy in one value preserves their independent
 * error and service channels across movement, focus, and scrolling helpers.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { MoveOptions } from "@typed/ui/Composite";` Extend the
 * [Composite.makeState runnable setup](/reference/%40typed%2Fui%2FComposite%23makeState). Combine
 * the only three inputs with
 * `const options: MoveOptions<string, State> = { state, collection, includeDisabled: false }`.
 * @since 1.0.0
 * @category Directional movement
 */
export interface MoveOptions<
  Value = unknown,
  CompositeState extends State = State,
  E = never,
  R = never,
  E2 = never,
  R2 = never,
  Element extends object = globalThis.Element,
> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.RefSubject<CompositeState, E, R>;
  /**
   * Item registry used for collection-driven keyboard behavior and mounted ordering.
   * @since 1.0.0
   * @category Item registration
   */
  readonly collection: RefSubject.RefSubject<Collection.State<Value, Element>, E2, R2>;
  /**
   * Whether movement may land on disabled collection items.
   * @since 1.0.0
   * @category Availability
   */
  readonly includeDisabled?: boolean;
}

/**
 * Public Composite.ActiveIdState behavioral model.
 *
 * @remarks
 * ## Why
 *
 * The public model lets custom composites reuse Composite's deterministic policy without copying
 * an internal shape.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { ActiveIdState } from "@typed/ui/Composite";` Extend the
 * [Composite.makeState runnable setup](/reference/%40typed%2Fui%2FComposite%23makeState). A
 * compatible focus state is observable directly: `const active: ActiveIdState = yield* state`.
 * @since 1.0.0
 * @category Active item state
 */
export interface ActiveIdState {
  /**
   * Id currently active for keyboard navigation; null means no active item.
   * @since 1.0.0
   * @category Active item state
   */
  readonly activeId: string | null;
  /**
   * Whether movement wraps between the first and last enabled items.
   * @since 1.0.0
   * @category Directional movement
   */
  readonly loop: boolean;
}

/**
 * Public Composite.KeyboardEventLike behavioral model.
 *
 * @remarks
 * ## Why
 *
 * The public model lets custom composites reuse Composite's deterministic policy without copying
 * an internal shape.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { KeyboardEventLike } from "@typed/ui/Composite";` Extend the
 * [Composite.makeState runnable setup](/reference/%40typed%2Fui%2FComposite%23makeState). Custom
 * keyboard adapters need only the modeled surface:
 * `const event: KeyboardEventLike = { key: "ArrowDown", preventDefault() {} }`.
 * @since 1.0.0
 * @category Keyboard navigation
 */
export interface KeyboardEventLike {
  /**
   * Native KeyboardEvent key value to interpret.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  readonly key: string;
  /**
   * Whether Alt modified the key event.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  readonly altKey?: boolean;
  /**
   * Whether Control modified the key event.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  readonly ctrlKey?: boolean;
  /**
   * Whether Meta modified the key event.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  readonly metaKey?: boolean;
  /**
   * Optional native-event callback invoked only for an internally handled key.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  preventDefault?: () => void;
}

/**
 * Public Composite.TypeaheadBuffer behavioral model.
 *
 * @remarks
 * ## Why
 *
 * The public model lets custom composites reuse Composite's deterministic policy without copying
 * an internal shape.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { TypeaheadBuffer } from "@typed/ui/Composite";` Extend the
 * [Composite.makeState runnable setup](/reference/%40typed%2Fui%2FComposite%23makeState). Retain
 * the exact typed query and timestamp with
 * `const buffer: TypeaheadBuffer = { value: "Ty", updatedAt: 100 }`.
 * @since 1.0.0
 * @category Typeahead
 */
export interface TypeaheadBuffer {
  /**
   * Buffered typeahead key sequence, preserving the supplied key case.
   * @since 1.0.0
   * @category Typeahead
   */
  readonly value: string;
  /**
   * Timestamp of the last typeahead key, used to decide whether to append or restart.
   * @since 1.0.0
   * @category Typeahead
   */
  readonly updatedAt: number;
}

/**
 * Effect Schema used by makeState to encode, decode, and hydrate Composite state.
 *
 * @remarks
 * ## Why
 *
 * A public schema makes hydration and serialized state use the same runtime validation as direct
 * construction.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * @example
 * ```ts
 * import * as Schema from "effect/Schema";
 * import * as Composite from "@typed/ui/Composite";
 *
 * const decodeState = Schema.decodeUnknownEffect(Composite.StateSchema);
 * ```
 * @since 1.0.0
 * @category Active item state
 */
export const StateSchema = Schema.Struct({
  activeId: Schema.NullOr(Schema.String),
  orientation: Schema.Literals(["horizontal", "vertical", "both"]),
  loop: Schema.Boolean,
  rtl: Schema.Boolean,
  virtualFocus: Schema.Boolean,
});

/**
 * Creates hydrated Composite state. activeId defaults to null, orientation to horizontal, loop to
 * true, RTL and virtual focus to false.
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
 * import * as Composite from "@typed/ui/Composite";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* Composite.makeState({});
 *     const collection = yield* Collection.makeState<string>();
 *     return { state: yield* state, collection: yield* collection };
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category Active item state
 */
export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, {
    activeId: initial.activeId ?? null,
    orientation: initial.orientation ?? "horizontal",
    loop: initial.loop ?? true,
    rtl: initial.rtl ?? false,
    virtualFocus: initial.virtualFocus ?? false,
  });
}

/**
 * Computes the next active id and updates state; collection and state failures/services are
 * preserved in the returned Effect.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Composite's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * ## Example
 *
 * Import with `import { move } from "@typed/ui/Composite";` Extend the [Composite.makeState
 * runnable setup](/reference/%40typed%2Fui%2FComposite%23makeState). Inside the linked Effect
 * program invoke `yield* move({ state, collection }, "next")`, then read state to observe the next
 * enabled registered id selected under the current loop policy.
 * @since 1.0.0
 * @category Directional movement
 */
export function move<Value, CompositeState extends State, E, R, E2, R2, Element extends object>(
  options: MoveOptions<Value, CompositeState, E, R, E2, R2, Element>,
  direction: Move,
): Effect.Effect<CompositeState, E | E2, R | R2> {
  return Effect.gen(function* () {
    const current = yield* options.state;
    const activeId = moveActiveId(
      yield* options.collection,
      current,
      direction,
      options.includeDisabled,
    );
    return yield* RefSubject.update(options.state, (state) => ({ ...state, activeId }));
  });
}

/**
 * Derives 0 only for the active item under roving focus; virtual-focus items always receive -1.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Composite's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * Creating the Computed value acquires nothing eagerly. The Scope that subscribes to it owns
 * observation of the source RefSubject.
 *
 * ## Example
 *
 * Import with `import { tabIndex } from "@typed/ui/Composite";` Extend the [Composite.makeState
 * runnable setup](/reference/%40typed%2Fui%2FComposite%23makeState). Inside the linked Effect
 * program read `const value = yield* tabIndex(state, "item-2")`; it is `0` only while that item
 * owns roving focus and is `-1` under virtual focus.
 * @since 1.0.0
 * @category Keyboard focus
 */
export function tabIndex<CompositeState extends State, E, R>(
  state: RefSubject.RefSubject<CompositeState, E, R>,
  id: string,
): RefSubject.Computed<0 | -1, E, R> {
  return RefSubject.map(state, (current) =>
    current.virtualFocus ? -1 : current.activeId === id ? 0 : -1,
  );
}

/**
 * Derives activeId only under virtual focus, otherwise undefined.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Composite's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * Creating the Computed value acquires nothing eagerly. The Scope that subscribes to it owns
 * observation of the source RefSubject.
 *
 * ## Example
 *
 * Import with `import { activeDescendant } from "@typed/ui/Composite";` Extend the
 * [Composite.makeState runnable setup](/reference/%40typed%2Fui%2FComposite%23makeState). Inside
 * the linked Effect program read `const id = yield* activeDescendant(state)`; it is the active id
 * only under virtual focus and otherwise `undefined`.
 * @since 1.0.0
 * @category Keyboard focus
 */
export function activeDescendant<CompositeState extends State, E, R>(
  state: RefSubject.RefSubject<CompositeState, E, R>,
): RefSubject.Computed<string | undefined, E, R> {
  return RefSubject.map(state, (current) =>
    current.virtualFocus && current.activeId ? current.activeId : undefined,
  );
}

/**
 * Derives 0 when the root owns focus and -1 once a roving-focus item is active.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Composite's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * Creating the Computed value acquires nothing eagerly. The Scope that subscribes to it owns
 * observation of the source RefSubject.
 *
 * ## Example
 *
 * Import with `import { rootTabIndex } from "@typed/ui/Composite";` Extend the [Composite.makeState
 * runnable setup](/reference/%40typed%2Fui%2FComposite%23makeState). Inside the linked Effect
 * program read `const value = yield* rootTabIndex(state)`; it is `0` while the root owns focus and
 * `-1` after a roving-focus item becomes active.
 * @since 1.0.0
 * @category Keyboard focus
 */
export function rootTabIndex<CompositeState extends State, E, R>(
  state: RefSubject.RefSubject<CompositeState, E, R>,
): RefSubject.Computed<0 | -1, E, R> {
  return RefSubject.map(state, (current) =>
    current.virtualFocus || current.activeId === null ? 0 : -1,
  );
}

/**
 * Maps Home/End and orientation-aware Arrow keys to movement, reversing horizontal arrows for RTL.
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
 * import * as Composite from "@typed/ui/Composite";
 *
 * const direction = Composite.keyMove({ key: "ArrowLeft" }, { orientation: "horizontal", rtl: true });
 * ```
 * @since 1.0.0
 * @category Keyboard navigation
 */
export function keyMove(
  event: Pick<KeyboardEventLike, "key">,
  options: { readonly orientation?: Orientation; readonly rtl?: boolean },
): Move | undefined {
  if (event.key === "Home") return "first";
  if (event.key === "End") return "last";

  const orientation = options.orientation ?? "horizontal";
  const rtl = options.rtl ?? false;
  if (orientation !== "vertical" && event.key === "ArrowRight") return rtl ? "previous" : "next";
  if (orientation !== "vertical" && event.key === "ArrowLeft") return rtl ? "next" : "previous";
  if (orientation !== "horizontal" && event.key === "ArrowDown") return "next";
  if (orientation !== "horizontal" && event.key === "ArrowUp") return "previous";
  return undefined;
}

/**
 * Prevents the native key default only when keyMove recognizes the key, then updates active state.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Composite's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * ## Example
 *
 * Import with `import { moveByKey } from "@typed/ui/Composite";` Extend the [Composite.makeState
 * runnable setup](/reference/%40typed%2Fui%2FComposite%23makeState). Inside the linked Effect
 * program run `yield* moveByKey({ key: "ArrowDown" }, { state, collection })`, then read state to
 * observe the active id selected by the current orientation and RTL policy.
 * @since 1.0.0
 * @category Keyboard navigation
 */
export function moveByKey<
  Value,
  CompositeState extends State,
  E,
  R,
  E2,
  R2,
  Element extends object,
>(
  event: KeyboardEventLike,
  options: MoveOptions<Value, CompositeState, E, R, E2, R2, Element>,
): Effect.Effect<boolean, E | E2, R | R2> {
  return Effect.gen(function* () {
    const direction = keyMove(event, yield* options.state);
    if (direction === undefined) return false;

    event.preventDefault?.();
    yield* move(options, direction);
    return true;
  });
}

/**
 * Moves active state, then focuses and scrolls the mounted active item when virtual focus is
 * disabled.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Composite's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * ## Example
 *
 * Import with `import { moveAndFocus } from "@typed/ui/Composite";` Extend the [Composite.makeState
 * runnable setup](/reference/%40typed%2Fui%2FComposite%23makeState). Inside the linked Effect
 * program run `yield* moveAndFocus({ state, collection }, "next")`; the returned state names the
 * next id and its registered element receives native focus.
 * @since 1.0.0
 * @category DOM focus and scrolling
 */

export function moveAndFocus<
  Value,
  CompositeState extends State,
  E,
  R,
  E2,
  R2,
  Element extends object,
>(
  options: MoveOptions<Value, CompositeState, E, R, E2, R2, Element>,
  direction: Move,
): Effect.Effect<CompositeState, E | E2, R | R2> {
  return Effect.tap(
    move(options, direction),
    Effect.andThen(focusActive(options), scrollActive(options)),
  );
}

/**
 * Focuses the registered active element unless state uses virtual focus or has no active id.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Composite's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * ## Example
 *
 * Import with `import { focusActive } from "@typed/ui/Composite";` Extend the [Composite.makeState
 * runnable setup](/reference/%40typed%2Fui%2FComposite%23makeState). Inside the linked Effect
 * program run `yield* focusActive({ state, collection })`; the active registered element receives
 * native focus, with no state transition when no matching element exists.
 * @since 1.0.0
 * @category DOM focus and scrolling
 */

export function focusActive<
  Value,
  CompositeState extends State,
  E,
  R,
  E2,
  R2,
  Element extends object,
>(
  options: MoveOptions<Value, CompositeState, E, R, E2, R2, Element>,
): Effect.Effect<void, E | E2, R | R2> {
  return Effect.gen(function* () {
    const state = yield* options.state;
    if (state.virtualFocus || state.activeId === null) return;
    const item = (yield* options.collection).find((item) => item.id === state.activeId);
    yield* focusElement(item?.element);
  });
}

/**
 * Calls an existing platform focus method inside Effect.sync and otherwise does nothing.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Composite's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * @example
 * ```ts
 * import * as Composite from "@typed/ui/Composite";
 *
 * const focused = Composite.focusElement(document.querySelector("button") ?? undefined);
 * ```
 * @since 1.0.0
 * @category DOM focus and scrolling
 */

export function focusElement(element: object | undefined): Effect.Effect<void> {
  return Effect.sync(() => {
    const focus = element === undefined ? undefined : Reflect.get(element, "focus");
    if (typeof focus === "function") focus.call(element);
  });
}

/**
 * Calls scrollIntoView with nearest block/inline alignment for the mounted active item.
 *
 * @remarks
 * ## Why
 *
 * The operation exposes Composite's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect performs the update or DOM side effect only when run, preserves the declared
 * error and service channels, and retains no resources after completion.
 *
 * ## Example
 *
 * Import with `import { scrollActive } from "@typed/ui/Composite";` Extend the [Composite.makeState
 * runnable setup](/reference/%40typed%2Fui%2FComposite%23makeState). Inside the linked Effect
 * program run `yield* scrollActive({ state, collection })`; the active registered element receives
 * `scrollIntoView({ block: "nearest", inline: "nearest" })` when that method is available.
 * @since 1.0.0
 * @category DOM focus and scrolling
 */

export function scrollActive<
  Value,
  CompositeState extends State,
  E,
  R,
  E2,
  R2,
  Element extends object,
>(
  options: MoveOptions<Value, CompositeState, E, R, E2, R2, Element>,
): Effect.Effect<void, E | E2, R | R2> {
  return Effect.gen(function* () {
    const activeId = (yield* options.state).activeId;
    if (activeId === null) return;
    const element = (yield* options.collection).find((item) => item.id === activeId)?.element;
    const scrollIntoView =
      element === undefined ? undefined : Reflect.get(element, "scrollIntoView");
    if (typeof scrollIntoView === "function") {
      scrollIntoView.call(element, { block: "nearest", inline: "nearest" });
    }
  });
}

/**
 * Returns the first enabled item id in DOM order whose textValue starts with the query.
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
 * import * as Composite from "@typed/ui/Composite";
 *
 * const id = Composite.typeahead([{ id: "alpha", textValue: "Alpha" }], "al");
 * ```
 * @since 1.0.0
 * @category Typeahead
 */
export function typeahead<Item extends Collection.Item<unknown, object>>(
  items: readonly Item[],
  search: string,
  text: (item: Item) => string = (item) => item.textValue ?? item.id,
  includeDisabled = false,
): string | null {
  return typeaheadFrom(items, search, null, text, includeDisabled);
}

/**
 * Returns only the id selected by typeahead, or null when no item matches.
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
 * import * as Composite from "@typed/ui/Composite";
 *
 * const id = Composite.typeaheadFrom([{ id: "alpha", textValue: "Alpha" }], "al", null);
 * ```
 * @since 1.0.0
 * @category Typeahead
 */

export function typeaheadFrom<Item extends Collection.Item<unknown, object>>(
  items: readonly Item[],
  search: string,
  activeId: string | null,
  text: (item: Item) => string = (item) => item.textValue ?? item.id,
  includeDisabled = false,
): string | null {
  const query = search.trim().toLocaleLowerCase();
  if (query.length === 0) return null;

  const enabled = orderedItems(items, includeDisabled);
  const index = activeId === null ? -1 : enabled.findIndex((item) => item.id === activeId);
  const ordered =
    index === -1 ? enabled : [...enabled.slice(index + 1), ...enabled.slice(0, index + 1)];
  const item = ordered.find((item) => text(item).toLocaleLowerCase().startsWith(query));

  return item?.id ?? null;
}

/**
 * Returns an unmodified one-character key exactly as provided; modified and multi-character keys
 * return null.
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
 * import * as Composite from "@typed/ui/Composite";
 *
 * const key = Composite.typeaheadKey({ key: "A" });
 * ```
 * @since 1.0.0
 * @category Typeahead
 */
export function typeaheadKey(event: KeyboardEventLike): string | null {
  if (event.altKey || event.ctrlKey || event.metaKey) return null;
  return event.key.length === 1 ? event.key : null;
}

/**
 * Appends within the timeout window and starts a new query after the buffer expires.
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
 * import * as Composite from "@typed/ui/Composite";
 *
 * const buffer = Composite.updateTypeaheadBuffer({ value: "a", updatedAt: 100 }, "b", 200);
 * ```
 * @since 1.0.0
 * @category Typeahead
 */
export function updateTypeaheadBuffer(
  buffer: TypeaheadBuffer,
  key: string,
  now: number,
  timeout = 500,
): TypeaheadBuffer {
  return {
    value: now - buffer.updatedAt > timeout ? key : buffer.value + key,
    updatedAt: now,
  };
}

/**
 * Sorts a copy by mounted DOM order and then removes disabled items.
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
 * import * as Composite from "@typed/ui/Composite";
 *
 * const items = Composite.orderedEnabledItems([{ id: "a" }, { id: "b", disabled: true }]);
 * ```
 * @since 1.0.0
 * @category Directional movement
 */
export function orderedEnabledItems<Item extends Collection.Item<unknown, object>>(
  items: readonly Item[],
): readonly Item[] {
  return Collection.enabledItems(Collection.byDomOrder(items));
}

/**
 * Returns the id reached by first/last/next/previous with optional disabled inclusion and loop
 * policy.
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
 * import * as Composite from "@typed/ui/Composite";
 *
 * const id = Composite.moveActiveId([{ id: "a" }, { id: "b" }], { activeId: "a", loop: true }, "next");
 * ```
 * @since 1.0.0
 * @category Directional movement
 */
export function moveActiveId<Item extends Collection.Item<unknown, object>>(
  items: readonly Item[],
  state: ActiveIdState,
  direction: Move,
  includeDisabled = false,
): string | null {
  return moveActiveItem(items, state, direction, includeDisabled)?.id ?? null;
}

/**
 * Returns the full item selected by moveActiveId, or undefined when no item is reachable.
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
 * import * as Composite from "@typed/ui/Composite";
 *
 * const item = Composite.moveActiveItem([{ id: "a" }, { id: "b" }], { activeId: "a", loop: true }, "next");
 * ```
 * @since 1.0.0
 * @category Directional movement
 */
export function moveActiveItem<Item extends Collection.Item<unknown, object>>(
  items: readonly Item[],
  state: ActiveIdState,
  direction: Move,
  includeDisabled = false,
): Item | undefined {
  const enabled = orderedItems(items, includeDisabled);
  if (enabled.length === 0) return undefined;
  if (direction === "first") return enabled[0];
  if (direction === "last") return enabled[enabled.length - 1];

  const index = activeIndex(enabled, state.activeId, direction, state.loop);
  return enabled[index];
}

function orderedItems<Item extends Collection.Item<unknown, object>>(
  items: readonly Item[],
  includeDisabled: boolean,
): readonly Item[] {
  return includeDisabled ? Collection.byDomOrder(items) : orderedEnabledItems(items);
}

function activeIndex<Item extends Collection.Item<unknown, object>>(
  items: readonly Item[],
  activeId: string | null,
  direction: "next" | "previous",
  loop: boolean,
): number {
  if (activeId === null) return direction === "previous" && loop ? items.length - 1 : 0;

  const current = items.findIndex((item) => item.id === activeId);
  if (current === -1) return direction === "previous" && loop ? items.length - 1 : 0;
  const index = current;
  const delta = direction === "next" ? 1 : -1;
  const next = index + delta;

  if (loop) return (next + items.length) % items.length;
  return Math.min(Math.max(next, 0), items.length - 1);
}
