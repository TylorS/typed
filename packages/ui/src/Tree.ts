/**
 * Tree stores active item and expanded ids independently. Its key policy follows hierarchical tree
 * navigation, while Item and Group expose explicit levels, expansion, and visibility without
 * reconstructing nodes.
 *
 * @remarks
 * The module keeps policy, state transitions, and DOM rendering separable so applications can use
 * the state and pure operations without mounting UI, or supply custom hosts without replacing native
 * events and browser-owned focus.
 *
 * Learn the interaction in the [Tree guide](/explore/ui-tree).
 *
 * @since 1.0.0
 * @category modules
 * @packageDocumentation
 */
import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import type { Fx } from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx";
import {
  EventHandler,
  html,
  type Renderable,
  type RenderEvent,
  type RenderTemplate,
} from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/**
 * The focused node and expanded parent identities.
 * Expansion controls visible traversal; file selection or opening is a separate application action.
 *
 * @since 1.0.0
 * @category Hierarchy state
 */
export interface State {
  /**
   * Id currently active for keyboard navigation; null means no active item.
   * @since 1.0.0
   * @category Keyboard focus
   */
  readonly activeId: string | null;
  /**
   * Ids whose child tree groups are currently visible.
   * @since 1.0.0
   * @category Expansion
   */
  readonly expandedIds: readonly string[];
  /**
   * Whether movement wraps between the first and last enabled items.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  readonly loop: boolean;
}

/**
 * Initial Tree values. activeId defaults null and expandedIds defaults empty.
 *
 * @since 1.0.0
 * @category Hierarchy state
 */
export interface InitialState {
  /**
   * Id currently active for keyboard navigation; null means no active item.
   * @since 1.0.0
   * @category Keyboard focus
   */
  readonly activeId?: string | null;
  /**
   * Ids whose child tree groups are currently visible.
   * @since 1.0.0
   * @category Expansion
   */
  readonly expandedIds?: readonly string[];
  /**
   * Whether movement wraps between the first and last enabled items.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  readonly loop?: boolean;
}

/**
 * Effect Schema used by makeState to encode, decode, and hydrate Tree state.
 *
 * @remarks
 * @example
 * ```ts
 * import * as Schema from "effect/Schema";
 * import * as Tree from "@typed/ui/Tree";
 *
 * const decodeState = Schema.decodeUnknownEffect(Tree.StateSchema);
 * ```
 * @since 1.0.0
 * @category Hierarchy state
 */
export const StateSchema = Schema.Struct({
  activeId: Schema.NullOr(Schema.String),
  expandedIds: Schema.Array(Schema.String),
  loop: Schema.Boolean,
});

/**
 * Creates hydrated Tree state. activeId defaults null and expandedIds defaults empty.
 *
 * @remarks
 * The returned Effect creates the RefSubject when run. That state is renderer-independent;
 * collection registrations belong to the separate Scope that runs register or ref, not to state
 * creation.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as Tree from "@typed/ui/Tree";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* Tree.makeState({});
 *     const collection = yield* Tree.makeCollection();
 *     return { state: yield* state, collection: yield* collection };
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category Hierarchy state
 */
export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, {
    activeId: initial.activeId ?? null,
    expandedIds: [...(initial.expandedIds ?? [])],
    loop: initial.loop ?? true,
  });
}

/**
 * Tree collection value recording an item's parent relationship.
 *
 * @remarks
 * The public model lets custom composites reuse Tree's deterministic policy without copying an
 * internal shape.
 *
 * @since 1.0.0
 * @category Node registration
 */
export interface ItemValue {
  /**
   * Id whose expansion controls this descendant group.
   * @since 1.0.0
   * @category Hierarchy
   */
  readonly parentId?: string;
  /**
   * Whether aria-expanded is emitted and hierarchical keys may open descendants.
   * @since 1.0.0
   * @category Hierarchy
   */
  readonly hasChildren: boolean;
}

/**
 * Creates a scoped Collection for Tree items.
 *
 * @remarks
 * The returned Effect allocates the RefSubject in the caller's Scope. Each later registration is
 * owned by the Scope that runs register, independently of this construction Effect.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as Tree from "@typed/ui/Tree";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* Tree.makeCollection();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category Node registration
 */
export const makeCollection = Collection.makeState<ItemValue>;

/**
 * Tests membership in expandedIds without touching the DOM.
 *
 * @remarks
 * Separating this deterministic policy from event wiring lets applications test it directly and
 * reuse it in custom composites.
 *
 * This is a synchronous calculation. It acquires no resources and does not mutate the input array,
 * state, event, or DOM.
 *
 * @example
 * ```ts
 * import * as Tree from "@typed/ui/Tree";
 *
 * const expanded = Tree.isExpanded({ activeId: null, expandedIds: ["parent"], loop: true }, "parent");
 * ```
 * @since 1.0.0
 * @category Expansion
 */
export function isExpanded(state: State, id: string): boolean {
  return state.expandedIds.includes(id);
}

/**
 * Adds an id once to expandedIds.
 *
 * @remarks
 * The operation exposes Tree's transition directly so callers can compose it in Effect programs
 * and native event handlers.
 *
 * @since 1.0.0
 * @category Expansion
 */
export function expand<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  id: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) =>
    isExpanded(current, id) ? current : { ...current, expandedIds: [...current.expandedIds, id] },
  );
}

/**
 * Removes an id from expandedIds.
 *
 * @remarks
 * The operation exposes Tree's transition directly so callers can compose it in Effect programs
 * and native event handlers.
 *
 * @since 1.0.0
 * @category Expansion
 */
export function collapse<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  id: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    expandedIds: current.expandedIds.filter((expanded) => expanded !== id),
  }));
}

/**
 * Sets the active tree item id without changing expansion.
 *
 * @remarks
 * The operation exposes Tree's transition directly so callers can compose it in Effect programs
 * and native event handlers.
 *
 * @since 1.0.0
 * @category Node focus
 */
export function activate<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  activeId: string | null,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, activeId }));
}

/**
 * Inputs accepted by Tree.Root in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Tree surface
 */
export interface RootOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Item registry used for collection-driven keyboard behavior and mounted ordering.
   * @since 1.0.0
   * @category Item registration
   */
  readonly collection?: RefSubject.RefSubject<Collection.State<ItemValue>>;
  /**
   * Accessible label rendered through aria-label.
   * @since 1.0.0
   * @category Accessible naming
   */
  readonly label: Renderable.Any<string | null | undefined>;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function rootInternalProps<const Options extends RootOptions>(options: Options) {
  const onfocus =
    options.collection === undefined
      ? undefined
      : Effect.gen(function* () {
          const current = yield* options.state;
          if (current.activeId !== null) return;
          const first = Composite.moveActiveId(
            visibleItems(yield* options.collection!, current),
            current,
            "first",
          );
          if (first === null) return;
          yield* activate(options.state, first);
          yield* focusItem(options.collection!, first);
        });
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn((event: KeyboardEvent) => onKeyDown(options.state, options.collection!, event)),
        );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "tree",
      "aria-label": property("label", undefined),
      tabindex: RefSubject.map(options.state, (state) => (state.activeId === null ? 0 : -1)),
      onfocus,
      onkeydown,
      ref: options.state,
    }) as const;
}
type RootInternalProps<Options extends RootOptions> = ReturnType<
  ReturnType<typeof rootInternalProps<Options>>
>;

/**
 * Renders the tree root and applies hierarchy-aware keyboard navigation to registered items.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Tree surface
 */
export function Root<const Options extends RootOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, RootInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    RootInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, rootInternalProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

/**
 * Inputs accepted by Tree.Item in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Tree nodes
 */
export interface ItemOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Item registry used for collection-driven keyboard behavior and mounted ordering.
   * @since 1.0.0
   * @category Item registration
   */
  readonly collection?: RefSubject.RefSubject<Collection.State<ItemValue>>;
  /**
   * Stable id used for collection identity and ARIA relationships.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly id: string;
  /**
   * Id whose expansion controls this descendant group.
   * @since 1.0.0
   * @category Hierarchy
   */
  readonly parentId?: string;
  /**
   * One-based hierarchy level exposed through aria-level.
   * @since 1.0.0
   * @category Hierarchy
   */
  readonly level?: number;
  /**
   * Whether aria-expanded is emitted and hierarchical keys may open descendants.
   * @since 1.0.0
   * @category Hierarchy
   */
  readonly hasChildren?: boolean;
  /**
   * Flag used by collection movement and widget handlers to skip activation by default.
   * @since 1.0.0
   * @category Availability
   */
  readonly disabled?: boolean;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function itemInternalProps<const Options extends ItemOptions>(options: Options) {
  const hasChildren = options.hasChildren ?? false;
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: { parentId: options.parentId, hasChildren },
          textValue: options.id,
          disabled: options.disabled,
        });
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      id: options.id,
      role: "treeitem",
      "aria-level": property("level", 1),
      "aria-expanded": hasChildren
        ? RefSubject.map(options.state, (state) => isExpanded(state, options.id))
        : undefined,
      "aria-disabled": options.disabled ?? false,
      tabindex: RefSubject.map(options.state, (state) => (state.activeId === options.id ? 0 : -1)),
      onfocus: activate(options.state, options.id),
      onclick: options.disabled === true ? Effect.void : activate(options.state, options.id),
      ref: Dom.composeRefs(register, options.ref),
    }) as const;
}
type ItemInternalProps<Options extends ItemOptions> = ReturnType<
  ReturnType<typeof itemInternalProps<Options>>
>;

/**
 * Renders and optionally registers a treeitem with level, expanded, disabled, and roving-focus
 * state.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Tree nodes
 */
export function Item<const Options extends ItemOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ItemInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    ItemInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, itemInternalProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

/**
 * Inputs accepted by Tree.Group in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Child visibility
 */
export interface GroupOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Id whose expansion controls this descendant group.
   * @since 1.0.0
   * @category Hierarchy
   */
  readonly parentId: string;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function groupInternalProps<const Options extends GroupOptions>(options: Options) {
  return () =>
    ({
      role: "group",
      "?hidden": RefSubject.map(options.state, (state) => !isExpanded(state, options.parentId)),
    }) as const;
}
type GroupInternalProps<Options extends GroupOptions> = ReturnType<
  ReturnType<typeof groupInternalProps<Options>>
>;

/**
 * Renders a child group and hides it while its parent id is not expanded.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Child visibility
 */
export function Group<const Options extends GroupOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, GroupInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    GroupInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    groupInternalProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

function onKeyDown(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<ItemValue>>,
  event: KeyboardEvent,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const current = yield* state;
    const items = visibleItems(yield* collection, current);
    if (event.key === "Enter" || event.key === " ") {
      const active =
        current.activeId === null
          ? undefined
          : items.find((item) => item.id === current.activeId && item.disabled !== true);
      const element = active?.element;
      const click = element === undefined ? undefined : Reflect.get(element, "click");
      if (typeof click === "function") {
        event.preventDefault();
        yield* Effect.sync(() => click.call(element));
      }
      return yield* state;
    }
    const direction = Composite.keyMove(event, { orientation: "vertical" });
    if (direction !== undefined) {
      event.preventDefault();
      const next = Composite.moveActiveId(items, current, direction);
      if (next === null) return current;
      yield* activate(state, next);
      yield* focusItem(collection, next);
      return yield* state;
    }

    const active =
      current.activeId === null
        ? undefined
        : (yield* collection).find((item) => item.id === current.activeId);
    if (active === undefined) return current;
    const value = active.value;
    if (event.key === "ArrowRight" && value?.hasChildren) {
      event.preventDefault();
      if (!isExpanded(current, active.id)) return yield* expand(state, active.id);
      const child = items.find((item) => item.value?.parentId === active.id);
      if (child === undefined) return current;
      yield* activate(state, child.id);
      yield* focusItem(collection, child.id);
      return yield* state;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (value?.hasChildren && isExpanded(current, active.id))
        return yield* collapse(state, active.id);
      if (value?.parentId === undefined) return current;
      yield* activate(state, value.parentId);
      yield* focusItem(collection, value.parentId);
      return yield* state;
    }
    return current;
  });
}

function visibleItems(
  items: Collection.State<ItemValue>,
  state: State,
): readonly Collection.Item<ItemValue>[] {
  const ordered = Collection.byDomOrder(items);
  return ordered.filter((item) => {
    let parentId = item.value?.parentId;
    while (parentId !== undefined) {
      if (!isExpanded(state, parentId)) return false;
      parentId = ordered.find((candidate) => candidate.id === parentId)?.value?.parentId;
    }
    return true;
  });
}

function focusItem(
  collection: RefSubject.RefSubject<Collection.State<ItemValue>>,
  id: string,
): Effect.Effect<void> {
  return Effect.flatMap(collection, (items) =>
    Composite.focusElement(items.find((item) => item.id === id)?.element),
  );
}
