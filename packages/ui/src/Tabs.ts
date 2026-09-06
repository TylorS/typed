/**
 * Tabs separates active focus from selected tab and supports automatic or manual activation. List
 * handles orientation-aware movement; Tab publishes stable aria-controls state; Panel retains its
 * node while hidden.
 *
 * @remarks
 * The module keeps policy, state transitions, and DOM rendering separable so applications can use
 * the state and pure operations without mounting UI, or supply custom hosts without replacing native
 * events and browser-owned focus.
 *
 * Learn the interaction in the [Tabs guide](/explore/ui-tabs).
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
 * Controls whether moving focus also selects a tab.
 *
 * @remarks
 * The public model lets custom composites reuse Tabs's deterministic policy without copying an
 * internal shape.
 *
 * @since 1.0.0
 * @category Panel activation policy
 */
export type ActivationMode = "automatic" | "manual";
/**
 * Supported composite movement axes.
 *
 * @remarks
 * The public model lets custom composites reuse Tabs's deterministic policy without copying an
 * internal shape.
 *
 * @since 1.0.0
 * @category Tab navigation
 */
export type Orientation = "horizontal" | "vertical";

/**
 * The visible panel selection, focused tab identity, and activation policy.
 * Manual activation allows `activeId` to differ from `selectedId` until the user commits.
 *
 * @since 1.0.0
 * @category Selection and focus
 */
export interface State extends Omit<Composite.State, "orientation"> {
  /**
   * Axis used to interpret Arrow-key movement.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  readonly orientation: Orientation;
  /**
   * Id whose value is currently selected.
   * @since 1.0.0
   * @category Panel selection
   */
  readonly selectedId: string;
  /**
   * Id currently active for keyboard navigation; null means no active item.
   * @since 1.0.0
   * @category Keyboard focus
   */
  readonly activeId: string;
  /**
   * Whether tab focus also selects automatically or waits for explicit activation.
   * @since 1.0.0
   * @category Panel activation policy
   */
  readonly activationMode: ActivationMode;
}

/**
 * Initial Tabs values. The caller supplies value; activeId defaults to value, activation is
 * automatic, orientation horizontal, and loop true.
 *
 * @since 1.0.0
 * @category Selection and focus
 */
export interface InitialState {
  /**
   * Id whose value is currently selected.
   * @since 1.0.0
   * @category Panel selection
   */
  readonly selectedId: string;
  /**
   * Id currently active for keyboard navigation; null means no active item.
   * @since 1.0.0
   * @category Keyboard focus
   */
  readonly activeId?: string;
  /**
   * Whether tab focus also selects automatically or waits for explicit activation.
   * @since 1.0.0
   * @category Panel activation policy
   */
  readonly activationMode?: ActivationMode;
  /**
   * Axis used to interpret Arrow-key movement.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  readonly orientation?: Orientation;
  /**
   * Whether movement wraps between the first and last enabled items.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  readonly loop?: boolean;
  /**
   * Whether horizontal Arrow-key meaning is reversed for right-to-left layout.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  readonly rtl?: boolean;
}

/**
 * Effect Schema used by makeState to encode, decode, and hydrate Tabs state.
 *
 * @remarks
 * @example
 * ```ts
 * import * as Schema from "effect/Schema";
 * import * as Tabs from "@typed/ui/Tabs";
 *
 * const decodeState = Schema.decodeUnknownEffect(Tabs.StateSchema);
 * ```
 * @since 1.0.0
 * @category Selection and focus
 */
export const StateSchema = Schema.Struct({
  selectedId: Schema.String,
  activeId: Schema.String,
  activationMode: Schema.Literals(["automatic", "manual"]),
  orientation: Schema.Literals(["horizontal", "vertical"]),
  loop: Schema.Boolean,
  rtl: Schema.Boolean,
  virtualFocus: Schema.Boolean,
});

/**
 * Creates hydrated Tabs state. The caller supplies value; activeId defaults to value, activation
 * is automatic, orientation horizontal, and loop true.
 *
 * @remarks
 * The returned Effect creates the RefSubject when run. That state is renderer-independent;
 * collection registrations belong to the separate Scope that runs register or ref, not to state
 * creation.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as Tabs from "@typed/ui/Tabs";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* Tabs.makeState({ selectedId: "overview" });
 *     const collection = yield* Tabs.makeCollection();
 *     return { state: yield* state, collection: yield* collection };
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category Selection and focus
 */
export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, {
    selectedId: initial.selectedId,
    activeId: initial.activeId ?? initial.selectedId,
    activationMode: initial.activationMode ?? "automatic",
    orientation: initial.orientation ?? "horizontal",
    loop: initial.loop ?? true,
    rtl: initial.rtl ?? false,
    virtualFocus: false,
  });
}

/**
 * Creates a scoped Collection for Tabs items.
 *
 * @remarks
 * The returned Effect allocates the RefSubject in the caller's Scope. Each later registration is
 * owned by the Scope that runs register, independently of this construction Effect.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as Tabs from "@typed/ui/Tabs";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* Tabs.makeCollection();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category Tab registration
 */
export const makeCollection = Collection.makeState<string>;

/**
 * Selects a tab and makes it the active roving-focus item.
 *
 * @remarks
 * The operation exposes Tabs's transition directly so callers can compose it in Effect programs
 * and native event handlers.
 *
 * @since 1.0.0
 * @category Panel activation
 */
export function select<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  selectedId: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, activeId: selectedId, selectedId }));
}

/**
 * Moves activeId through registered tabs without selecting under manual activation.
 *
 * @remarks
 * The operation exposes Tabs's transition directly so callers can compose it in Effect programs
 * and native event handlers.
 *
 * @since 1.0.0
 * @category Tab navigation
 */
export function move<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  items: readonly Collection.Item[],
  direction: Composite.Move,
): Effect.Effect<State, E, R> {
  return Effect.gen(function* () {
    const current = yield* state;
    const activeId = Composite.moveActiveId(items, current, direction);
    if (activeId === null) return current;
    return yield* RefSubject.update(state, (value) => ({
      ...value,
      activeId,
      selectedId: value.activationMode === "automatic" ? activeId : value.selectedId,
    }));
  });
}

function moveAndFocus(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>>,
  direction: Composite.Move,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const next = yield* move(state, yield* collection, direction);
    yield* Composite.focusActive({ state, collection });
    yield* Composite.scrollActive({ state, collection });
    return next;
  });
}

/**
 * Inputs accepted by Tabs.List in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Tab list
 */
export interface ListOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
  /**
   * Accessible label rendered through aria-label.
   * @since 1.0.0
   * @category Accessible naming
   */
  readonly label?: Renderable.Any<string | null | undefined>;
  /**
   * Renderable tab content placed inside the tablist host.
   * @since 1.0.0
   * @category Item registration
   */
  readonly items?: readonly Collection.Item[];
  /**
   * Item registry used for collection-driven keyboard behavior and mounted ordering.
   * @since 1.0.0
   * @category Item registration
   */
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
}

function listInternalProps<const Options extends ListOptions>(options: Options) {
  const orientation = RefSubject.map(options.state, (state) => state.orientation);
  const onkeydown =
    options.collection === undefined && options.items === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn(function* (event: KeyboardEvent) {
            const direction = Composite.keyMove(event, yield* options.state);
            if (direction !== undefined) {
              event.preventDefault();
              if (options.collection !== undefined) {
                yield* moveAndFocus(options.state, options.collection, direction);
              } else {
                yield* move(options.state, options.items!, direction);
              }
              return;
            }
            if (
              (event.key === "Enter" || event.key === " ") &&
              (yield* options.state).activationMode === "manual"
            ) {
              event.preventDefault();
              yield* select(options.state, (yield* options.state).activeId);
            }
          }),
        );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "tablist",
      "aria-label": property("label", undefined),
      "aria-orientation": orientation,
      onkeydown,
      ref: options.state,
    }) as const;
}

type ListInternalProps<Options extends ListOptions> = ReturnType<
  ReturnType<typeof listInternalProps<Options>>
>;

/**
 * Renders the tablist and applies orientation-aware movement plus Enter/Space activation in manual
 * mode.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Tab list
 */
export function List<const Options extends ListOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ListInternalProps<Options>>,
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
    ListInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, listInternalProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

/**
 * Inputs accepted by Tabs.Tab in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Tab controls
 */
export interface TabOptions extends Dom.HostOptions<HTMLButtonElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Stable id used for collection identity and ARIA relationships.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly id: string;
  /**
   * Panel id emitted through the tab's aria-controls relationship.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly panelId: string;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
  /**
   * Item registry used for collection-driven keyboard behavior and mounted ordering.
   * @since 1.0.0
   * @category Item registration
   */
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  /**
   * Flag used by collection movement and widget handlers to skip activation by default.
   * @since 1.0.0
   * @category Availability
   */
  readonly disabled?: boolean;
}

function tabInternalProps<const Options extends TabOptions>(options: Options) {
  const selected = RefSubject.map(options.state, (state) => state.selectedId === options.id);
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: options.id,
          textValue: options.id,
          disabled: options.disabled,
        });
  return () =>
    ({
      id: options.id,
      type: "button",
      role: "tab",
      "aria-controls": options.panelId,
      "aria-selected": selected,
      "aria-disabled": options.disabled ?? false,
      tabindex: Composite.tabIndex(options.state, options.id),
      onclick: options.disabled === true ? Effect.void : select(options.state, options.id),
      onfocus:
        options.disabled === true
          ? Effect.void
          : RefSubject.update(options.state, (state) =>
              state.activationMode === "automatic"
                ? { ...state, activeId: options.id, selectedId: options.id }
                : { ...state, activeId: options.id },
            ),
      ref: Dom.composeRefs(register, options.ref),
    }) as const;
}

type TabInternalProps<Options extends TabOptions> = ReturnType<
  ReturnType<typeof tabInternalProps<Options>>
>;

/**
 * Renders and optionally registers a tab with stable aria-controls, selected state, and roving
 * tabindex.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Tab controls
 */
export function Tab<const Options extends TabOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, TabInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    TabInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    tabInternalProps(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

/**
 * Inputs accepted by Tabs.Panel in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Panel visibility
 */
export interface PanelOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Stable id used for collection identity and ARIA relationships.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly id: string;
  /**
   * Tab id emitted through the panel's aria-labelledby relationship.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly tabId: string;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function panelInternalProps<const Options extends PanelOptions>(options: Options) {
  const selected = RefSubject.map(options.state, (state) => state.selectedId === options.tabId);
  return () =>
    ({
      id: options.id,
      role: "tabpanel",
      "aria-labelledby": options.tabId,
      tabindex: 0,
      "?hidden": RefSubject.map(selected, (value) => !value),
    }) as const;
}

type PanelInternalProps<Options extends PanelOptions> = ReturnType<
  ReturnType<typeof panelInternalProps<Options>>
>;

/**
 * Renders a labelled tabpanel and hides it reactively when its tab is not selected.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Panel visibility
 */
export function Panel<const Options extends PanelOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, PanelInternalProps<Options>>,
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
    PanelInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    panelInternalProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}
