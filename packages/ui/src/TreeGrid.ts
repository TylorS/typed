/**
 * TreeGrid combines tree expansion with virtual-focus grid movement. Rows carry hierarchy and
 * expansion, cells carry column positions, and the root retains focus while aria-activedescendant
 * identifies the active cell.
 *
 * @remarks
 * The module keeps policy, state transitions, and DOM rendering separable so applications can use
 * the state and pure operations without mounting UI, or supply custom hosts without replacing native
 * events and browser-owned focus.
 *
 * Learn the interaction in the [TreeGrid guide](/explore/ui-tree-grid).
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
import * as Dom from "./Dom.js";
import * as Grid from "./Grid.js";
import type { HostResult } from "./Dom/Types.js";
import * as Tree from "./Tree.js";

/**
 * Tree expansion state reused for a grid whose active ID names a cell.
 * `expandedIds` names parent rows, while `activeId` names the active cell within a row.
 *
 * @since 1.0.0
 * @category Hierarchy and cell focus
 */
export type State = Tree.State;
/**
 * Initial TreeGrid values. Uses Tree state and defaults.
 *
 * @since 1.0.0
 * @category Hierarchy and cell focus
 */
export type InitialState = Tree.InitialState;
/**
 * Effect Schema used by makeState to encode, decode, and hydrate TreeGrid state.
 *
 * @remarks
 * @example
 * ```ts
 * import * as Schema from "effect/Schema";
 * import * as TreeGrid from "@typed/ui/TreeGrid";
 *
 * const decodeState = Schema.decodeUnknownEffect(TreeGrid.StateSchema);
 * ```
 * @since 1.0.0
 * @category Hierarchy and cell focus
 */
export const StateSchema = Tree.StateSchema;
/**
 * Creates hydrated TreeGrid state. Uses Tree state and defaults.
 *
 * @remarks
 * The returned Effect creates the RefSubject when run. That state is renderer-independent;
 * collection registrations belong to the separate Scope that runs register or ref, not to state
 * creation.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as TreeGrid from "@typed/ui/TreeGrid";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* TreeGrid.makeState({});
 *     const collection = yield* TreeGrid.makeCollection();
 *     return { state: yield* state, collection: yield* collection };
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category Hierarchy and cell focus
 */
export const makeState = Tree.makeState;
/**
 * Tests membership in expandedIds without touching the DOM; this is the Tree helper exposed from
 * the TreeGrid entrypoint.
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
 * import * as TreeGrid from "@typed/ui/TreeGrid";
 *
 * const expanded = TreeGrid.isExpanded({ activeId: null, expandedIds: ["parent"], loop: true }, "parent");
 * ```
 * @since 1.0.0
 * @category Row expansion
 */
export const isExpanded = Tree.isExpanded;
/**
 * Adds a row id once to expandedIds using the Tree state transition.
 *
 * @remarks
 * The operation exposes TreeGrid's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * @since 1.0.0
 * @category Row expansion
 */
export const expand = Tree.expand;
/**
 * Removes a row id from expandedIds using the Tree state transition.
 *
 * @remarks
 * The operation exposes TreeGrid's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * @since 1.0.0
 * @category Row expansion
 */
export const collapse = Tree.collapse;
/**
 * Sets the active TreeGrid row or cell id without changing expansion.
 *
 * @remarks
 * The operation exposes TreeGrid's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * @since 1.0.0
 * @category Hierarchy and cell focus
 */
export const activate = Tree.activate;

/**
 * Logical coordinates stored with each registered TreeGrid cell.
 *
 * @remarks
 * The public model lets custom composites reuse TreeGrid's deterministic policy without copying an
 * internal shape.
 *
 * @since 1.0.0
 * @category Cell registration
 */
export interface CellPosition extends Grid.CellPosition {
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
 * Creates a scoped Collection for TreeGrid items.
 *
 * @remarks
 * The returned Effect allocates the RefSubject in the caller's Scope. Each later registration is
 * owned by the Scope that runs register, independently of this construction Effect.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as TreeGrid from "@typed/ui/TreeGrid";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* TreeGrid.makeCollection();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category Cell registration
 */
export const makeCollection = Collection.makeState<CellPosition>;

/**
 * Inputs accepted by TreeGrid.Root in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Treegrid surface
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
  readonly collection?: RefSubject.RefSubject<Collection.State<CellPosition>>;
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
          const first = visibleItems(yield* options.collection!, current)[0];
          if (first !== undefined) yield* activate(options.state, first.id);
        });
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn((event: KeyboardEvent) => onKeyDown(options.state, options.collection!, event)),
        );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "treegrid",
      tabindex: 0,
      "aria-label": property("label", undefined),
      "aria-activedescendant": RefSubject.map(
        options.state,
        (state) => state.activeId ?? undefined,
      ),
      onfocus,
      onkeydown,
      ref: options.state,
    }) as const;
}
type RootInternalProps<Options extends RootOptions> = ReturnType<
  ReturnType<typeof rootInternalProps<Options>>
>;

/**
 * Renders the focus-owning treegrid root and applies combined grid and expansion keys.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Treegrid surface
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
 * Inputs accepted by TreeGrid.Row in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Hierarchical rows
 */
export interface RowOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Stable logical row identity used by vertical grid movement.
   * @since 1.0.0
   * @category Row identity
   */
  readonly rowId: string;
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
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function rowInternalProps<const Options extends RowOptions>(options: Options) {
  const hasChildren = options.hasChildren ?? false;
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      id: options.rowId,
      role: "row",
      "aria-level": property("level", 1),
      "aria-expanded": hasChildren
        ? RefSubject.map(options.state, (state) => isExpanded(state, options.rowId))
        : undefined,
    }) as const;
}
type RowInternalProps<Options extends RowOptions> = ReturnType<
  ReturnType<typeof rowInternalProps<Options>>
>;

/**
 * Renders a hierarchical row with level and optional expanded state.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Hierarchical rows
 */
export function Row<const Options extends RowOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, RowInternalProps<Options>>,
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
    RowInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    rowInternalProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

/**
 * Inputs accepted by TreeGrid.Cell in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Navigable cells
 */
export interface CellOptions extends Dom.HostOptions<HTMLDivElement> {
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
  readonly collection?: RefSubject.RefSubject<Collection.State<CellPosition>>;
  /**
   * Stable id used for collection identity and ARIA relationships.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly id: string;
  /**
   * Stable logical row identity used by vertical grid movement.
   * @since 1.0.0
   * @category Row identity
   */
  readonly rowId: string;
  /**
   * Caller-supplied column index used for movement and emitted unchanged as aria-colindex; ARIA
   * indexes are one-based.
   * @since 1.0.0
   * @category Cell position
   */
  readonly columnIndex: number;
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
  readonly hasChildren?: boolean;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function cellInternalProps<const Options extends CellOptions>(options: Options) {
  const active = RefSubject.map(options.state, (state) => state.activeId === options.id);
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: {
            rowId: options.rowId,
            columnIndex: options.columnIndex,
            parentId: options.parentId,
            hasChildren: options.hasChildren ?? false,
          },
          textValue: options.id,
        });
  return () =>
    ({
      id: options.id,
      role: "gridcell",
      "aria-colindex": options.columnIndex,
      "?data-active": active,
      ref: register,
    }) as const;
}
type CellInternalProps<Options extends CellOptions> = ReturnType<
  ReturnType<typeof cellInternalProps<Options>>
>;

/**
 * Renders and optionally registers one gridcell with row and column coordinates.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Navigable cells
 */
export function Cell<const Options extends CellOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, CellInternalProps<Options>>,
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
    CellInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, cellInternalProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

/**
 * Inputs accepted by TreeGrid.Group in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Child row visibility
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
      role: "rowgroup",
      "?hidden": RefSubject.map(options.state, (state) => !isExpanded(state, options.parentId)),
    }) as const;
}
type GroupInternalProps<Options extends GroupOptions> = ReturnType<
  ReturnType<typeof groupInternalProps<Options>>
>;

/**
 * Renders a rowgroup and hides it while its parent row is collapsed.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Child row visibility
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
  collection: RefSubject.RefSubject<Collection.State<CellPosition>>,
  event: KeyboardEvent,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const current = yield* state;
    const all = yield* collection;
    const visible = visibleItems(all, current);
    const active =
      current.activeId === null ? undefined : all.find((item) => item.id === current.activeId);
    const activeValue = active?.value;
    if (
      activeValue?.columnIndex === 1 &&
      (event.key === "ArrowRight" || event.key === "ArrowLeft")
    ) {
      if (event.key === "ArrowRight" && activeValue.hasChildren) {
        event.preventDefault();
        if (!isExpanded(current, activeValue.rowId)) return yield* expand(state, activeValue.rowId);
        const child = visible.find(
          (item) => item.value?.parentId === activeValue.rowId && item.value?.columnIndex === 1,
        );
        return child === undefined ? current : yield* activate(state, child.id);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (activeValue.hasChildren && isExpanded(current, activeValue.rowId))
          return yield* collapse(state, activeValue.rowId);
        const parent =
          activeValue.parentId === undefined
            ? undefined
            : visible.find(
                (item) =>
                  item.value?.rowId === activeValue.parentId && item.value?.columnIndex === 1,
              );
        return parent === undefined ? current : yield* activate(state, parent.id);
      }
    }
    const next = Grid.moveActiveId(visible, current.activeId, event);
    if (next === undefined) return current;
    event.preventDefault();
    return yield* activate(state, next);
  });
}

function visibleItems(
  items: Collection.State<CellPosition>,
  state: State,
): readonly Collection.Item<CellPosition>[] {
  const ordered = Collection.byDomOrder(items);
  return ordered.filter((item) => {
    let parentId = item.value?.parentId;
    while (parentId !== undefined) {
      if (!isExpanded(state, parentId)) return false;
      parentId = ordered.find((candidate) => candidate.value?.rowId === parentId)?.value?.parentId;
    }
    return true;
  });
}
